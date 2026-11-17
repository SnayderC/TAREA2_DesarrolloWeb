-- Esquema del catálogo. Usa IF NOT EXISTS para poder ejecutarse varias veces
-- sin borrar datos (los datos deben sobrevivir a reinicios).

CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  correo        VARCHAR(255) NOT NULL UNIQUE,          -- se guarda en minúsculas
  password_hash TEXT         NOT NULL,
  rol           VARCHAR(20)  NOT NULL DEFAULT 'usuario'
                CHECK (rol IN ('usuario', 'admin')),
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS productos (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre         VARCHAR(150)  NOT NULL,
  descripcion    TEXT          NOT NULL,
  categoria      VARCHAR(80)   NOT NULL,
  precio         NUMERIC(10,2) NOT NULL CHECK (precio > 0),  -- segunda barrera tras la validación
  creado_en      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Índice sobre LOWER(categoria) para el filtro sin distinguir mayúsculas.
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (LOWER(categoria));

-- Clave primaria compuesta: un usuario no puede repetir el mismo favorito.
-- ON DELETE CASCADE: al borrar un producto (o usuario) sus favoritos desaparecen.
CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, producto_id)
);
