# Tracearr Project Context

## Current Session Context (Survives Compaction)

### Active Work: Multi-Server Support Implementation
**Plan Document**: `docs/plans/multi-server-implementation-plan.md`

### Progress Checkpoint (Last Updated: Session Active)

**COMPLETED:**
- Phase 1.1: Added `userId` column to `mobile_sessions` in `apps/server/src/db/schema.ts`
- Phase 1.2: Added `mobileSessionsRelations`, `mobileTokensRelations`, updated `usersRelations`
- Phase 1.3: Generated migration `apps/server/src/db/migrations/0010_fair_zuras.sql`
- Phase 2.1: Created `apps/server/src/utils/serverFiltering.ts` utility
- Phase 2.2: Fixed `apps/server/src/routes/sessions.ts` - uses `inArray()` for multi-server
- Phase 2.3: Fixed `apps/server/src/routes/users/list.ts` - uses `inArray()` for multi-server

**IN PROGRESS:**
- Phase 2.4: Add serverId filter to `/stats/dashboard` endpoint

**REMAINING Phase 2 (Backend):**
- Phase 2.4: `/stats/dashboard` - add serverId query param
- Phase 2.5: `/stats/plays` - add serverId query param
- Phase 2.6: `/stats/users` - add serverId query param
- Phase 2.7: `/stats/content` - add serverId query param
- Phase 2.8: `/stats/quality` - add serverId query param
- Phase 2.9: `/rules` - add server JOIN and filter
- Phase 2.10: `/violations` - add server JOIN and filter
- Phase 2.11: `mobile.ts` - capture userId in pairing flow

**REMAINING Phase 3 (Web Frontend):**
- Phase 3.1-3.18: Create ServerContext, ServerSelector, update all pages/hooks

**REMAINING Phase 4 (Mobile):**
- Not yet added to task list - will add after Phase 3

### Key Files Modified
- `apps/server/src/db/schema.ts` - Added userId to mobileSessions
- `apps/server/src/db/migrations/0010_fair_zuras.sql` - Migration (clears mobile_sessions)
- `apps/server/src/utils/serverFiltering.ts` - NEW utility for server access control
- `apps/server/src/routes/sessions.ts` - Fixed multi-server filtering
- `apps/server/src/routes/users/list.ts` - Fixed multi-server filtering

### Key Decisions Made
- Server selector location: **Top-left of sidebar** (web)
- Mobile: Header dropdown with bottom sheet
- No "All Servers" aggregate view - users see only selected server's data
- Breaking change: Mobile users must re-pair after migration

### Utility Functions Created
Located in `apps/server/src/utils/serverFiltering.ts`:
- `buildServerAccessCondition(authUser, column)` - SQL WHERE for user's servers
- `buildServerFilterCondition(authUser, serverId, column)` - Validates + filters by explicit serverId
- `filterByServerAccess(items, authUser)` - Post-query array filtering
- `hasServerAccess(authUser, serverId)` - Boolean check
- `validateServerAccess(authUser, serverId)` - Returns error message or null
