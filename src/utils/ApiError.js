// Error "controlado" de la API: lleva el código HTTP y un código legible.
// Los controladores lanzan ApiError y el manejador de errores lo convierte
// en la respuesta JSON con el formato estándar.
class ApiError extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }

  static peticionInvalida(mensaje, detalles) {
    return new ApiError(400, 'PETICION_INVALIDA', mensaje, detalles);
  }

  static validacion(detalles) {
    return new ApiError(422, 'VALIDACION', 'Datos inválidos', detalles);
  }

  static noAutenticado(mensaje = 'Se requiere autenticación', codigo = 'NO_AUTENTICADO') {
    return new ApiError(401, codigo, mensaje);
  }

  static prohibido(mensaje = 'No tienes permiso para realizar esta acción') {
    return new ApiError(403, 'PROHIBIDO', mensaje);
  }

  static noEncontrado(mensaje = 'Recurso no encontrado') {
    return new ApiError(404, 'NO_ENCONTRADO', mensaje);
  }
}

module.exports = ApiError;
