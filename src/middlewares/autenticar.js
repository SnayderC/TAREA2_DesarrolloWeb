const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const ApiError = require('../utils/ApiError');

// Verifica el header "Authorization: Bearer <token>".
// Si el token es válido, deja req.usuario = { id, rol } para los siguientes pasos.
function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const [esquema, token] = header.split(' ');

  if (esquema !== 'Bearer' || !token) {
    throw ApiError.noAutenticado('Falta el token o el formato no es "Bearer <token>"');
  }

  let payload;
  try {
    // verify() comprueba la firma y la expiración (exp). Fijamos el algoritmo
    // para que no se acepten tokens firmados con otro (p. ej. "none").
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.noAutenticado('El token ha expirado', 'TOKEN_EXPIRADO');
    }
    throw ApiError.noAutenticado('Token inválido', 'TOKEN_INVALIDO');
  }

  req.usuario = { id: Number(payload.sub), rol: payload.rol };
  next();
}

module.exports = autenticar;
