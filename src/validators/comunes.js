const ApiError = require('../utils/ApiError');

// Máximo valor de una columna INTEGER de PostgreSQL.
const MAX_INTEGER = 2147483647;

// Valida que un parámetro de ruta sea un entero positivo.
// Si no lo es, la petición está mal formada → 400.
function validarId(valor, campo = 'id') {
  const esEnteroPositivo = /^[1-9]\d*$/.test(String(valor));
  const numero = Number(valor);
  if (!esEnteroPositivo || numero > MAX_INTEGER) {
    throw ApiError.peticionInvalida(`El parámetro '${campo}' debe ser un entero positivo`, [
      { campo, mensaje: 'Debe ser un entero positivo' },
    ]);
  }
  return numero;
}

// Asegura que el body sea un objeto JSON (no vacío, no un array).
function exigirBodyObjeto(body) {
  if (body === undefined || body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.peticionInvalida(
      'El cuerpo debe ser un objeto JSON (Content-Type: application/json)'
    );
  }
}

// Valida un texto obligatorio. Agrega el error a la lista y devuelve el valor limpio.
function textoObligatorio(valor, campo, maximo, errores) {
  if (typeof valor !== 'string' || valor.trim() === '') {
    errores.push({ campo, mensaje: 'Es obligatorio y debe ser texto no vacío' });
    return undefined;
  }
  const limpio = valor.trim();
  if (maximo && limpio.length > maximo) {
    errores.push({ campo, mensaje: `No puede superar ${maximo} caracteres` });
  }
  return limpio;
}

module.exports = { validarId, exigirBodyObjeto, textoObligatorio, MAX_INTEGER };
