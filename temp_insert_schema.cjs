const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const projectId = 'owhltclwnobzfkflvtzv'; // From the URL
const password = 'kingvolkath9';

const client = new Client({
  host: `db.${projectId}.supabase.co`,
  port: 5432, 
  database: 'postgres',
  user: `postgres`,
  password: password,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected via direct DB connection');
    
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    console.log('Executing schema.sql...');
    
    await client.query(schemaSql);
    console.log('Schema executed successfully!');
  } catch (err) {
    console.error('Connection or execution error:', err.message);
  } finally {
    await client.end();
  }
}

run();
