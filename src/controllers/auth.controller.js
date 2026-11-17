const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../repositories/usuarios.repository');
const { validarRegistro, validarLogin } = require('../validators/auth.validator');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 10;

// Hash de relleno: si el correo no existe, igual se ejecuta bcrypt.compare
// para que la respuesta tarde lo mismo y no se pueda adivinar qué correos existen.
const HASH_RELLENO = bcrypt.hashSync('relleno-para-tiempo-constante', SALT_ROUNDS);

async function registro(req, res) {
  const { nombre, correo, password } = validarRegistro(req.body);

  // Verificación previa para dar un mensaje claro. Si dos peticiones llegan a la vez,
  // el UNIQUE(correo) de la BD lo rechaza igual (23505 → 409 en el manejador de errores).
  if (await usuariosRepository.buscarPorCorreo(correo)) {
    throw new ApiError(409, 'DUPLICADO', 'El correo ya está registrado');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const usuario = await usuariosRepository.crearUsuario({ nombre, correo, passwordHash });
  res.status(201).json({ data: usuario });
}

async function login(req, res) {
  const { correo, password } = validarLogin(req.body);

  const usuario = await usuariosRepository.buscarCredencialesPorCorreo(correo);
  const passwordCorrecta = await bcrypt.compare(password, usuario ? usuario.password_hash : HASH_RELLENO);

  // Mismo mensaje para correo inexistente y contraseña incorrecta.
  if (!usuario || !passwordCorrecta) {
    throw new ApiError(401, 'CREDENCIALES_INVALIDAS', 'Credenciales inválidas');
  }

  // Payload mínimo: sub (id del usuario, como string según el estándar JWT) y rol.
  const token = jwt.sign({ rol: usuario.rol }, jwtSecret, {
    subject: String(usuario.id),
    algorithm: 'HS256',
    expiresIn: jwtExpiresIn,
  });

  res.json({
    data: {
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    },
  });
}

module.exports = { registro, login };
