// Lee req, valida, llama al repositorio y arma la respuesta.
// Express 5 envía al manejador de errores cualquier error lanzado en funciones async.
const productosRepository = require('../repositories/productos.repository');
const { validarProducto, validarFiltroCategoria } = require('../validators/productos.validator');
const { validarId } = require('../validators/comunes');
const ApiError = require('../utils/ApiError');

async function listar(req, res) {
  const categoria = validarFiltroCategoria(req.query);
  const productos = await productosRepository.listar(categoria);
  res.json({ data: productos });
}

async function obtener(req, res) {
  const id = validarId(req.params.id);
  const producto = await productosRepository.buscarPorId(id);
  if (!producto) throw ApiError.noEncontrado('Producto no encontrado');
  res.json({ data: producto });
}

async function crear(req, res) {
  const datos = validarProducto(req.body);
  const producto = await productosRepository.crear(datos);
  res.status(201).json({ data: producto });
}

async function actualizar(req, res) {
  const id = validarId(req.params.id);
  const datos = validarProducto(req.body);
  const producto = await productosRepository.actualizar(id, datos);
  if (!producto) throw ApiError.noEncontrado('Producto no encontrado');
  res.json({ data: producto });
}

async function eliminar(req, res) {
  const id = validarId(req.params.id);
  const eliminado = await productosRepository.eliminar(id);
  if (!eliminado) throw ApiError.noEncontrado('Producto no encontrado');
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
