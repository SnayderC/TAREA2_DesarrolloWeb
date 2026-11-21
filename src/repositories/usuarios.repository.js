// ÚNICO lugar con SQL de usuarios.
// Regla de seguridad: nunca SELECT *; las columnas se eligen a mano para que
// password_hash solo salga en la función que lo necesita (login).
const pool = require('../config/db');

const COLUMNAS_PUBLICAS = 'id, nombre, correo, rol, creado_en';

async function buscarPorCorreo(correo) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE correo = $1`,
    [correo]
  );
  return rows[0] || null;
}

// Solo para el login: incluye el hash para compararlo. Nunca se envía al cliente.
async function buscarCredencialesPorCorreo(correo) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS_PUBLICAS}, password_hash FROM usuarios WHERE correo = $1`,
    [correo]
  );
  return rows[0] || null;
}

// El rol NO se recibe como parámetro: el registro público siempre crea 'usuario'.
async function crearUsuario({ nombre, correo, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol)
     VALUES ($1, $2, $3, 'usuario')
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [nombre, correo, passwordHash]
  );
  return rows[0];
}

// Solo la usa scripts/crear-admin.js (no hay endpoint que la llame).
// ON CONFLICT DO NOTHING la hace idempotente: si el correo ya existe no inserta
// nada y devuelve null, sin depender de una verificación previa.
async function crearAdmin({ nombre, correo, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (correo) DO NOTHING
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [nombre, correo, passwordHash]
  );
  return rows[0] || null;
}

module.exports = { buscarPorCorreo, buscarCredencialesPorCorreo, crearUsuario, crearAdmin };
