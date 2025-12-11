# Time Range Selector Implementation Plan

**Created:** 2025-12-10
**Status:** Planning
**Goal:** Add "All Time" and custom date range support to all stats/analytics views

---

## Table of Contents
1. [Overview](#overview)
2. [Data Strategy](#data-strategy)
3. [Phase 1: Backend Schema & Utilities](#phase-1-backend-schema--utilities)
4. [Phase 2: Backend Endpoint Updates](#phase-2-backend-endpoint-updates)
5. [Phase 3: Web UI Implementation](#phase-3-web-ui-implementation)
6. [Phase 4: Testing & Validation](#phase-4-testing--validation)
7. [Key Files Reference](#key-files-reference)
8. [Future: Mobile UI Implementation](#future-mobile-ui-implementation)

---

## Overview

### Current State
- **Available periods:** `day`, `week`, `month`, `year` (UI shows only `week`, `month`, `year`)
- **Implementation:** `getDateRange()` in `apps/server/src/routes/stats/utils.ts`
- **Schema:** `statsQuerySchema` in `packages/shared/src/schemas.ts`
- **UI Components:**
  - Web: `apps/web/src/components/ui/period-selector.tsx`
  - Mobile: `apps/mobile/src/components/ui/period-selector.tsx`

### Target State
- **New periods:** `all` (all time), `custom` (arbitrary date range)
- **New parameters:** `startDate`, `endDate` for custom ranges
- **URL sync:** Web dashboard URLs will be shareable with time range
- **Accuracy:** 100% exact counts for ALL queries (no approximation)

---

## Data Strategy

### Why Raw Queries Only (No Hybrid Approach)

**Database Analysis (2025-12-10):**
```
Total sessions: ~8,200 over 2 years
Last 30 days: ~550 sessions
Last year: ~5,700 sessions
```

**Performance Benchmarks:**
- All-time `COUNT(DISTINCT)` on 8k rows: **24ms execution**
- Planning overhead: ~730ms (acceptable for dashboard use)

### Decision: Always Use Raw `sessions` Table

| Consideration | Result |
|--------------|--------|
| Execution time | 24ms - negligible |
| Data accuracy | 100% exact (no HyperLogLog approximation) |
| Code complexity | Simple - no conditional query routing |
| Scalability | Even at 80k sessions (10x), still sub-second |
| User experience | No confusing "approximate" indicators |

**Continuous aggregates exist but are NOT needed for this data volume.**
They remain available for future use if data grows to millions of rows.

### Query Pattern

All stats endpoints will use the same simple pattern:
```typescript
// For preset periods (day, week, month, year)
WHERE started_at >= ${startDate}

// For all-time (no lower bound)
// Simply omit the WHERE clause on started_at

// For custom range
WHERE started_at >= ${startDate} AND started_at < ${endDate}
```

---

## Phase 1: Backend Schema & Utilities

### Task 1.1: Update Shared Schema
**File:** `packages/shared/src/schemas.ts`

**Current:**
```typescript
export const statsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('week'),
  serverId: uuidSchema.optional(),
});
```

**New:**
```typescript
export const statsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year', 'all', 'custom']).default('week'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  serverId: uuidSchema.optional(),
}).refine(data => {
  // Custom period requires both dates
  if (data.period === 'custom') {
    return data.startDate && data.endDate;
  }
  return true;
}, { message: 'Custom period requires startDate and endDate' })
.refine(data => {
  // If dates provided, start must be before end
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, { message: 'startDate must be before endDate' });

export type StatsQueryInput = z.infer<typeof statsQuerySchema>;
```

### Task 1.2: Update Date Range Utility
**File:** `apps/server/src/routes/stats/utils.ts`

**Add new types and functions:**
```typescript
export type StatsPeriod = 'day' | 'week' | 'month' | 'year' | 'all' | 'custom';

export interface DateRange {
  start: Date | null; // null means "all time" (no lower bound)
  end: Date;
}

/**
 * Resolves period/custom dates into a concrete date range.
 * All queries use raw sessions table (no aggregates needed at current data volume).
 *
 * @param period - The period type
 * @param startDate - Custom start date (ISO string)
 * @param endDate - Custom end date (ISO string)
 * @returns DateRange with start (null for all-time) and end dates
 */
export function resolveDateRange(
  period: StatsPeriod,
  startDate?: string,
  endDate?: string
): DateRange {
  const now = new Date();

  switch (period) {
    case 'day':
      return { start: new Date(now.getTime() - TIME_MS.DAY), end: now };
    case 'week':
      return { start: new Date(now.getTime() - TIME_MS.WEEK), end: now };
    case 'month':
      return { start: new Date(now.getTime() - 30 * TIME_MS.DAY), end: now };
    case 'year':
      return { start: new Date(now.getTime() - 365 * TIME_MS.DAY), end: now };
    case 'all':
      return { start: null, end: now };
    case 'custom':
      return {
        start: startDate ? new Date(startDate) : null,
        end: endDate ? new Date(endDate) : now
      };
  }
}

// Keep old function for backward compatibility during migration
export function getDateRange(period: 'day' | 'week' | 'month' | 'year'): Date {
  // ... existing implementation unchanged
}
```

### Task 1.3: Create SQL Helper for Date Filtering
**File:** `apps/server/src/routes/stats/utils.ts` (add to existing file)

```typescript
import { sql, SQL } from 'drizzle-orm';

/**
 * Builds SQL WHERE clause fragment for date range filtering.
 * Returns empty SQL if start is null (all-time query).
 */
export function buildDateRangeFilter(
  range: DateRange,
  column: SQL = sql`started_at`
): SQL {
  if (!range.start) {
    // All-time: no lower bound filter
    return sql``;
  }
  // Has start date: filter from start to end
  return sql`AND ${column} >= ${range.start} AND ${column} < ${range.end}`;
}
```

---

## Phase 2: Backend Endpoint Updates

Each endpoint needs to:
1. Accept new schema parameters (`period`, `startDate`, `endDate`)
2. Use `resolveDateRange()` to get concrete dates
3. Update SQL queries to handle null start date (all-time)

### Task 2.1: Update `/stats/plays`
**File:** `apps/server/src/routes/stats/plays.ts`

**Changes:**
- Parse new schema with `period`, `startDate`, `endDate`
- Call `resolveDateRange()`
- Update WHERE clause to use `buildDateRangeFilter()`
- Handle null start date case

### Task 2.2: Update `/stats/plays-by-dayofweek`
**File:** `apps/server/src/routes/stats/plays.ts`

**Changes:** Same pattern as 2.1

### Task 2.3: Update `/stats/plays-by-hourofday`
**File:** `apps/server/src/routes/stats/plays.ts`

**Changes:** Same pattern as 2.1

### Task 2.4: Update `/stats/quality`
**File:** `apps/server/src/routes/stats/quality.ts`

**Endpoints to update:**
- `GET /quality` - Direct vs transcode breakdown
- `GET /platforms` - Plays by platform
- `GET /watch-time` - Total watch time
- `GET /concurrent` - Peak concurrent streams

**Changes:** Same pattern - add new params, use `resolveDateRange()`

### Task 2.5: Update `/stats/content`
**File:** `apps/server/src/routes/stats/content.ts`

**Endpoint:** `GET /top-content`

**Changes:** Same pattern as above

### Task 2.6: Update `/stats/users`
**File:** `apps/server/src/routes/stats/users.ts`

**Endpoints:**
- `GET /stats/users` - Per-user play counts
- `GET /top-users` - User leaderboard

**Changes:** Same pattern as above

### Task 2.7: Update `/stats/locations`
**File:** `apps/server/src/routes/stats/locations.ts`

**Current:** Uses `days` numeric parameter (different from other endpoints)
**Decision:** Migrate to unified schema for consistency

**Changes:**
- Replace `days` param with `period`, `startDate`, `endDate`
- Update `locationStatsQuerySchema` to extend base `statsQuerySchema`
- Deprecate `days` parameter (or keep for backward compat)

### Task 2.8: Update `/stats/dashboard`
**File:** `apps/server/src/routes/stats/dashboard.ts`

**Note:** Dashboard may need different handling - verify current implementation and update accordingly.

---

## Phase 3: Web UI Implementation

### Task 3.1: Install Date Range Picker Dependencies
```bash
cd apps/web
pnpm add date-fns react-day-picker
```

**Note:** `react-day-picker` is likely already installed (shadcn Calendar uses it).

### Task 3.2: Create DateRangePicker Component
**File:** `apps/web/src/components/ui/date-range-picker.tsx`

Based on [date-range-picker-for-shadcn](https://github.com/johnpolacek/date-range-picker-for-shadcn)

**Features:**
- Preset buttons: 24h, 7d, 30d, 90d, 1y, All
- Calendar for custom range selection
- Shows selected range in button text
- Fires `onChange` with `{ period, startDate?, endDate? }`

**Presets Configuration:**
```typescript
const PRESETS = [
  { label: '24h', value: 'day' },
  { label: '7d', value: 'week' },
  { label: '30d', value: 'month' },
  { label: '90d', value: 'quarter' }, // Maps to custom with 90-day range
  { label: '1y', value: 'year' },
  { label: 'All', value: 'all' },
] as const;
```

### Task 3.3: Add URL State Management
**File:** `apps/web/src/hooks/useTimeRange.ts` (NEW)

```typescript
import { useSearchParams } from 'react-router-dom';

export function useTimeRange() {
  const [searchParams, setSearchParams] = useSearchParams();

  const period = (searchParams.get('period') ?? 'week') as StatsPeriod;
  const startDate = searchParams.get('from') ?? undefined;
  const endDate = searchParams.get('to') ?? undefined;

  const setTimeRange = (params: {
    period: StatsPeriod;
    startDate?: string;
    endDate?: string;
  }) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('period', params.period);

    if (params.startDate) newParams.set('from', params.startDate);
    else newParams.delete('from');

    if (params.endDate) newParams.set('to', params.endDate);
    else newParams.delete('to');

    setSearchParams(newParams, { replace: true });
  };

  return { period, startDate, endDate, setTimeRange };
}
```

### Task 3.4: Update API Client
**File:** `apps/web/src/lib/api.ts`

Update all stats methods to accept new parameters:
```typescript
plays: async (params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
  serverId?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.period) searchParams.set('period', params.period);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  if (params?.serverId) searchParams.set('serverId', params.serverId);
  return fetchApi(`/stats/plays?${searchParams}`);
}
```

### Task 3.5: Update Query Hooks
**File:** `apps/web/src/hooks/queries/useStats.ts`

Update hooks to accept and pass new parameters:
```typescript
export function usePlaysStats(
  period: StatsPeriod = 'week',
  serverId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['stats', 'plays', period, serverId, startDate, endDate],
    queryFn: () => api.stats.plays({ period, serverId, startDate, endDate }),
  });
}
```

### Task 3.6: Update Stats Pages
**Files:**
- `apps/web/src/pages/stats/Activity.tsx`
- `apps/web/src/pages/stats/Library.tsx`
- `apps/web/src/pages/stats/Users.tsx`

**Changes:**
1. Replace `PeriodSelector` with `DateRangePicker`
2. Use `useTimeRange()` hook for URL state
3. Pass all params to query hooks

**Example refactor:**
```typescript
// Before
const [period, setPeriod] = useState<StatsPeriod>('month');
const { data } = usePlaysStats(period, selectedServerId);

// After
const { period, startDate, endDate, setTimeRange } = useTimeRange();
const { data } = usePlaysStats(period, selectedServerId, startDate, endDate);
```

### Task 3.7: Remove Old PeriodSelector
**File:** `apps/web/src/components/ui/period-selector.tsx`

Delete after migration complete. All usages replaced by `DateRangePicker`.

---

## Phase 4: Testing & Validation

### Task 4.1: Backend Unit Tests
- Test `resolveDateRange()` with all period types
- Test schema validation (custom without dates should fail)
- Test that all-time queries return data from entire history

### Task 4.2: Integration Testing
- Test each stats endpoint with:
  - `period=week` (existing behavior)
  - `period=all` (new)
  - `period=custom&startDate=...&endDate=...` (new)
- Verify response data is correct for each range

### Task 4.3: Web E2E Tests
- Test preset selection updates URL
- Test custom range selection via calendar
- Test page refresh preserves selection
- Test URL with params loads correct data

---

## Key Files Reference

### Backend
| File | Purpose |
|------|---------|
| `packages/shared/src/schemas.ts` | Zod validation schemas |
| `apps/server/src/routes/stats/utils.ts` | Date range utilities |
| `apps/server/src/routes/stats/plays.ts` | Play stats endpoints |
| `apps/server/src/routes/stats/quality.ts` | Quality stats endpoints |
| `apps/server/src/routes/stats/content.ts` | Content stats endpoints |
| `apps/server/src/routes/stats/users.ts` | User stats endpoints |
| `apps/server/src/routes/stats/locations.ts` | Location stats endpoint |
| `apps/server/src/routes/stats/dashboard.ts` | Dashboard endpoint |

### Web Frontend
| File | Purpose |
|------|---------|
| `apps/web/src/components/ui/period-selector.tsx` | OLD - to be deleted |
| `apps/web/src/components/ui/date-range-picker.tsx` | NEW - date range picker |
| `apps/web/src/hooks/useTimeRange.ts` | NEW - URL state hook |
| `apps/web/src/hooks/queries/useStats.ts` | React Query hooks |
| `apps/web/src/lib/api.ts` | API client |
| `apps/web/src/pages/stats/Activity.tsx` | Activity page |
| `apps/web/src/pages/stats/Library.tsx` | Library page |
| `apps/web/src/pages/stats/Users.tsx` | Users page |

---

## Progress Tracking

### Phase 1: Backend Schema & Utilities
- [ ] 1.1: Update shared schema
- [ ] 1.2: Update date range utility (`resolveDateRange`)
- [ ] 1.3: Create SQL helper (`buildDateRangeFilter`)

### Phase 2: Backend Endpoints
- [ ] 2.1: `/stats/plays`
- [ ] 2.2: `/stats/plays-by-dayofweek`
- [ ] 2.3: `/stats/plays-by-hourofday`
- [ ] 2.4: `/stats/quality` (all endpoints)
- [ ] 2.5: `/stats/content`
- [ ] 2.6: `/stats/users` (all endpoints)
- [ ] 2.7: `/stats/locations`
- [ ] 2.8: `/stats/dashboard`

### Phase 3: Web UI
- [ ] 3.1: Install dependencies (if needed)
- [ ] 3.2: Create DateRangePicker
- [ ] 3.3: Add URL state hook
- [ ] 3.4: Update API client
- [ ] 3.5: Update query hooks
- [ ] 3.6: Update stats pages
- [ ] 3.7: Remove old PeriodSelector

### Phase 4: Testing
- [ ] 4.1: Backend unit tests
- [ ] 4.2: Integration testing
- [ ] 4.3: Web E2E tests

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12-10 | Use raw queries only (no hybrid approach) | Data volume ~8k sessions; 24ms all-time query is fast enough |
| 2025-12-10 | 100% exact accuracy for all queries | No need for HyperLogLog approximation at this scale |
| 2025-12-10 | Store time range in URL params | Shareable dashboard links |
| 2025-12-10 | Use bottom sheet for mobile custom range | Standard mobile pattern, saves screen space |
| 2025-12-10 | Keep continuous aggregates available | Future-proofing if data grows to millions of rows |
| 2025-12-10 | Defer mobile UI to future phase | Complete web implementation first, then port to mobile |

---

## Future: Mobile UI Implementation

> **Status:** Deferred until web implementation is complete and tested.

### Overview
Once web is 100% complete, port the time range selector to mobile using native patterns.

### Dependencies to Install
```bash
cd apps/mobile
npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
```

### Components to Create

**TimeRangeSelector** (`apps/mobile/src/components/ui/time-range-selector.tsx`)
- Horizontal scrollable chip/segment row for presets
- Same presets as web: 24h, 7d, 30d, 90d, 1y, All, Custom
- "Custom" option triggers bottom sheet

**CustomDateRangeSheet** (`apps/mobile/src/components/ui/custom-date-range-sheet.tsx`)
- `@gorhom/bottom-sheet` modal
- Two date pickers (start, end) using `@react-native-community/datetimepicker`
- "Apply" and "Cancel" buttons

### Files to Update
- `apps/mobile/src/lib/api.ts` - Add `startDate`, `endDate` params
- `apps/mobile/src/app/(tabs)/activity.tsx` - Replace `PeriodSelector`
- Any other screens using `PeriodSelector`

### Testing
- Test all presets
- Test custom range bottom sheet
- Test landscape/portrait modes
- Test on iOS and Android
