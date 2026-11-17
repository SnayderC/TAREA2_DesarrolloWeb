const { Router } = require('express');
const productosController = require('../controllers/productos.controller');

const router = Router();

// Por ahora sin autenticación; en la etapa 5 se protegerán POST, PUT y DELETE.
router.get('/', productosController.listar);
router.get('/:id', productosController.obtener);
router.post('/', productosController.crear);
router.put('/:id', productosController.actualizar);
router.delete('/:id', productosController.eliminar);

module.exports = router;
