# Multi-Server Support Implementation Plan

## Overview

This document outlines all changes required to support multiple Plex/Jellyfin/Emby servers per user in Tracearr. The implementation is organized into phases with clear dependencies.

**Decision**: No "All Servers" aggregate view - users can only see data from their selected server.

---

## Progress Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Database Schema | ✅ Complete | Migration generated, userId added to mobile_sessions |
| Phase 2: Backend API | ✅ Complete | All routes updated with serverId filtering |
| Phase 3: Web Frontend | ✅ Complete | ServerContext, ServerSelector, all pages updated |
| Phase 4: Mobile App | 🔲 Not Started | Multi-server storage, API client, UI updates |
| Phase 5: Testing | 🔲 Not Started | Integration tests for multi-server scenarios |

---

## Phase 1: Database Schema Fixes (CRITICAL) ✅ COMPLETE

### 1.1 Add `userId` to `mobile_sessions` table

**File**: `apps/server/src/db/schema.ts`

**Current Issue**: Mobile sessions have no link to users, breaking multi-user mobile support.

**Changes**:
```typescript
// In mobileSessions table definition, add:
userId: uuid('user_id')
  .notNull()
  .references(() => users.id, { onDelete: 'cascade' }),

// Add index
index('mobile_sessions_user_idx').on(table.userId),
```

**Migration Required**: Yes - must clear existing mobile sessions (breaking change for mobile users who will need to re-pair).

**Migration SQL**:
```sql
-- Clear existing sessions (can't backfill without user context)
DELETE FROM notification_preferences;
DELETE FROM mobile_sessions;

-- Add column
ALTER TABLE mobile_sessions
  ADD COLUMN user_id uuid NOT NULL
  REFERENCES users(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX mobile_sessions_user_idx ON mobile_sessions(user_id);
```

### 1.2 Add relations to schema

**File**: `apps/server/src/db/schema.ts`

```typescript
// Update mobileSessionsRelations
export const mobileSessionsRelations = relations(mobileSessions, ({ one }) => ({
  user: one(users, {
    fields: [mobileSessions.userId],
    references: [users.id],
  }),
  notificationPreferences: one(notificationPreferences, {
    fields: [mobileSessions.id],
    references: [notificationPreferences.mobileSessionId],
  }),
}));

// Update usersRelations to include mobileSessions
export const usersRelations = relations(users, ({ many }) => ({
  serverUsers: many(serverUsers),
  mobileSessions: many(mobileSessions),
  mobileTokens: many(mobileTokens),
}));
```

---

## Phase 2: Backend API Server Scoping ✅ COMPLETE

### 2.1 Create Server Filtering Utility

**New File**: `apps/server/src/utils/serverFiltering.ts`

```typescript
import { sql, inArray } from 'drizzle-orm';
import type { AuthUser } from '../plugins/auth';

/**
 * Build WHERE clause condition for server filtering
 * @returns SQL condition or undefined (for owners who see all)
 */
export function buildServerFilter(
  authUser: AuthUser,
  serverIdColumn: ReturnType<typeof sql.identifier>
): ReturnType<typeof sql> | undefined {
  // Owners see all servers
  if (authUser.role === 'owner') {
    return undefined;
  }

  // No server access
  if (authUser.serverIds.length === 0) {
    return sql`false`;
  }

  // Single server
  if (authUser.serverIds.length === 1) {
    return sql`${serverIdColumn} = ${authUser.serverIds[0]}`;
  }

  // Multiple servers
  return inArray(serverIdColumn, authUser.serverIds);
}

/**
 * Filter array of items by server access
 */
export function filterByServerAccess<T extends { serverId: string }>(
  items: T[],
  authUser: AuthUser
): T[] {
  if (authUser.role === 'owner') {
    return items;
  }
  return items.filter(item => authUser.serverIds.includes(item.serverId));
}
```

### 2.2 Fix `/sessions` Route

**File**: `apps/server/src/routes/sessions.ts`

**Line ~60-62** - Change from:
```typescript
if (authUser.serverIds.length > 0) {
  conditions.push(sql`s.server_id = ${authUser.serverIds[0]}`);
}
```

To:
```typescript
import { inArray } from 'drizzle-orm';

if (authUser.role !== 'owner' && authUser.serverIds.length > 0) {
  conditions.push(inArray(sql`s.server_id`, authUser.serverIds));
}
```

