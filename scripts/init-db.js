// Crea las tablas (schema.sql) e inserta los datos de ejemplo (seed.sql).
// Es seguro ejecutarlo varias veces: no borra ni duplica datos.
const fs = require('node:fs');
const path = require('node:path');
const pool = require('../src/config/db');

async function ejecutarArchivo(nombre) {
  const ruta = path.join(__dirname, '..', 'db', nombre);
  const sql = fs.readFileSync(ruta, 'utf8');
  // Sin parámetros, pg permite varias sentencias en una sola consulta.
  await pool.query(sql);
  console.log(`✔ ${nombre} ejecutado`);
}

async function main() {
  try {
    await ejecutarArchivo('schema.sql');
    await ejecutarArchivo('seed.sql');
    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM productos');
    console.log(`Productos en la base de datos: ${rows[0].total}`);
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
