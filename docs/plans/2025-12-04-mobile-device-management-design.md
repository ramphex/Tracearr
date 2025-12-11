# Mobile Device Management Redesign

## Overview

Redesign mobile device pairing to support multiple devices without invalidating existing sessions. Add individual device deletion and fix copy token bug.

## Problem Statement

Current architecture:
- Single global pairing token, shown once on enable
- To show QR again, must rotate token which kicks ALL paired devices
- No way to delete individual devices
- Copy token button fails silently

User needs:
- Add multiple devices without affecting existing ones
- Remove individual devices
- Per-device management

## Solution: One-Time Pairing Tokens

### New Flow

```
Enable Mobile → Mobile access is "on" (no token yet)
Add Device → Generate one-time token (expires 15 min) → Scan QR → Device paired → Token consumed
Add Device → Generate another one-time token → Scan QR → Second device paired
Remove Device → Delete single session, others unaffected
```

## Database Changes

### `settings` table addition

```sql
ALTER TABLE settings
  ADD COLUMN mobile_enabled BOOLEAN NOT NULL DEFAULT FALSE;
```

### `mobileTokens` table (revised)

Remove `isEnabled` and `rotatedAt`. Add expiry and audit fields.

```sql
id: UUID PRIMARY KEY
tokenHash: VARCHAR(64) UNIQUE NOT NULL
expiresAt: TIMESTAMP NOT NULL  -- created + 15 minutes
createdAt: TIMESTAMP NOT NULL DEFAULT NOW()
createdBy: UUID REFERENCES users(id) ON DELETE CASCADE
usedAt: TIMESTAMP  -- set on successful pair, NULL = unused
```

### `mobileSessions` table

No schema changes needed - `createdAt` already exists.

### Token Cleanup

Tokens are marked `usedAt` on successful pair (not deleted immediately for audit trail). Background cleanup removes:
- Expired unused tokens older than 1 hour
- Used tokens older than 30 days

## API Changes

### New Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/mobile/pair-token` | Generate one-time pairing token (owner only) |
| `DELETE` | `/mobile/sessions/:id` | Remove single device (owner only) |

### Modified Endpoints

| Method | Endpoint | Change |
|--------|----------|--------|
| `GET` | `/mobile` | Returns `{ isEnabled, sessions }` - no token field |
| `POST` | `/mobile/enable` | Sets `mobile_enabled = true` in settings, no token generated |
| `POST` | `/mobile/disable` | Sets `mobile_enabled = false`, revokes all sessions, deletes pending tokens |
| `POST` | `/mobile/pair` | Validates token exists AND not expired, marks token as used, creates session (transactional) |

### Removed Endpoints

| Method | Endpoint | Reason |
|--------|----------|--------|
| `POST` | `/mobile/rotate` | No longer needed - tokens are one-time use |

### Endpoint Details

#### `POST /mobile/pair-token`

**Rate limiting:** Max 3 tokens per 5 minutes per owner

**Limits:**
- Max 3 pending (unexpired, unused) tokens at a time
- Max 5 paired devices total

**Response:**
```json
{
  "token": "trr_mob_...",
  "expiresAt": "2025-12-04T15:30:00Z"
}
```

#### `DELETE /mobile/sessions/:id`

**Authorization:** Owner only

**Actions:**
1. Delete session from `mobileSessions` table
2. Delete refresh token from Redis
3. `notificationPreferences` cascade-deleted via FK

**Response:**
```json
{
  "success": true
}
```

#### `POST /mobile/pair` (modified)

**Critical:** Must use database transaction with row-level locking to prevent race conditions.

```typescript
await db.transaction(async (tx) => {
  // SELECT FOR UPDATE locks the row
  const [token] = await tx.select()
    .from(mobileTokens)
    .where(eq(mobileTokens.tokenHash, tokenHash))
    .for('update')
    .limit(1);

  if (!token || token.expiresAt < new Date() || token.usedAt) {
    throw new Error('Invalid, expired, or already used token');
  }

  // Create session
  await tx.insert(mobileSessions).values({...});

  // Mark token as used (not deleted - for audit trail)
  await tx.update(mobileTokens)
    .set({ usedAt: new Date() })
    .where(eq(mobileTokens.id, token.id));
});
```

## Limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Token expiry | 15 minutes | Balance security and UX |
| Max pending tokens | 3 | Prevent token explosion |
| Max paired devices | 5 | Reasonable for personal use |
| Token generation rate | 3 per 5 min | Prevent abuse |

## UI Changes

### Mobile Settings Section

1. **Enable/Disable toggle** - Controls `mobile_enabled` setting
2. **"Add Device" button** - Generates new one-time token, shows QR code with 15-min countdown
3. **Device list** - Shows all paired devices with:
   - Device name
   - Platform (iOS/Android)
   - Created date (when first paired)
   - Last seen date
   - Delete button (with confirmation modal)
4. **"Revoke All" button** - Bulk delete all devices

### Copy Token Fix

Add try/catch and toast feedback to clipboard operation:

```typescript
const handleCopyToken = async () => {
  if (!config?.token) return;

  try {
    await navigator.clipboard.writeText(config.token);
    toast({ title: 'Token copied to clipboard' });
  } catch (err) {
    toast({
      title: 'Failed to copy',
      description: 'Please select and copy manually',
      variant: 'destructive'
    });
  }
};
```

## Migration Path

### Phase 1: Schema Migration

```sql
-- 1. Add mobile_enabled to settings
ALTER TABLE settings
  ADD COLUMN mobile_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Migrate existing state
UPDATE settings SET mobile_enabled = (
  SELECT COALESCE(is_enabled, FALSE)
  FROM mobile_tokens
  LIMIT 1
);

-- 3. Update mobile_tokens schema
ALTER TABLE mobile_tokens
  DROP COLUMN IF EXISTS is_enabled,
  DROP COLUMN IF EXISTS rotated_at,
  ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN used_at TIMESTAMP WITH TIME ZONE;

-- 4. Clear existing tokens (they used old format)
DELETE FROM mobile_tokens;
```

### Phase 2: Backend Implementation

1. Update `GET /mobile` to read `mobile_enabled` from settings
2. Update `POST /mobile/enable` to set settings flag only
3. Update `POST /mobile/disable` to clear settings flag + cleanup
4. Implement `POST /mobile/pair-token` with rate limiting
5. Update `POST /mobile/pair` with transactions and row locking
6. Implement `DELETE /mobile/sessions/:id`
7. Remove `POST /mobile/rotate` endpoint

### Phase 3: Frontend Implementation

1. Update mobile settings UI with new "Add Device" flow
2. Add device deletion with confirmation modal
3. Fix copy token button
4. Add token expiry countdown display

## Security Considerations

1. **Transaction wrapping** - Token deletion race condition prevented
2. **Row-level locking** - Concurrent pairing race condition prevented
3. **Rate limiting** - Token generation abuse prevented
4. **Single-use tokens** - Blast radius limited vs global token
5. **Audit trail** - `usedAt` and `createdBy` fields for investigation

## Out of Scope

- Device nickname/rename support
- Push notifications when new device pairs
- Configurable limits (hardcoded for now)