### 2.3 Fix `/users/list` Route

**File**: `apps/server/src/routes/users/list.ts`

**Line ~40-43** - Change from:
```typescript
if (authUser.serverIds.length > 0) {
  conditions.push(eq(serverUsers.serverId, authUser.serverIds[0] as string));
}
```

To:
```typescript
import { inArray } from 'drizzle-orm';

if (authUser.role !== 'owner' && authUser.serverIds.length > 0) {
  conditions.push(inArray(serverUsers.serverId, authUser.serverIds));
}
```

### 2.4 Add Server Filtering to Stats Endpoints

All stats endpoints need a `serverId` query parameter.

**Files to modify**:
- `apps/server/src/routes/stats/dashboard.ts`
- `apps/server/src/routes/stats/plays.ts`
- `apps/server/src/routes/stats/users.ts`
- `apps/server/src/routes/stats/content.ts`
- `apps/server/src/routes/stats/quality.ts`
- `apps/server/src/routes/stats/locations.ts` (already partial)

**Pattern for each file**:

```typescript
// Add to query schema
const querySchema = z.object({
  serverId: z.string().uuid().optional(),
  // ... existing params
});

// In handler, validate server access
const { serverId } = request.query;

if (serverId && authUser.role !== 'owner') {
  if (!authUser.serverIds.includes(serverId)) {
    return reply.forbidden('You do not have access to this server');
  }
}

// Add to WHERE clauses
const serverFilter = serverId
  ? sql`s.server_id = ${serverId}`
  : (authUser.role !== 'owner' && authUser.serverIds.length > 0)
    ? inArray(sql`s.server_id`, authUser.serverIds)
    : undefined;

if (serverFilter) {
  conditions.push(serverFilter);
}
```

### 2.5 Fix `/rules` Route

**File**: `apps/server/src/routes/rules.ts`

**Line ~43-49** - Replace role-based filtering with proper server filtering:

```typescript
// Add JOIN to get server context
const ruleList = await db
  .select({
    id: rules.id,
    name: rules.name,
    type: rules.type,
    params: rules.params,
    serverUserId: rules.serverUserId,
    isActive: rules.isActive,
    createdAt: rules.createdAt,
    updatedAt: rules.updatedAt,
    serverId: serverUsers.serverId, // Add this
  })
  .from(rules)
  .leftJoin(serverUsers, eq(rules.serverUserId, serverUsers.id))
  .orderBy(rules.name);

// Filter by server access
const filteredRules = ruleList.filter((rule) => {
  // Global rules visible to all
  if (!rule.serverUserId) return true;

  // Owners see all
  if (authUser.role === 'owner') return true;

  // Check server access
  return rule.serverId && authUser.serverIds.includes(rule.serverId);
});
```

### 2.6 Fix `/violations` Route

**File**: `apps/server/src/routes/violations.ts`

Similar pattern to rules - add JOIN through server_users to servers, filter by `authUser.serverIds`.

### 2.7 Update Mobile Routes

**File**: `apps/server/src/routes/mobile.ts`

Update pairing flow to capture `userId`:

```typescript
// In pair endpoint, after validating token
const [mobileSession] = await db
  .insert(mobileSessions)
  .values({
    userId: token.createdBy, // Add this - from the mobile_tokens.created_by
    refreshTokenHash: hashToken(refreshToken),
    deviceName: body.deviceName,
    deviceId: body.deviceId,
    platform: body.platform,
    deviceSecret: body.deviceSecret,
  })
  .returning();
```

---

## Phase 3: Web Frontend - Server Context ✅ COMPLETE

### 3.1 Create Server Context

