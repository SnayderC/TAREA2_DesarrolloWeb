const { Router } = require('express');
const productosController = require('../controllers/productos.controller');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');

const router = Router();

// Lectura: pública
router.get('/', productosController.listar);
router.get('/:id', productosController.obtener);

// Escritura: solo admin. Orden: primero autenticar (401), luego autorizar (403).
const soloAdmin = [autenticar, autorizar('admin')];
router.post('/', soloAdmin, productosController.crear);
router.put('/:id', soloAdmin, productosController.actualizar);
router.delete('/:id', soloAdmin, productosController.eliminar);

module.exports = router;
