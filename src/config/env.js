// Lee y valida las variables de entorno UNA sola vez.
// Si falta algo obligatorio, se detiene el arranque con un mensaje claro.
const obligatorias = ['DATABASE_URL', 'JWT_SECRET'];
const faltantes = obligatorias.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  console.error(`Faltan variables de entorno obligatorias: ${faltantes.join(', ')}`);
  console.error('Copia .env.example a .env y completa los valores.');
  process.exit(1);
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};