**New File**: `apps/web/src/contexts/ServerContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useServers } from '@/hooks/queries/useServers';
import type { Server } from '@tracearr/shared';

interface ServerContextValue {
  selectedServerId: string | null;
  selectedServer: Server | null;
  availableServers: Server[];
  setSelectedServer: (serverId: string) => void;
  isLoading: boolean;
}

const ServerContext = createContext<ServerContextValue | null>(null);

const STORAGE_KEY = 'tracearr_selected_server';

export function ServerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: servers, isLoading: serversLoading } = useServers();

  // Filter servers by user access
  const availableServers = useMemo(() => {
    if (!servers || !user?.serverIds) return [];
    if (user.role === 'owner') return servers;
    return servers.filter(s => user.serverIds.includes(s.id));
  }, [servers, user]);

  // Initialize from localStorage
  const [selectedServerId, setSelectedServerId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  // Auto-select first available if current selection invalid
  useEffect(() => {
    if (availableServers.length === 0) return;

    const isValidSelection = selectedServerId &&
      availableServers.some(s => s.id === selectedServerId);

    if (!isValidSelection) {
      const defaultServer = availableServers[0];
      setSelectedServerId(defaultServer.id);
      localStorage.setItem(STORAGE_KEY, defaultServer.id);
    }
  }, [availableServers, selectedServerId]);

  const setSelectedServer = (serverId: string) => {
    setSelectedServerId(serverId);
    localStorage.setItem(STORAGE_KEY, serverId);
  };

  const selectedServer = availableServers.find(s => s.id === selectedServerId) ?? null;

  return (
    <ServerContext.Provider value={{
      selectedServerId,
      selectedServer,
      availableServers,
      setSelectedServer,
      isLoading: serversLoading,
    }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServerContext() {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServerContext must be used within ServerProvider');
  }
  return context;
}
```

### 3.2 Create Server Selector Component

**New File**: `apps/web/src/components/server/ServerSelector.tsx`

```typescript
import { Check, ChevronsUpDown, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useServerContext } from '@/contexts/ServerContext';
import { useState } from 'react';

export function ServerSelector() {
  const [open, setOpen] = useState(false);
  const { selectedServer, availableServers, setSelectedServer, isLoading } = useServerContext();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Server className="h-4 w-4 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  if (availableServers.length === 0) {
    return null;
  }

  // Single server - just display, no dropdown
  if (availableServers.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Server className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium truncate">
          {selectedServer?.name}
        </span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-3"
        >
          <div className="flex items-center gap-2 truncate">
            <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{selectedServer?.name ?? 'Select server'}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No servers found.</CommandEmpty>
            <CommandGroup>
              {availableServers.map((server) => (
                <CommandItem
                  key={server.id}
                  value={server.id}
                  onSelect={() => {
                    setSelectedServer(server.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedServer?.id === server.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{server.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### 3.3 Update Sidebar Layout

**File**: `apps/web/src/components/layout/Sidebar.tsx`

Add ServerSelector at the top of the sidebar:

```typescript
import { ServerSelector } from '@/components/server/ServerSelector';

export function Sidebar() {
  return (
    <aside className="...">
      {/* Server Selector at top */}
      <div className="p-2 border-b">
        <ServerSelector />
      </div>

      {/* Navigation links */}
      <nav className="...">
        {/* existing navigation */}
      </nav>
    </aside>
  );
}
```

### 3.4 Wrap App with ServerProvider

**File**: `apps/web/src/App.tsx` or `apps/web/src/main.tsx`

```typescript
import { ServerProvider } from '@/contexts/ServerContext';

// Wrap inside AuthProvider but outside routes
<AuthProvider>
  <ServerProvider>
    <RouterProvider router={router} />
  </ServerProvider>
</AuthProvider>
```

### 3.5 Update Query Hooks

All hooks that fetch server-specific data need to accept `serverId` parameter.

**File**: `apps/web/src/hooks/queries/useStats.ts`

**Pattern for each hook**:

```typescript
// Before
export function useDashboardStats() {
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => api.stats.dashboard(),
  });
}

// After
export function useDashboardStats(serverId?: string) {
  return useQuery({
    queryKey: ['stats', 'dashboard', serverId],
    queryFn: () => api.stats.dashboard(serverId),
    enabled: !!serverId, // Only fetch when server is selected
  });
}
```

**Hooks to update**:
- `useDashboardStats`
- `useActiveSessions`
- `usePlaysStats`
- `usePlaysByDayOfWeek`
- `usePlaysByHourOfDay`
- `usePlatformStats`
- `useQualityStats`
- `useTopUsers`
- `useTopContent`
- `useConcurrentStats`
- `useUserStats`
- `useUsers`
- `useViolations`

### 3.6 Update API Client

**File**: `apps/web/src/lib/api.ts`

Add `serverId` parameter to relevant endpoints:

```typescript
stats = {
  dashboard: (serverId?: string) => {
    const params = serverId ? `?serverId=${serverId}` : '';
    return this.request<DashboardStats>(`/stats/dashboard${params}`);
  },
  plays: (params: { period?: string; serverId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.period) searchParams.set('period', params.period);
    if (params.serverId) searchParams.set('serverId', params.serverId);
    return this.request<{ data: PlayStats[] }>(`/stats/plays?${searchParams}`);
  },
  // ... update all stat methods
};
```

### 3.7 Update Page Components

All pages displaying server-specific data need to use `useServerContext()`.

**Example - Dashboard.tsx**:

```typescript
import { useServerContext } from '@/contexts/ServerContext';

