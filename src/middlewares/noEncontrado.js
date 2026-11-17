// Se registra después de todas las rutas: si ninguna respondió, la ruta no existe.
function noEncontrado(req, res) {
  res.status(404).json({
    error: { codigo: 'RUTA_NO_ENCONTRADA', mensaje: `No existe la ruta ${req.method} ${req.originalUrl}` },
  });
}

module.exports = noEncontrado;
