const ApiError = require('../utils/ApiError');

// Traducción de códigos de error de PostgreSQL a respuestas HTTP.
const ERRORES_PG = {
  23505: { status: 409, codigo: 'DUPLICADO', mensaje: 'El recurso ya existe' }, // unique_violation
  23503: { status: 404, codigo: 'NO_ENCONTRADO', mensaje: 'El recurso relacionado no existe' }, // foreign_key_violation
  '22P02': { status: 422, codigo: 'VALIDACION', mensaje: 'Formato de dato inválido' }, // invalid_text_representation
  23514: { status: 422, codigo: 'VALIDACION', mensaje: 'Los datos no cumplen las reglas' }, // check_violation
};

function responder(res, status, codigo, mensaje, detalles) {
  const error = { codigo, mensaje };
  if (detalles) error.detalles = detalles;
  res.status(status).json({ error });
}

// Express reconoce un manejador de errores porque recibe 4 parámetros.
// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  // 1. Errores controlados que lanzamos nosotros
  if (err instanceof ApiError) {
    return responder(res, err.status, err.codigo, err.message, err.detalles);
  }

  // 2. Errores de express.json(): JSON mal formado o body demasiado grande
  if (err.type === 'entity.parse.failed') {
    return responder(res, 400, 'JSON_INVALIDO', 'El cuerpo no es un JSON válido');
  }
  if (err.type === 'entity.too.large') {
    return responder(res, 413, 'CUERPO_DEMASIADO_GRANDE', 'El cuerpo supera el tamaño permitido');
  }

  // 3. Errores de PostgreSQL conocidos
  const pg = ERRORES_PG[err.code];
  if (pg) {
    return responder(res, pg.status, pg.codigo, pg.mensaje);
  }

  // 4. Cualquier otro: se loguea en consola y al cliente solo va un mensaje genérico
  console.error(err);
  return responder(res, 500, 'ERROR_INTERNO', 'Ocurrió un error inesperado');
}

module.exports = manejadorErrores;
