export const CATEGORIAS = [
  'Carreras Tecnológicas',
  'Carreras de la Tierra',
  'Carreras de Producción',
  'Carreras Económicas',
  'Carreras Jurídicas',
  'Carreras del Tecnológico',
] as const;

export type CategoriaTipo = (typeof CATEGORIAS)[number];

export const CARRERAS_INGENIERIAS = [
  'Ingeniería Civil',
  'Ingeniería Industrial',
  'Ingeniería de Sistemas',
  'Ingeniería Mecatrónica',
  'Ingeniería en Mecatrónica',
  'Ingeniería Comercial',
  'Ingeniería Financiera',
  'Ingeniería en Telecomunicaciones',
  'Ingeniería Petrolera',
  'Ingeniería Ambiental',
  'Ingeniería Agroindustrial',
  'Ingeniería Agronómica',
  'Ingeniería Geográfica',
  'Ingeniería Económica',
  'Derecho',
] as const;

export const CARRERAS_TECNICOS = [
  'Técnico Superior en Informática',
  'Técnico Superior en Construcción Civil',
  'Técnico Superior en Energías Renovables',
  'Técnico Superior en Sistemas Electrónicos',
  'Técnico Superior en Análisis de Sistemas / Diseño Gráfico',
] as const;

export const CARRERAS = [
  ...CARRERAS_INGENIERIAS,
  ...CARRERAS_TECNICOS,
] as const;

export type CarreraTipo = (typeof CARRERAS)[number];

export const CATEGORIA_DEFAULT = 'Carreras Tecnológicas';
export const CARRERA_DEFAULT = 'Ingeniería de Sistemas';

/**
 * Mapeo oficial de carreras a su categoría correspondiente
 */
export const CARRERA_CATEGORIA_MAP: Record<string, CategoriaTipo> = {
  'Ingeniería de Sistemas': 'Carreras Tecnológicas',
  'Ingeniería Mecatrónica': 'Carreras Tecnológicas',
  'Ingeniería en Mecatrónica': 'Carreras Tecnológicas',
  'Ingeniería en Telecomunicaciones': 'Carreras Tecnológicas',
  'Ingeniería en Sistemas Electrónicos': 'Carreras Tecnológicas',
  'Ingeniería Electrónica': 'Carreras Tecnológicas',

  'Ingeniería Ambiental': 'Carreras de la Tierra',
  'Ingeniería Civil': 'Carreras de la Tierra',
  'Ingeniería Geográfica': 'Carreras de la Tierra',
  'Ingeniería Agronómica': 'Carreras de la Tierra',

  'Ingeniería Industrial': 'Carreras de Producción',
  'Ingeniería Petrolera': 'Carreras de Producción',
  'Ingeniería Agroindustrial': 'Carreras de Producción',

  'Ingeniería Comercial': 'Carreras Económicas',
  'Ingeniería Financiera': 'Carreras Económicas',
  'Ingeniería Económica': 'Carreras Económicas',

  'Derecho': 'Carreras Jurídicas',

  'Técnico Superior en Informática': 'Carreras del Tecnológico',
  'Técnico Superior en Construcción Civil': 'Carreras del Tecnológico',
  'Técnico Superior en Energías Renovables': 'Carreras del Tecnológico',
  'Técnico Superior en Sistemas Electrónicos': 'Carreras del Tecnológico',
  'Técnico Superior en Análisis de Sistemas / Diseño Gráfico': 'Carreras del Tecnológico',
};

export function getCategoriaPorCarrera(carrera?: string): CategoriaTipo {
  if (!carrera) return CATEGORIA_DEFAULT;
  if (CARRERA_CATEGORIA_MAP[carrera]) return CARRERA_CATEGORIA_MAP[carrera];
  const lower = carrera.toLowerCase();
  for (const [key, cat] of Object.entries(CARRERA_CATEGORIA_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return cat;
    }
  }
  return CATEGORIA_DEFAULT;
}

/**
 * Colores oficiales de las carreras escaneados y calibrados por OCR desde la gráfica institucional.
 */
