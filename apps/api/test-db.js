const { Pool } = require('pg');

const pool = new Pool({
  host: '2600:1f1c:b5d:e600:c1cc:4c7e:5c4d:15fb',
  port: 5432,
  user: 'postgres',
  password: 'Tuskrank2026',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

pool.query('SELECT slug, name FROM pet_types LIMIT 3')
  .then(res => {
    console.log('SUCCESS:', JSON.stringify(res.rows, null, 2));
    pool.end();
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    console.error('CODE:', err.code);
    pool.end();
  });