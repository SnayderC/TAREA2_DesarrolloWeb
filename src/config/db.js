const { Pool } = require('pg');
const { databaseUrl } = require('./env');

// Un único pool de conexiones compartido por todos los repositorios.
const pool = new Pool({ connectionString: databaseUrl });

module.exports = pool;
