// Applies every supabase/migrations/*.sql file, in filename order, to the
// database at SUPABASE_DB_URL. The SQL is idempotent (IF NOT EXISTS /
// CREATE OR REPLACE / DROP POLICY IF EXISTS), so re-running is safe.
//
//   1. Put your Supabase connection string in .env as SUPABASE_DB_URL
//   2. npm run migrate
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Minimal .env loader (so we don't need a dotenv dependency).
function loadEnv() {
  try {
    for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {}
}
loadEnv()

const url = process.env.SUPABASE_DB_URL
if (!url) {
  console.error('✗ SUPABASE_DB_URL is not set in .env. Add your Supabase connection string first.')
  process.exit(1)
}

const dir = join(root, 'supabase', 'migrations')
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  console.log('✓ Connected to Supabase\n')
  for (const f of files) {
    process.stdout.write(`Running ${f} … `)
    await client.query(readFileSync(join(dir, f), 'utf8'))
    console.log('done')
  }
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' order by table_name"
  )
  console.log('\n✓ Tables in public schema:')
  for (const r of rows) console.log('  -', r.table_name)
} catch (e) {
  console.error('\n✗ Migration failed:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
