const ApiError = require('../utils/ApiError');
const { exigirBodyObjeto, textoObligatorio } = require('./comunes');

// NUMERIC(10,2) admite hasta 99 999 999.99
const PRECIO_MAXIMO = 99999999.99;

// Valida el body de POST y PUT (PUT es reemplazo completo: exige todos los campos).
// Devuelve solo los campos permitidos, ya limpios. Cualquier otro campo se ignora.
function validarProducto(body) {
  exigirBodyObjeto(body);
  const errores = [];

  const nombre = textoObligatorio(body.nombre, 'nombre', 150, errores);
  const descripcion = textoObligatorio(body.descripcion, 'descripcion', undefined, errores);
  const categoria = textoObligatorio(body.categoria, 'categoria', 80, errores);

  const { precio } = body;
  if (typeof precio !== 'number' || !Number.isFinite(precio)) {
    errores.push({ campo: 'precio', mensaje: 'Es obligatorio y debe ser un número' });
  } else if (precio <= 0) {
    errores.push({ campo: 'precio', mensaje: 'Debe ser mayor que 0' });
  } else if (precio > PRECIO_MAXIMO) {
    errores.push({ campo: 'precio', mensaje: `No puede superar ${PRECIO_MAXIMO}` });
  } else if (Math.round(precio * 100) / 100 !== precio) {
    errores.push({ campo: 'precio', mensaje: 'Admite como máximo 2 decimales' });
  }

  if (errores.length > 0) throw ApiError.validacion(errores);

  return { nombre, descripcion, categoria, precio };
}

// Valida el query ?categoria=x (opcional). Mal formado → 400.
function validarFiltroCategoria(query) {
  const { categoria } = query;
  if (categoria === undefined) return undefined;

  // Si se repite (?categoria=a&categoria=b) llega como array: petición mal formada.
  if (typeof categoria !== 'string' || categoria.trim() === '') {
    throw ApiError.peticionInvalida("El parámetro 'categoria' debe ser un texto no vacío", [
      { campo: 'categoria', mensaje: 'Debe ser un texto no vacío' },
    ]);
  }
  return categoria.trim();
}

module.exports = { validarProducto, validarFiltroCategoria };
