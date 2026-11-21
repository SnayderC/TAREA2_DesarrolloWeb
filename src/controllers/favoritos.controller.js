// El usuario SIEMPRE sale de req.usuario.id (lo puso autenticar a partir del token).
// Nunca se toma del body ni de la URL: así nadie puede actuar en nombre de otro.
const favoritosRepository = require('../repositories/favoritos.repository');
const productosRepository = require('../repositories/productos.repository');
const { validarAgregarFavorito } = require('../validators/favoritos.validator');
const { validarId } = require('../validators/comunes');
const ApiError = require('../utils/ApiError');

async function listar(req, res) {
  const favoritos = await favoritosRepository.listarPorUsuario(req.usuario.id);
  res.json({ data: favoritos });
}

async function agregar(req, res) {
  const productoId = validarAgregarFavorito(req.body);

  // Verificación previa para dar un mensaje claro. Si el producto se borra justo
  // después, la FOREIGN KEY lo rechaza igual (23503 → 404 en el manejador de errores).
  const producto = await productosRepository.buscarPorId(productoId);
  if (!producto) throw ApiError.noEncontrado('Producto no encontrado');

  const agregadoEn = await favoritosRepository.agregar(req.usuario.id, productoId);
  if (!agregadoEn) {
    throw new ApiError(409, 'DUPLICADO', 'El producto ya está en tus favoritos');
  }

  res.status(201).json({ data: { ...producto, agregado_en: agregadoEn } });
}

async function eliminar(req, res) {
  const productoId = validarId(req.params.productoId, 'productoId');
  const eliminado = await favoritosRepository.eliminar(req.usuario.id, productoId);
  if (!eliminado) throw ApiError.noEncontrado('El producto no está en tus favoritos');
  res.status(204).end();
}

module.exports = { listar, agregar, eliminar };
