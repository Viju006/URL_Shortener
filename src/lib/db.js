import pg from "pg";

const { Pool } = pg;

let pool;
let initialized = false;

async function initSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      short_code TEXT UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      custom_alias TEXT,
      expires_at TIMESTAMPTZ,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      click_count INTEGER DEFAULT 0
    )
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_links_expires_at ON links(expires_at)`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS clicks (
      id SERIAL PRIMARY KEY,
      link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
      clicked_at TIMESTAMPTZ DEFAULT NOW(),
      referrer TEXT,
      country TEXT,
      user_agent TEXT
    )
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id)`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at)`
  );
}

export async function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }

  if (!initialized) {
    await initSchema(pool);
    initialized = true;
  }

  return pool;
}
