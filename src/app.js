const express = require('express');

const app = express();

// Limita el tamaño del body para evitar peticiones abusivas.
app.use(express.json({ limit: '10kb' }));

// Ruta de salud temporal para verificar que el servidor responde.
app.get('/api/salud', (req, res) => {
  res.json({ data: { estado: 'ok' } });
});

module.exports = app;
