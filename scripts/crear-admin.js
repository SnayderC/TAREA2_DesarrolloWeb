// Crea el usuario administrador a partir de ADMIN_NOMBRE, ADMIN_CORREO y ADMIN_PASSWORD (.env).
// Es la ÚNICA forma de obtener un admin: ningún endpoint público asigna ese rol.
// Idempotente: si el correo ya existe, no lo duplica.
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');
const usuariosRepository = require('../src/repositories/usuarios.repository');
const { validarRegistro } = require('../src/validators/auth.validator');
const ApiError = require('../src/utils/ApiError');

const SALT_ROUNDS = 10;

async function main() {
  try {
    // Mismas reglas que el registro público (correo válido, password ≥ 8, etc.).
    const { nombre, correo, password } = validarRegistro({
      nombre: process.env.ADMIN_NOMBRE,
      correo: process.env.ADMIN_CORREO,
      password: process.env.ADMIN_PASSWORD,
    });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const admin = await usuariosRepository.crearAdmin({ nombre, correo, passwordHash });

    if (admin) {
      console.log(`✔ Admin creado: ${admin.correo} (id ${admin.id})`);
      return;
    }

    const existente = await usuariosRepository.buscarPorCorreo(correo);
    if (existente.rol === 'admin') {
      console.log(`El admin ${correo} ya existe; no se hizo ningún cambio.`);
    } else {
      // No lo promovemos automáticamente: cambiar el rol de una cuenta existente
      // debe ser una decisión consciente, no un efecto secundario del script.
      console.error(`El correo ${correo} ya está registrado con rol "${existente.rol}". Usa otro ADMIN_CORREO.`);
      process.exitCode = 1;
    }
  } catch (err) {
    if (err instanceof ApiError) {
      console.error('Variables ADMIN_* inválidas en .env:');
      for (const d of err.detalles) console.error(`  - ADMIN_${d.campo.toUpperCase()}: ${d.mensaje}`);
    } else {
      console.error('Error al crear el admin:', err.message);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
