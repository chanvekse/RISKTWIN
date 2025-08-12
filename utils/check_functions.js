const { Client } = require('pg');

async function checkFunctions() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_aRB0bz3YGglm@ep-wandering-brook-aes1z00x.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });

  try {
    await client.connect();
    console.log('Connected to RiskTwinDB');

    // Query to get all custom functions
    const result = await client.query(`
      SELECT 
        routine_name,
        routine_type,
        specific_name,
        data_type as return_type
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `);
    
    console.log('\n--- Available SQL Functions ---');
    console.table(result.rows);

  } catch (error) {
    console.error('Error checking functions:', error.message);
  } finally {
    await client.end();
  }
}

checkFunctions(); 