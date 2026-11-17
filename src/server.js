const { port } = require('./config/env');
const app = require('./app');

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