export function Dashboard() {
  const { selectedServerId } = useServerContext();

  const { data: stats } = useDashboardStats(selectedServerId ?? undefined);
  const { data: sessions } = useActiveSessions(selectedServerId ?? undefined);

  // ... rest of component
}
```

**Pages to update**:
- `Dashboard.tsx`
- `Map.tsx`
- `Users.tsx`
- `UserDetail.tsx`
- `Violations.tsx`
- `stats/Activity.tsx`
- `stats/Library.tsx`
- `stats/Users.tsx`

### 3.8 Update WebSocket Handler

**File**: `apps/web/src/hooks/useSocket.tsx`

Update cache invalidation to be server-aware:

```typescript
// When receiving session events, invalidate server-specific queries
newSocket.on(WS_EVENTS.SESSION_STARTED, (session: ActiveSession) => {
  // Invalidate both global and server-specific caches
  queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] });
  queryClient.invalidateQueries({ queryKey: ['sessions', 'active', session.serverId] });
  queryClient.invalidateQueries({ queryKey: ['stats', 'dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['stats', 'dashboard', session.serverId] });
});
```

---

## Phase 4: Mobile App - Multi-Server Support

### 4.1 Update Storage Schema

**File**: `apps/mobile/src/lib/storage.ts`

```typescript
interface ServerConnection {
  id: string;
  serverUrl: string;
  serverName: string;
  accessToken: string;
  refreshToken: string;
  pairedAt: string;
}

const KEYS = {
  SERVERS: 'tracearr_servers',           // JSON array of ServerConnection[]
  ACTIVE_SERVER_ID: 'tracearr_active_id', // Currently selected server
};

export const storage = {
  // Get all connected servers
  async getServers(): Promise<ServerConnection[]> {
    const json = await SecureStore.getItemAsync(KEYS.SERVERS);
    return json ? JSON.parse(json) : [];
  },

  // Store servers array
  async storeServers(servers: ServerConnection[]): Promise<void> {
    await SecureStore.setItemAsync(KEYS.SERVERS, JSON.stringify(servers));
  },

  // Add a new server
  async addServer(server: Omit<ServerConnection, 'id' | 'pairedAt'>): Promise<ServerConnection> {
    const servers = await this.getServers();
    const newServer: ServerConnection = {
      ...server,
      id: generateUUID(),
      pairedAt: new Date().toISOString(),
    };
    servers.push(newServer);
    await this.storeServers(servers);
    return newServer;
  },

  // Remove a server
  async removeServer(serverId: string): Promise<void> {
    const servers = await this.getServers();
    const filtered = servers.filter(s => s.id !== serverId);
    await this.storeServers(filtered);

    // If removed active server, switch to first available
    const activeId = await this.getActiveServerId();
    if (activeId === serverId && filtered.length > 0) {
      await this.setActiveServerId(filtered[0].id);
    }
  },

  // Get/set active server
  async getActiveServerId(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ACTIVE_SERVER_ID);
  },

  async setActiveServerId(serverId: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.ACTIVE_SERVER_ID, serverId);
  },

  // Get active server details
  async getActiveServer(): Promise<ServerConnection | null> {
    const activeId = await this.getActiveServerId();
    if (!activeId) return null;
    const servers = await this.getServers();
    return servers.find(s => s.id === activeId) ?? null;
  },
};
```

### 4.2 Update Auth Store

**File**: `apps/mobile/src/lib/authStore.ts`

```typescript
interface AuthState {
  servers: ServerConnection[];
  activeServerId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  addServer: (url: string, name: string, tokens: TokenPair) => Promise<void>;
  removeServer: (serverId: string) => Promise<void>;
  switchServer: (serverId: string) => Promise<void>;
  getActiveServer: () => ServerConnection | null;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  servers: [],
  activeServerId: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    const servers = await storage.getServers();
    const activeId = await storage.getActiveServerId();

