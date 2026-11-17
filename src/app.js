const express = require('express');
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const noEncontrado = require('./middlewares/noEncontrado');
const manejadorErrores = require('./middlewares/manejadorErrores');

const app = express();

// Limita el tamaño del body para evitar peticiones abusivas.
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);

// Siempre al final: primero 404 de rutas, luego el manejador de errores.
app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;
