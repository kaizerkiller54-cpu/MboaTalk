import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/mboatalk';

const migrationClient = postgres(connectionString, { max: 1 });
const db = drizzle(migrationClient);

async function main() {
  console.log('[db:migrate] Applying migrations...');
  await migrate(db, { migrationsFolder: './server/db/migrations' });
  console.log('[db:migrate] Done.');
  await migrationClient.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('[db:migrate] Failed:', err);
  process.exit(1);
});
