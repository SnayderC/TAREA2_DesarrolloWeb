// ÚNICO lugar con SQL de favoritos.
// TODAS las consultas filtran por usuario_id: así cada usuario solo ve y toca lo suyo.
const pool = require('../config/db');

// Productos favoritos del usuario (JOIN con productos), del más reciente al más antiguo.
async function listarPorUsuario(usuarioId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.nombre, p.descripcion, p.categoria, p.precio,
            p.creado_en, p.actualizado_en, f.creado_en AS agregado_en
     FROM favoritos f
     JOIN productos p ON p.id = f.producto_id
     WHERE f.usuario_id = $1
     ORDER BY f.creado_en DESC, p.id`,
    [usuarioId]
  );
  // pg devuelve NUMERIC como string → Number
  return rows.map((fila) => ({ ...fila, precio: Number(fila.precio) }));
}

// Devuelve la fecha en que se agregó, o null si ya era favorito.
// ON CONFLICT DO NOTHING usa la PRIMARY KEY (usuario_id, producto_id) para no duplicar.
async function agregar(usuarioId, productoId) {
  const { rows } = await pool.query(
    `INSERT INTO favoritos (usuario_id, producto_id)
     VALUES ($1, $2)
     ON CONFLICT (usuario_id, producto_id) DO NOTHING
     RETURNING creado_en AS agregado_en`,
    [usuarioId, productoId]
  );
  return rows[0] ? rows[0].agregado_en : null;
}

// Devuelve true si se eliminó. Filtrar por AMBAS columnas es lo que impide que
// un usuario borre el favorito de otro: para él esa fila "no existe".
async function eliminar(usuarioId, productoId) {
  const { rowCount } = await pool.query(
    'DELETE FROM favoritos WHERE usuario_id = $1 AND producto_id = $2',
    [usuarioId, productoId]
  );
  return rowCount > 0;
}

module.exports = { listarPorUsuario, agregar, eliminar };