    set({
      servers,
      activeServerId: activeId ?? servers[0]?.id ?? null,
      isAuthenticated: servers.length > 0,
      isLoading: false,
    });
  },

  addServer: async (url, name, tokens) => {
    const newServer = await storage.addServer({
      serverUrl: url,
      serverName: name,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    const servers = await storage.getServers();

    // If first server, make it active
    if (servers.length === 1) {
      await storage.setActiveServerId(newServer.id);
    }

    set({
      servers,
      activeServerId: get().activeServerId ?? newServer.id,
      isAuthenticated: true,
    });
  },

  switchServer: async (serverId) => {
    await storage.setActiveServerId(serverId);
    set({ activeServerId: serverId });
  },

  getActiveServer: () => {
    const { servers, activeServerId } = get();
    return servers.find(s => s.id === activeServerId) ?? null;
  },

  // ... other actions
}));
```

### 4.3 Update API Client

**File**: `apps/mobile/src/lib/api.ts`

```typescript
// Map of API clients per server
const apiClients = new Map<string, AxiosInstance>();

export async function getApiClient(serverId?: string): Promise<AxiosInstance> {
  // Get active server if not specified
  const server = serverId
    ? (await storage.getServers()).find(s => s.id === serverId)
    : await storage.getActiveServer();

  if (!server) {
    throw new Error('No server configured');
  }

  // Return cached client or create new
  if (apiClients.has(server.id)) {
    return apiClients.get(server.id)!;
  }

  const client = createApiClient(server.serverUrl, server.accessToken);
  apiClients.set(server.id, client);
  return client;
}

// Clear client cache when tokens refresh or server removed
export function clearApiClient(serverId: string) {
  apiClients.delete(serverId);
}
```

### 4.4 Create Server Selector Component

**New File**: `apps/mobile/src/components/server/ServerSelector.tsx`

```typescript
import { View, Text, Pressable } from 'react-native';
import { Server, ChevronDown } from 'lucide-react-native';
import { useAuthStore } from '@/lib/authStore';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useState } from 'react';

export function ServerSelector() {
  const [open, setOpen] = useState(false);
  const { servers, activeServerId, switchServer, getActiveServer } = useAuthStore();
  const activeServer = getActiveServer();

  if (servers.length <= 1) {
    // Single server - just display name
    return (
      <View className="flex-row items-center gap-2 px-4 py-2">
        <Server size={16} className="text-muted-foreground" />
        <Text className="text-sm font-medium">{activeServer?.serverName}</Text>
      </View>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between px-4 py-2"
      >
        <View className="flex-row items-center gap-2">
          <Server size={16} className="text-muted-foreground" />
          <Text className="text-sm font-medium">{activeServer?.serverName}</Text>
        </View>
        <ChevronDown size={16} className="text-muted-foreground" />
      </Pressable>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <Text className="text-lg font-semibold mb-4">Select Server</Text>
        {servers.map(server => (
          <Pressable
            key={server.id}
            onPress={() => {
              switchServer(server.id);
              setOpen(false);
            }}
            className={`flex-row items-center gap-3 p-3 rounded-lg ${
              server.id === activeServerId ? 'bg-primary/10' : ''
            }`}
          >
            <Server size={20} />
            <Text className="flex-1">{server.serverName}</Text>
            {server.id === activeServerId && (
              <Check size={20} className="text-primary" />
            )}
          </Pressable>
        ))}
      </BottomSheet>
    </>
  );
}
```

### 4.5 Update Tab Layout

**File**: `apps/mobile/app/(tabs)/_layout.tsx`

Add server selector to header:

```typescript
import { ServerSelector } from '@/components/server/ServerSelector';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        header: () => (
          <View className="pt-safe-top bg-background border-b border-border">
            <ServerSelector />
          </View>
        ),
      }}
    >
      {/* tabs */}
    </Tabs>
  );
}
```

### 4.6 Update All Screens

All screens need to use the active server context for API calls and query keys.

**Pattern**:
```typescript
import { useAuthStore } from '@/lib/authStore';

