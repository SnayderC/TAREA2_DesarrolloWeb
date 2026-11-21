const ApiError = require('../utils/ApiError');

// Fábrica de middlewares: autorizar('admin') devuelve un middleware que
// solo deja pasar a usuarios con alguno de los roles indicados.
// Debe usarse DESPUÉS de autenticar (necesita req.usuario).
function autorizar(...rolesPermitidos) {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      throw ApiError.prohibido();
    }
    next();
  };
}

module.exports = autorizar;
