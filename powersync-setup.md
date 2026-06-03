# PowerSync — Expo + Supabase Setup

## What It Does

Local SQLite lives on the device. Every read and write hits local storage instantly — no network wait. PowerSync syncs that local database with Supabase in the background. Offline changes queue up and flush on reconnect. Remote changes stream down in real time when online.

---

## Stack

- Expo (React Native)
- Supabase (PostgreSQL backend)
- PowerSync Cloud (sync middleware — hosted, free tier)
- `@powersync/react-native` SDK

---

## Step 1 — Supabase Setup

Enable logical replication on your Supabase project. PowerSync needs to read the Postgres change stream.

In Supabase SQL editor:

```sql
-- Enable replication for each table you want to sync
ALTER TABLE your_table REPLICA IDENTITY FULL;
```

Create a dedicated PowerSync database user:

```sql
CREATE ROLE powersync_role WITH LOGIN PASSWORD 'your_password';
GRANT USAGE ON SCHEMA public TO powersync_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;
```

---

## Step 2 — PowerSync Cloud

1. Create account at powersync.com
2. Create a new project
3. Connect it to your Supabase instance using the PowerSync role credentials from Step 1
4. Copy your **PowerSync URL** — you'll need it in the app

---

## Step 3 — Sync Rules

Sync rules live in a `sync-rules.yaml` file in your PowerSync dashboard. They define what data syncs to which user.

Basic example — sync all rows to all users:

```yaml
bucket_definitions:
  global:
    data:
      - SELECT * FROM your_table
```

User-scoped example — each user only gets their own rows:

```yaml
bucket_definitions:
  by_user:
    parameters:
      - SELECT request.user_id() AS user_id
    data:
      - SELECT * FROM your_table WHERE user_id = bucket.user_id
```

---

## Step 4 — Expo Install

```bash
npx expo install @powersync/react-native
npx expo install @op-engineering/op-sqlite
```

Add to `app.json` plugins:

```json
{
  "plugins": [
    "@powersync/react-native"
  ]
}
```

---

## Step 5 — Schema Definition

Define your local SQLite schema. This mirrors the Supabase tables you're syncing.

```typescript
// lib/schema.ts
import { column, Schema, Table } from '@powersync/react-native';

const items = new Table({
  name: column.text,
  description: column.text,
  user_id: column.text,
  created_at: column.text,
});

export const AppSchema = new Schema({ items });
export type Database = (typeof AppSchema)['types'];
```

---

## Step 6 — PowerSync Provider

Wrap your app with the PowerSync provider. This initializes the local database and sync connection.

```typescript
// lib/powersync.ts
import { PowerSyncDatabase } from '@powersync/react-native';
import { AppSchema } from './schema';

export const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: { dbFilename: 'app.db' },
});
```

```typescript
// App.tsx
import { PowerSyncContext } from '@powersync/react-native';
import { db } from './lib/powersync';

export default function App() {
  useEffect(() => {
    db.connect(new SupabaseConnector());
  }, []);

  return (
    <PowerSyncContext.Provider value={db}>
      <YourApp />
    </PowerSyncContext.Provider>
  );
}
```

---

## Step 7 — Supabase Connector

The connector is the bridge between PowerSync and Supabase. It handles auth tokens and write operations.

```typescript
// lib/connector.ts
import { AbstractPowerSyncDatabase, CrudEntry, PowerSyncBackendConnector } from '@powersync/react-native';
import { supabase } from './supabase';

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL!,
      token: session?.access_token ?? '',
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const batch = await database.getCrudBatch(200);
    if (!batch) return;

    for (const entry of batch.crud) {
      await this.handleCrudEntry(entry);
    }

    await batch.complete();
  }

  private async handleCrudEntry(entry: CrudEntry) {
    const { op, table, opData, id } = entry;

    if (op === 'PUT') {
      await supabase.from(table).upsert({ id, ...opData });
    } else if (op === 'PATCH') {
      await supabase.from(table).update(opData).eq('id', id);
    } else if (op === 'DELETE') {
      await supabase.from(table).delete().eq('id', id);
    }
  }
}
```

---

## Step 8 — Reading and Writing

Reads hit local SQLite — always instant, always available offline.

```typescript
// Reading — reactive, updates automatically when data changes
import { useQuery } from '@powersync/react-native';

const { data: items } = useQuery('SELECT * FROM items ORDER BY created_at DESC');
```

```typescript
// Writing — goes to local SQLite first, syncs to Supabase in background
import { usePowerSync } from '@powersync/react-native';

const db = usePowerSync();

await db.execute(
  'INSERT INTO items (id, name, user_id) VALUES (uuid(), ?, ?)',
  [name, userId]
);
```

---

## Data Flow Summary

```
User writes → local SQLite (instant, works offline)
                    ↓
             PowerSync queues the change
                    ↓ (when online)
             Supabase PostgreSQL updated
                    ↓
             Other devices pull the change via PowerSync stream
                    ↓
             Their local SQLite updates automatically
```

---

## Environment Variables

```env
EXPO_PUBLIC_POWERSYNC_URL=https://your-instance.powersync.journeyapps.com
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## What PowerSync Does Not Handle

- Auth — that's still Supabase Auth, unchanged
- File storage — still Supabase Storage, unchanged
- Complex conflict resolution — last write wins by default; custom logic needs manual handling in the connector
