export type EstadoProyecto = 'Evaluado' | 'En Proceso' | 'Pendiente';
export type EstadoDocente = 'Activo' | 'En Receso';
export type EstadoAsignado = 'Pendiente' | 'Calificado';

export interface Proyecto {
  id: string;
  codigo: string;
  nombre: string;
  grupo: string;
  categoria: string;
  estado: EstadoProyecto;
  evaluacionesCompletadas: number;
  evaluacionesTotal: number;
}

export interface Docente {
  id: string;
  codigo: string;
  nombre: string;
  departamento: string;
  especialidad: string;
  proyectosAsignados: number;
  proyectosTotal: number;
  estado: EstadoDocente;
  initials: string;
}

export interface ProyectoGestion {
  id: string;
  codigo: string;
  nombre: string;
  sector: string;
  asistio: boolean;
  evaluadores: { idAsignacion: string; nombre: string }[];
  accion: 'Reasignar' | 'Cambiar' | 'Asignar' | 'Completo';
}

export interface ProyectoAsignado {
  id: string;
  stand: string;
  categoria: string;
  nombre: string;
  estado: EstadoAsignado;
}

export interface CriterioEval {
  id: number;
  nombre: string;
  descripcion: string;
  peso: number;
}

export interface ProyectoDetalle {
  id: string;
  nombre: string;
  stand: string;
  categoria: string;
  equipo: string;
  descripcion: string;
}

export interface ResultadoTop {
  posicion: number;
  nombre: string;
  puntajeFinal: number;
  evaluaciones: number;
  criterios?: { nombre: string; puntaje: number }[];
}

export const dashboardStats = {
  totalProyectos: 148,
  cambio: '+12%',
  evaluados: 92,
  pendientes: 56,
  docentesActivos: 24,
  docentesTotal: 30,
  progreso: 62,
};

export const proyectos: Proyecto[] = [
  { id: '1', codigo: 'PRJ-042', nombre: 'Sistema IoT Agrícola', grupo: 'Grupo 4A', categoria: 'Sistemas Embebidos', estado: 'Evaluado', evaluacionesCompletadas: 3, evaluacionesTotal: 3 },
  { id: '2', codigo: 'PRJ-089', nombre: 'App Predicción Clima', grupo: 'Grupo 2B', categoria: 'Inteligencia Artificial', estado: 'En Proceso', evaluacionesCompletadas: 1, evaluacionesTotal: 3 },
  { id: '3', codigo: 'PRJ-112', nombre: 'Red Neuronal Financiera', grupo: 'Grupo 1C', categoria: 'Ingeniería de Software', estado: 'Pendiente', evaluacionesCompletadas: 0, evaluacionesTotal: 3 },
  { id: '4', codigo: 'PRJ-015', nombre: 'Drone de Rescate', grupo: 'Grupo 8A', categoria: 'Sistemas Embebidos', estado: 'Evaluado', evaluacionesCompletadas: 3, evaluacionesTotal: 3 },
  { id: '5', codigo: 'PRJ-023', nombre: 'Sistema de Visión Artificial', grupo: 'Grupo 3C', categoria: 'Inteligencia Artificial', estado: 'En Proceso', evaluacionesCompletadas: 2, evaluacionesTotal: 3 },
  { id: '6', codigo: 'PRJ-067', nombre: 'Plataforma E-Learning Adaptativa', grupo: 'Grupo 5B', categoria: 'Ingeniería de Software', estado: 'Evaluado', evaluacionesCompletadas: 3, evaluacionesTotal: 3 },
  { id: '7', codigo: 'PRJ-034', nombre: 'Robot Móvil Autónomo', grupo: 'Grupo 7A', categoria: 'Robótica', estado: 'Pendiente', evaluacionesCompletadas: 0, evaluacionesTotal: 3 },
  { id: '8', codigo: 'PRJ-091', nombre: 'Sistema de Riego Inteligente', grupo: 'Grupo 2A', categoria: 'Sistemas Embebidos', estado: 'En Proceso', evaluacionesCompletadas: 1, evaluacionesTotal: 3 },
];

export const docentes: Docente[] = [
  { id: '1', codigo: 'DOC-102', nombre: 'Dr. Carlos Mendoza', departamento: 'Ing. Industrial', especialidad: 'Sistemas Embebidos', proyectosAsignados: 5, proyectosTotal: 10, estado: 'Activo', initials: 'CM' },
  { id: '2', codigo: 'DOC-105', nombre: 'Dra. Elena Ríos', departamento: 'Ciencias de la Comp.', especialidad: 'Inteligencia Artificial', proyectosAsignados: 8, proyectosTotal: 10, estado: 'Activo', initials: 'ER' },
  { id: '3', codigo: 'DOC-112', nombre: 'Ing. Javier Morales', departamento: 'Ing. Electrónica', especialidad: 'Robótica', proyectosAsignados: 0, proyectosTotal: 10, estado: 'En Receso', initials: 'JM' },
  { id: '4', codigo: 'DOC-118', nombre: 'MSc. Andrés Vargas', departamento: 'Ing. de Software', especialidad: 'Desarrollo Web', proyectosAsignados: 10, proyectosTotal: 10, estado: 'Activo', initials: 'AV' },
];

