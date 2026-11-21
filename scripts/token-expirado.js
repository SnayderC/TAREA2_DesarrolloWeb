// Genera un JWT con firma VÁLIDA pero ya vencido, para la prueba de 401 en Postman.
// Uso: npm run token:expirado → copiar el token a la variable de entorno tokenExpirado.
//
// Lleva rol 'admin' a propósito: si la API lo aceptara, POST /api/productos daría 201.
// Como responde 401 (TOKEN_EXPIRADO), queda demostrado que lo que se rechaza es la
// expiración, no la firma ni el rol.
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../src/config/env');

const ahora = Math.floor(Date.now() / 1000); // JWT usa segundos, no milisegundos

const token = jwt.sign(
  {
    rol: 'admin',
    iat: ahora - 7200, // emitido hace 2 horas
    exp: ahora - 3600, // venció hace 1 hora
  },
  jwtSecret,
  { subject: '1', algorithm: 'HS256' }
);

console.log(token);
