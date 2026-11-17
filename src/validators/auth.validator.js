const ApiError = require('../utils/ApiError');
const { exigirBodyObjeto, textoObligatorio } = require('./comunes');

// Formato básico: algo@algo.dominio, sin espacios.
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
// bcrypt solo usa los primeros 72 bytes; más allá se ignorarían en silencio.
const PASSWORD_MAX = 72;

function validarCorreo(valor, errores) {
  if (typeof valor !== 'string' || valor.trim() === '') {
    errores.push({ campo: 'correo', mensaje: 'Es obligatorio' });
    return undefined;
  }
  const correo = valor.trim().toLowerCase();
  if (correo.length > 255 || !REGEX_CORREO.test(correo)) {
    errores.push({ campo: 'correo', mensaje: 'No tiene un formato válido' });
  }
  return correo;
}

// Solo se toman nombre, correo y password. Cualquier otro campo (p. ej. rol) se ignora.
function validarRegistro(body) {
  exigirBodyObjeto(body);
  const errores = [];

  const nombre = textoObligatorio(body.nombre, 'nombre', 100, errores);
  const correo = validarCorreo(body.correo, errores);

  const { password } = body;
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    errores.push({ campo: 'password', mensaje: `Debe tener al menos ${PASSWORD_MIN} caracteres` });
  } else if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX) {
    errores.push({ campo: 'password', mensaje: `No puede superar ${PASSWORD_MAX} bytes` });
  }

  if (errores.length > 0) throw ApiError.validacion(errores);
  return { nombre, correo, password };
}

// En el login solo se exige que lleguen los campos; si son incorrectos → 401 (no 422),
// para no dar pistas sobre las reglas o sobre qué correos existen.
function validarLogin(body) {
  exigirBodyObjeto(body);
  const errores = [];

  let correo;
  if (typeof body.correo === 'string' && body.correo.trim() !== '') {
    correo = body.correo.trim().toLowerCase();
  } else {
    errores.push({ campo: 'correo', mensaje: 'Es obligatorio' });
  }

  if (typeof body.password !== 'string' || body.password === '') {
    errores.push({ campo: 'password', mensaje: 'Es obligatorio' });
  }

  if (errores.length > 0) throw ApiError.validacion(errores);
  return { correo, password: body.password };
}

module.exports = { validarRegistro, validarLogin };
