const { Pool } = require('pg');

const pool = new Pool({
    user: 'demo_user',
    host: 'localhost',
    database: 'demo_database',
    password: '2\\a{KWvix_<M9%63',
    port: 5432,
});

pool.query('SELECT COUNT(*) FROM google_vecs_norm', (err, res) => {
    console.log(err, res);
    pool.end();
});