export const proyectosGestion: ProyectoGestion[] = [
  { id: '1', codigo: 'PRJ-089', nombre: 'Optimización de Línea de Ensamblaje', sector: 'Sector Manufactura', accion: 'Reasignar' },
  { id: '2', codigo: 'PRJ-092', nombre: 'Análisis de Cadena de Suministro IoT', sector: 'Logística', accion: 'Cambiar' },
  { id: '3', codigo: 'PRJ-105', nombre: 'Sistema de Control de Calidad Visual', sector: 'Tecnología Industrial', accion: 'Asignar' },
  { id: '4', codigo: 'PRJ-112', nombre: 'Ergonomía en Puestos de Trabajo', sector: 'Salud Ocupacional', accion: 'Cambiar' },
];

export const evaluadoresDisponibles = [
  { id: '1', initials: 'ER', nombre: 'Dra. Elena Rojas', departamento: 'Ingeniería Industrial', asignaciones: 2 },
  { id: '2', initials: 'MS', nombre: 'Ing. Martín Suárez', departamento: 'Sistemas', asignaciones: 4 },
  { id: '3', initials: 'LV', nombre: 'Dra. Laura Vega', departamento: 'Mecatrónica', asignaciones: 1 },
];

export const proyectosAsignados: ProyectoAsignado[] = [
  { id: 'PRJ-101', stand: 'STAND 12', categoria: 'OPTIMIZACIÓN DE PROCESOS', nombre: 'Sistema Automatizado de Control de Calidad mediante Visión Artificial', estado: 'Pendiente' },
  { id: 'PRJ-102', stand: 'STAND 05', categoria: 'LOGÍSTICA Y SCM', nombre: 'Rediseño de Red de Distribución Última Milla en Zonas Urbanas Densas', estado: 'Pendiente' },
  { id: 'PRJ-103', stand: 'STAND 18', categoria: 'ERGONOMÍA', nombre: 'Estación de Trabajo Modular Adaptativa para Ensamblaje Manual', estado: 'Calificado' },
];

export const proyectosDetalle: ProyectoDetalle[] = [
  {
    id: 'PRJ-101',
    nombre: 'Sistema Automatizado de Control de Calidad mediante Visión Artificial',
    stand: 'STAND 12',
    categoria: 'OPTIMIZACIÓN DE PROCESOS',
    equipo: 'Grupo Alfa – 4 integrantes',
    descripcion: 'Sistema de inspección visual automatizada que utiliza redes neuronales convolucionales para detectar defectos en piezas manufacturadas en tiempo real, reduciendo el tiempo de inspección en un 85%.',
  },
  {
    id: 'PRJ-102',
    nombre: 'Rediseño de Red de Distribución Última Milla en Zonas Urbanas Densas',
    stand: 'STAND 05',
    categoria: 'LOGÍSTICA Y SCM',
    equipo: 'Delta Analytics – 3 integrantes',
    descripcion: 'Optimización de rutas de distribución usando algoritmos genéticos y datos geoespaciales para reducir costos logísticos y emisiones de CO₂ en zonas urbanas de alta densidad.',
  },
  {
    id: 'PRJ-103',
    nombre: 'Estación de Trabajo Modular Adaptativa para Ensamblaje Manual',
    stand: 'STAND 18',
    categoria: 'ERGONOMÍA',
    equipo: 'Equipo ErgoPro – 5 integrantes',
    descripcion: 'Diseño de una estación de trabajo ergonómica y modular que se adapta a distintas morfologías corporales para reducir lesiones musculoesqueléticas en líneas de ensamblaje manual.',
  },
];

export const criteriosEval: CriterioEval[] = [
  {
    id: 1,
    nombre: 'Innovación y Creatividad',
    descripcion: 'Evalúe el grado de novedad de la solución tecnológica propuesta. Considere si el proyecto utiliza tecnologías de vanguardia o aplica metodologías existentes de una manera significativamente novedosa para resolver el problema planteado.',
    peso: 20,
  },
  {
    id: 2,
    nombre: 'Aplicación de Ingeniería',
    descripcion: 'Analiza la viabilidad técnica, la robustez del diseño y la correcta aplicación de principios de ingeniería industrial en el prototipo o modelo. Considere la eficiencia, escalabilidad y seguridad de la solución.',
    peso: 40,
  },
  {
    id: 3,
    nombre: 'Presentación y Claridad',
    descripcion: 'Califica la capacidad de los estudiantes para comunicar su idea de forma concisa, responder preguntas técnicas y la calidad visual de sus materiales. Evalúe la estructura de la presentación y el uso efectivo de ayudas visuales.',
    peso: 40,
  },
];

export const resultadosTop: ResultadoTop[] = [
  {
    posicion: 1,
    nombre: 'Red Neuronal para Diagnóstico Predictivo Industrial',
    puntajeFinal: 98.2,
    evaluaciones: 18,
    criterios: [
      { nombre: 'Rigor Técnico', puntaje: 99 },
      { nombre: 'Viabilidad', puntaje: 97 },
    ],
  },
  {
    posicion: 2,
    nombre: 'Sistema de Riego Automatizado IoT',
    puntajeFinal: 94.5,
    evaluaciones: 15,
    criterios: [{ nombre: 'Innovación', puntaje: 96 }],
  },
  {
    posicion: 3,
    nombre: 'Plataforma de Educación Adaptativa con IA',
    puntajeFinal: 92.8,
    evaluaciones: 14,
    criterios: [{ nombre: 'Presentación', puntaje: 95 }],
  },
  { posicion: 4, nombre: 'Drones para Reforestación Autónoma', puntajeFinal: 90.5, evaluaciones: 12 },
  { posicion: 5, nombre: 'Asistente Virtual para Discapacidad Motriz', puntajeFinal: 89.2, evaluaciones: 16 },
  { posicion: 6, nombre: 'Materiales Biodegradables para Packaging Industrial', puntajeFinal: 88.7, evaluaciones: 13 },
];
