// utils/fix_timeline_duplicates.js
/**
 * Remove or repair timeline_event rows that contain the legacy duplicated deductible phrasing
 * "increase deductible by $X, increased deductible by $X".
 *
 * USAGE (one-off): node utils/fix_timeline_duplicates.js
 * Safe to re-run – it only targets rows containing the exact duplicated pattern.
 */

const { Pool } = require('pg');
const config = require('../config/environment');

(async () => {
  const pool = new Pool({
    connectionString: config.getDatabase().url,
    ssl: config.isProduction() ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Scanning for duplicate deductible timeline rows …');

    // Find candidate rows (tag = 'scenario' keeps scope tight)
    const selectSql = `SELECT event_id, details FROM timeline_events
                       WHERE tag = 'scenario'
                         AND details ILIKE '%increase deductible by %increased deductible by %'`;

    const { rows } = await pool.query(selectSql);

    if (rows.length === 0) {
      console.log('✅ No duplicated rows found – nothing to do.');
      process.exit(0);
    }

    console.log(`🗑️  Found ${rows.length} duplicate row(s). Deleting …`);

    const ids = rows.map(r => r.event_id);
    await pool.query('DELETE FROM timeline_events WHERE event_id = ANY($1::int[])', [ids]);

    console.log('✅ Duplicate timeline rows removed.');
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})(); 