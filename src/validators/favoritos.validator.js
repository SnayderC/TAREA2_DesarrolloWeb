const ApiError = require('../utils/ApiError');
const { exigirBodyObjeto, validarId } = require('./comunes');

// Body de POST /favoritos: { "productoId": 3 }.
// Solo se toma productoId; si llega usuarioId se ignora (el usuario sale del token).
function validarAgregarFavorito(body) {
  exigirBodyObjeto(body);
  const { productoId } = body;

  // Falta el campo → 422 (petición bien formada, pero incompleta).
  if (productoId === undefined || productoId === null || productoId === '') {
    throw ApiError.validacion([{ campo: 'productoId', mensaje: 'Es obligatorio' }]);
  }

  // Viene pero no es un entero positivo → 400 (identificador mal formado, igual que :id).
  // Se exige número o texto para que, p. ej., [3] no pase como "3"
  // (validarId convierte a String y String([3]) === "3").
  const valor = typeof productoId === 'number' || typeof productoId === 'string' ? productoId : NaN;
  return validarId(valor, 'productoId');
}

module.exports = { validarAgregarFavorito };