export default function DashboardScreen() {
  const { activeServerId } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['stats', 'dashboard', activeServerId],
    queryFn: async () => {
      const client = await getApiClient(activeServerId);
      return client.get('/stats/dashboard');
    },
    enabled: !!activeServerId,
  });

  // ... rest of screen
}
```

---

## Phase 5: Testing & Validation

### 5.1 Backend Tests

Create integration tests for multi-server scenarios:

```typescript
describe('Multi-Server Access Control', () => {
  it('guest with Server A access cannot see Server B sessions', async () => {
    // Setup: Create guest with access to serverA only
    // Action: Query sessions
    // Assert: Only serverA sessions returned
  });

  it('guest with multiple servers sees combined data', async () => {
    // Setup: Create guest with access to serverA and serverB
    // Action: Query sessions without serverId filter
    // Assert: Sessions from both servers returned
  });

  it('stats endpoint filters by serverId parameter', async () => {
    // Setup: Create sessions on multiple servers
    // Action: Query stats with serverId=serverA
    // Assert: Only serverA stats returned
  });
});
```

### 5.2 Frontend Tests

- Server selector renders correctly with 1, 2, and 3+ servers
- Switching servers updates all queries
- Query keys include serverId
- LocalStorage persists selection
- Socket events update correct server's cache

### 5.3 Mobile Tests

- Migration from single-server to multi-server storage
- Adding/removing servers
- Switching active server
- Pairing flow with existing server

---

## File Change Summary

### Backend (~15 files)

| File | Change Type |
|------|-------------|
| `db/schema.ts` | Modify - add userId to mobileSessions |
| `db/migrations/XXXX_add_mobile_user.sql` | New |
| `utils/serverFiltering.ts` | New |
| `routes/sessions.ts` | Modify |
| `routes/users/list.ts` | Modify |
| `routes/rules.ts` | Modify |
| `routes/violations.ts` | Modify |
| `routes/stats/dashboard.ts` | Modify |
| `routes/stats/plays.ts` | Modify |
| `routes/stats/users.ts` | Modify |
| `routes/stats/content.ts` | Modify |
| `routes/stats/quality.ts` | Modify |
| `routes/stats/locations.ts` | Modify (already partial) |
| `routes/mobile.ts` | Modify |

### Web Frontend (~20 files)

| File | Change Type |
|------|-------------|
| `contexts/ServerContext.tsx` | New |
| `components/server/ServerSelector.tsx` | New |
| `components/layout/Sidebar.tsx` | Modify |
| `App.tsx` or `main.tsx` | Modify |
| `lib/api.ts` | Modify |
| `hooks/queries/useStats.ts` | Modify |
| `hooks/queries/useSessions.ts` | Modify |
| `hooks/queries/useUsers.ts` | Modify |
| `hooks/queries/useViolations.ts` | Modify |
| `hooks/useSocket.tsx` | Modify |
| `pages/Dashboard.tsx` | Modify |
| `pages/Map.tsx` | Modify |
| `pages/Users.tsx` | Modify |
| `pages/UserDetail.tsx` | Modify |
| `pages/Violations.tsx` | Modify |
| `pages/stats/Activity.tsx` | Modify |
| `pages/stats/Library.tsx` | Modify |
| `pages/stats/Users.tsx` | Modify |

### Mobile App (~15 files)

| File | Change Type |
|------|-------------|
| `lib/storage.ts` | Modify |
| `lib/authStore.ts` | Modify |
| `lib/api.ts` | Modify |
| `components/server/ServerSelector.tsx` | New |
| `providers/SocketProvider.tsx` | Modify |
| `app/(tabs)/_layout.tsx` | Modify |
| `app/(tabs)/index.tsx` | Modify |
| `app/(tabs)/activity.tsx` | Modify |
| `app/(tabs)/users.tsx` | Modify |
| `app/(tabs)/alerts.tsx` | Modify |
| `app/(tabs)/settings.tsx` | Modify |
| `app/user/[id].tsx` | Modify |
| `app/session/[id].tsx` | Modify |
| `app/(auth)/pair.tsx` | Modify |

---

## Implementation Order

1. **Phase 1**: Database schema (1-2 days)
2. **Phase 2**: Backend API fixes (3-4 days)
3. **Phase 3**: Web frontend (4-5 days)
4. **Phase 4**: Mobile app (4-5 days)
5. **Phase 5**: Testing (2-3 days)

**Total Estimate**: 2-3 weeks

---

## Breaking Changes

1. **Mobile Sessions**: Existing mobile sessions will be cleared. Users must re-pair devices.
2. **API Responses**: Stats endpoints will require `serverId` param for filtered data.

## Migration Notes

- Run database migration during maintenance window
- Communicate mobile re-pairing requirement to users
- Consider feature flag for gradual rollout
