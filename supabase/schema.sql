-- ============================================================
--  Sistema de Calificación – IE TechFair
--  Ejecutar este script en el Editor SQL de Supabase
--  Seguro de correr múltiples veces (usa IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Añadir columnas faltantes a personas (ya existe)
-- ------------------------------------------------------------
ALTER TABLE personas ADD COLUMN IF NOT EXISTS departamento  TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS especialidad  TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS codigo        TEXT UNIQUE;

-- ------------------------------------------------------------
-- 2. Tabla: proyectos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proyectos (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo             TEXT        UNIQUE NOT NULL,
  nombre             TEXT        NOT NULL,
  grupo              TEXT,
  categoria          TEXT        NOT NULL,
  stand              TEXT,
  equipo             TEXT,
  descripcion        TEXT,
  evaluaciones_total INTEGER     NOT NULL DEFAULT 3,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. Tabla: criterios  (rubros de evaluación)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS criterios (
  id          SERIAL  PRIMARY KEY,
  nombre      TEXT    NOT NULL,
  descripcion TEXT,
  peso        NUMERIC NOT NULL CHECK (peso > 0 AND peso <= 100)
);

-- Insertar criterios por defecto (no duplicar si ya existen)
INSERT INTO criterios (nombre, descripcion, peso)
VALUES
  (
    'Innovación y Creatividad',
    'Evalúe el grado de novedad de la solución tecnológica propuesta. Considere si el proyecto utiliza tecnologías de vanguardia o aplica metodologías existentes de una manera significativamente novedosa para resolver el problema planteado.',
    20
  ),
  (
    'Aplicación de Ingeniería',
    'Analiza la viabilidad técnica, la robustez del diseño y la correcta aplicación de principios de ingeniería industrial en el prototipo o modelo. Considere la eficiencia, escalabilidad y seguridad de la solución.',
    40
  ),
  (
    'Presentación y Claridad',
    'Califica la capacidad de los estudiantes para comunicar su idea de forma concisa, responder preguntas técnicas y la calidad visual de sus materiales. Evalúe la estructura de la presentación y el uso efectivo de ayudas visuales.',
    40
  )
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 4. Tabla: asignaciones  (docente → proyecto)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignaciones (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  id_proyecto UUID        NOT NULL REFERENCES proyectos(id)        ON DELETE CASCADE,
  id_persona  UUID        NOT NULL REFERENCES personas(id_usuario)  ON DELETE CASCADE,
  estado      TEXT        NOT NULL DEFAULT 'Pendiente'
                          CHECK (estado IN ('Pendiente', 'Calificado')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (id_proyecto, id_persona)
);

-- ------------------------------------------------------------
-- 5. Tabla: evaluaciones  (notas por criterio, por asignación)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evaluaciones (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  id_asignacion  UUID        NOT NULL REFERENCES asignaciones(id) ON DELETE CASCADE,
  id_criterio    INTEGER     NOT NULL REFERENCES criterios(id),
  puntaje        NUMERIC     NOT NULL CHECK (puntaje >= 0 AND puntaje <= 100),
  observaciones  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (id_asignacion, id_criterio)
);

-- ------------------------------------------------------------
-- 6. Habilitar RLS en tablas nuevas
-- ------------------------------------------------------------
ALTER TABLE proyectos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterios   ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 7. Función helper para evitar recursión en RLS de personas
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION es_administrador()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM personas
    WHERE id_usuario = auth.uid()
      AND rol = 'administrador'
  );
$$;

-- ------------------------------------------------------------
-- 8. Políticas RLS – proyectos
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "proyectos_lectura_autenticados"  ON proyectos;
DROP POLICY IF EXISTS "proyectos_escritura_admin"        ON proyectos;

CREATE POLICY "proyectos_lectura_autenticados"
  ON proyectos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "proyectos_escritura_admin"
  ON proyectos FOR ALL
  TO authenticated
  USING (es_administrador())
  WITH CHECK (es_administrador());

-- ------------------------------------------------------------
-- 9. Políticas RLS – criterios
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "criterios_lectura_autenticados" ON criterios;

CREATE POLICY "criterios_lectura_autenticados"
  ON criterios FOR SELECT
  TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- 10. Políticas RLS – asignaciones
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "asignaciones_admin_todo"           ON asignaciones;
DROP POLICY IF EXISTS "asignaciones_docente_lectura_prop" ON asignaciones;
DROP POLICY IF EXISTS "asignaciones_docente_update_prop"  ON asignaciones;

-- Admins: acceso completo
CREATE POLICY "asignaciones_admin_todo"
  ON asignaciones FOR ALL
  TO authenticated
  USING (es_administrador())
  WITH CHECK (es_administrador());

-- Docentes: ver sus propias asignaciones
CREATE POLICY "asignaciones_docente_lectura_prop"
  ON asignaciones FOR SELECT
  TO authenticated
  USING (auth.uid() = id_persona);

-- Docentes: marcar su asignación como Calificado
CREATE POLICY "asignaciones_docente_update_prop"
  ON asignaciones FOR UPDATE
  TO authenticated
  USING (auth.uid() = id_persona)
  WITH CHECK (auth.uid() = id_persona);

-- ------------------------------------------------------------
-- 11. Políticas RLS – evaluaciones
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "evaluaciones_admin_todo"              ON evaluaciones;
DROP POLICY IF EXISTS "evaluaciones_docente_gestiona_prop"   ON evaluaciones;

CREATE POLICY "evaluaciones_admin_todo"
  ON evaluaciones FOR ALL
  TO authenticated
  USING (es_administrador())
  WITH CHECK (es_administrador());

CREATE POLICY "evaluaciones_docente_gestiona_prop"
  ON evaluaciones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM asignaciones a
      WHERE a.id = evaluaciones.id_asignacion
        AND a.id_persona = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM asignaciones a
      WHERE a.id = evaluaciones.id_asignacion
        AND a.id_persona = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 12. Política RLS – personas (lectura para todos los autenticados)
--     Solo agregar si no existe ya una política de lectura
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "personas_lectura_autenticados" ON personas;

CREATE POLICY "personas_lectura_autenticados"
  ON personas FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
--  FIN DEL SCRIPT
--  Próximos pasos:
--  1. Insertar proyectos de ejemplo en la tabla 'proyectos'
--  2. Crear usuarios docentes en Supabase Auth y en 'personas'
--     (con rol='docente', departamento, especialidad, codigo)
--  3. Crear asignaciones vinculando proyectos y docentes
-- ============================================================
