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

  static noEncontrado(mensaje = 'Recurso no encontrado') {
    return new ApiError(404, 'NO_ENCONTRADO', mensaje);
  }
}

module.exports = ApiError;
