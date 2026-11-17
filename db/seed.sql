-- Productos ficticios de ejemplo.
-- Solo se insertan si la tabla está vacía, para que ejecutar db:init
-- varias veces no duplique los datos.
INSERT INTO productos (nombre, descripcion, categoria, precio)
SELECT v.nombre, v.descripcion, v.categoria, v.precio
FROM (VALUES
  ('Laptop Orion 14',        'Portátil de 14 pulgadas, 16 GB RAM, 512 GB SSD',     'Tecnologia', 899.99),
  ('Audífonos Eco Bass',     'Audífonos inalámbricos con cancelación de ruido',    'Tecnologia', 79.50),
  ('Mouse Pluma',            'Mouse óptico ergonómico de 6 botones',               'Tecnologia', 25.00),
  ('Silla Ergo Plus',        'Silla de oficina con soporte lumbar ajustable',      'Hogar',      189.90),
  ('Lámpara Nórdica',        'Lámpara de escritorio LED con luz cálida',           'Hogar',      34.75),
  ('Novela El Faro Azul',    'Novela de misterio, edición de bolsillo',            'Libros',     12.99),
  ('Guía de Algoritmos',     'Libro introductorio de estructuras de datos',        'Libros',     45.00),
  ('Botella Térmica 750 ml', 'Acero inoxidable, mantiene el frío por 24 horas',    'Deportes',   19.90)
) AS v(nombre, descripcion, categoria, precio)
WHERE NOT EXISTS (SELECT 1 FROM productos);
