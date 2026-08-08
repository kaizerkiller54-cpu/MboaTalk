import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/mboatalk';

const client = postgres(connectionString, {
  max: 10,
  prepare: false,
  connect_timeout: 60,
  idle_timeout: 0,
  max_lifetime: 60 * 30
});

export const db = drizzle(client, { schema });
export { client };
