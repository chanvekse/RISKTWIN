const { Client } = require('pg');

async function callListHighRisk() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_aRB0bz3YGglm@ep-wandering-brook-aes1z00x.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });

  try {
    await client.connect();
    console.log('Connected to RiskTwinDB');

    // Call the list_high_risk function with threshold=50 and limit=5
    const result = await client.query('SELECT * FROM list_high_risk($1, $2)', [50, 5]);
    
    console.log('\n--- High Risk Results (threshold=50, limit=5) ---');
    console.log(`Found ${result.rows.length} records:`);
    console.table(result.rows);

  } catch (error) {
    console.error('Error calling list_high_risk:', error.message);
  } finally {
    await client.end();
  }
}

callListHighRisk(); 