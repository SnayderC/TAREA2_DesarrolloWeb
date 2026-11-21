const { Router } = require('express');
const favoritosController = require('../controllers/favoritos.controller');
const autenticar = require('../middlewares/autenticar');

const router = Router();

// Todas las rutas de favoritos requieren estar autenticado (cualquier rol).
router.use(autenticar);

router.get('/', favoritosController.listar);
router.post('/', favoritosController.agregar);
router.delete('/:productoId', favoritosController.eliminar);

module.exports = router;