export const COLORES_CARRERAS: Record<string, { hex: string; bg: string; text: string; border: string }> = {
  'Ingeniería Civil': {
    hex: '#82868B',
    bg: '#F1F3F5',
    text: '#565B60',
    border: '#D0D4D9',
  },
  'Ingeniería Geográfica': {
    hex: '#AA8444',
    bg: '#FDF8EE',
    text: '#8A682D',
    border: '#E8D5B0',
  },
  'Ingeniería en Sistemas Electrónicos': {
    hex: '#4088BD',
    bg: '#EDF6FC',
    text: '#286E9F',
    border: '#B6DBF2',
  },
  'Ingeniería Industrial': {
    hex: '#85827E',
    bg: '#F5F4F2',
    text: '#5F5C58',
    border: '#D7D4CF',
  },
  'Ingeniería Agronómica': {
    hex: '#88B541',
    bg: '#F4F9EC',
    text: '#6A922A',
    border: '#CFE6A8',
  },
  'Ingeniería Comercial': {
    hex: '#D57425',
    bg: '#FDF4EB',
    text: '#B05914',
    border: '#F6CEAA',
  },
  'Ingeniería de Sistemas': {
    hex: '#0E5191',
    bg: '#EAF2F9',
    text: '#0E5191',
    border: '#A8CBEC',
  },
  'Ingeniería Agroindustrial': {
    hex: '#418743',
    bg: '#EFF7F0',
    text: '#2E6930',
    border: '#B3DCB5',
  },
  'Ingeniería Ambiental': {
    hex: '#46BBE4',
    bg: '#EDF9FD',
    text: '#1B95C0',
    border: '#B2E5F7',
  },
  'Ingeniería Mecatrónica': {
    hex: '#286D84',
    bg: '#EBF4F7',
    text: '#1C5467',
    border: '#A9D1DF',
  },
  'Ingeniería en Mecatrónica': {
    hex: '#286D84',
    bg: '#EBF4F7',
    text: '#1C5467',
    border: '#A9D1DF',
  },
  'Ingeniería en Telecomunicaciones': {
    hex: '#4E5995',
    bg: '#EFF1F9',
    text: '#3A4479',
    border: '#BFC5E7',
  },
  'Ingeniería Financiera': {
    hex: '#D34324',
    bg: '#FCF0ED',
    text: '#B12F13',
    border: '#F5BCB0',
  },
  'Derecho': {
    hex: '#AC553E',
    bg: '#F9F1EF',
    text: '#8E3F2B',
    border: '#E4BFB6',
  },
  'Ingeniería Petrolera': {
    hex: '#334155',
    bg: '#F1F5F9',
    text: '#1E293B',
    border: '#CBD5E1',
  },
  'Ingeniería Económica': {
    hex: '#B45309',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
  },
  'Técnico Superior en Informática': {
    hex: '#0E5191',
    bg: '#EAF2F9',
    text: '#0E5191',
    border: '#A8CBEC',
  },
  'Técnico Superior en Construcción Civil': {
    hex: '#82868B',
    bg: '#F1F3F5',
    text: '#565B60',
    border: '#D0D4D9',
  },
  'Técnico Superior en Energías Renovables': {
    hex: '#10B981',
    bg: '#ECFDF5',
    text: '#047857',
    border: '#A7F3D0',
  },
  'Técnico Superior en Sistemas Electrónicos': {
    hex: '#4088BD',
    bg: '#EDF6FC',
    text: '#286E9F',
    border: '#B6DBF2',
  },
  'Técnico Superior en Análisis de Sistemas / Diseño Gráfico': {
    hex: '#7C3AED',
    bg: '#F5F3FF',
    text: '#6D28D9',
    border: '#DDD6FE',
  },
};

/**
 * Obtiene la configuración de color institucional para una carrera.
 */
export function getCarreraConfig(carrera?: string) {
  if (!carrera) {
    return {
      hex: '#64748B',
      bg: '#F8FAFC',
      text: '#475569',
      border: '#E2E8F0',
    };
  }

  // Búsqueda directa o normalizada
  if (COLORES_CARRERAS[carrera]) {
    return COLORES_CARRERAS[carrera];
  }

  const normalized = carrera.trim().toLowerCase();
  for (const [key, val] of Object.entries(COLORES_CARRERAS)) {
    if (key.toLowerCase() === normalized || normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return val;
    }
  }

  return {
    hex: '#2563EB',
    bg: '#EFF6FF',
    text: '#1D4ED8',
    border: '#BFDBFE',
  };
}
