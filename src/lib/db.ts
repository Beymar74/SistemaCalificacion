import { supabase } from './supabase';
import type { Proyecto, EstadoProyecto, ProyectoGestion, ResultadoTop, ProyectoAsignado, EstadoAsignado } from './data';

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface DocenteAdmin {
  id: string;
  codigo: string;
  nombre: string;
  email: string;
  departamento: string;
  especialidad: string;
  proyectosAsignados: number;
  proyectosTotal: number;
  estado: 'Activo' | 'En Receso';
  initials: string;
}

export interface EvaluadorDisponible {
  id: string;
  initials: string;
  nombre: string;
  departamento: string;
  asignaciones: number;
}

export interface DocentesSummary {
  activos: number;
  total: number;
}

export interface ConfigSistema {
  id: string;
  periodo_activo: string;
  evaluacion_abierta: boolean;
  mostrar_resultados: boolean;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const PREFIJOS = new Set(['Dr.', 'Dra.', 'Ing.', 'MSc.', 'Lic.', 'Mgr.', 'Prof.']);

function getInitials(name: string): string {
  if (!name) return '??';
  const words = name.split(' ').filter(w => w.length > 0 && !PREFIJOS.has(w));
  return words
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

// ─── PROYECTOS ────────────────────────────────────────────────────────────────

export async function fetchProyectosAdmin(): Promise<Proyecto[]> {
  // 1. Obtener todos los proyectos
  const { data: proys, error: proyError } = await supabase
    .from('proyectos')
    .select('id, codigo_proyecto, nombre_proyecto, categoria')
    .order('codigo_proyecto');

  if (proyError || !proys) return [];

  // 2. Obtener TODAS las evaluaciones para contar manualmente
  const { data: evals } = await supabase
    .from('evaluaciones')
    .select('id, id_proyecto, confirmada');

  // 3. Mapear evaluaciones por proyecto
  const evalCountMap = new Map<string, any[]>();
  evals?.forEach(e => {
    const list = evalCountMap.get(e.id_proyecto) || [];
    list.push(e);
    evalCountMap.set(e.id_proyecto, list);
  });

  return proys.map((p: any) => {
    const projectEvals = evalCountMap.get(p.id) || [];
    const completadas = projectEvals.length;
    const confirmadas = projectEvals.filter((e: any) => e.confirmada).length;
    const total = 3; 

    let estado: EstadoProyecto = 'Pendiente';
    if (confirmadas >= total) estado = 'Evaluado';
    else if (completadas > 0) estado = 'En Proceso';

    return {
      id: p.id,
      codigo: p.codigo_proyecto,
      nombre: p.nombre_proyecto,
      grupo: '',
      categoria: p.categoria || 'General',
      estado,
      evaluacionesCompletadas: completadas,
      evaluacionesTotal: total,
    };
  });
}

export async function fetchDocentesSummary(): Promise<DocentesSummary> {
  const { data } = await supabase
    .from('personas')
    .select('id_usuario, estado')
    .eq('rol', 'docente');

  if (!data) return { activos: 0, total: 0 };
  const activos = data.filter((p: any) => p.estado === true).length;
  return { activos, total: data.length };
}

// ─── DOCENTES ─────────────────────────────────────────────────────────────────

export async function fetchDocentesAdmin(): Promise<DocenteAdmin[]> {
  const { data, error } = await supabase
    .from('personas')
    .select('id_usuario, nombre_completo, materia, grado, estado, email, username')
    .eq('rol', 'docente')
    .order('nombre_completo');

  if (error || !data) return [];

  const ids = data.map((d: any) => d.id_usuario);
  const { data: asigs } = await supabase
    .from('asignaciones')
    .select('id_docente')
    .in('id_docente', ids);

  const countMap: Record<string, number> = {};
  (asigs ?? []).forEach((a: any) => {
    countMap[a.id_docente] = (countMap[a.id_docente] ?? 0) + 1;
  });

  return data.map((d: any) => ({
    id: d.id_usuario,
    codigo: d.username ?? 'S/C',
    nombre: d.nombre_completo,
    email: d.email,
    departamento: d.materia ?? 'General',
    especialidad: d.grado ?? 'Especialista',
    proyectosAsignados: countMap[d.id_usuario] ?? 0,
    proyectosTotal: 10,
    estado: d.estado ? 'Activo' : 'En Receso',
    initials: getInitials(d.nombre_completo),
  }));
}

export async function fetchEvaluadoresDisponibles(): Promise<EvaluadorDisponible[]> {
  const { data, error } = await supabase
    .from('personas')
    .select('id_usuario, nombre_completo, materia')
    .eq('rol', 'docente')
    .eq('estado', true);

  if (error || !data) return [];

  const ids = data.map((d: any) => d.id_usuario);
  const { data: asigs } = await supabase
    .from('asignaciones')
    .select('id_docente')
    .in('id_docente', ids);

  const countMap: Record<string, number> = {};
  (asigs ?? []).forEach((a: any) => {
    countMap[a.id_docente] = (countMap[a.id_docente] ?? 0) + 1;
  });

  return data.map((d: any) => ({
    id: d.id_usuario,
    initials: getInitials(d.nombre_completo),
    nombre: d.nombre_completo,
    departamento: d.materia ?? 'General',
    asignaciones: countMap[d.id_usuario] ?? 0,
  }));
}

// ─── GESTIÓN DE PROYECTOS ─────────────────────────────────────────────────────

export async function fetchProyectosParaGestion(): Promise<ProyectoGestion[]> {
  const { data: proys } = await supabase
    .from('proyectos')
    .select('id, codigo_proyecto, nombre_proyecto, categoria, asistio')
    .order('codigo_proyecto');

  if (!proys) return [];

  const { data: asigs } = await supabase
    .from('asignaciones')
    .select('id, id_proyecto, id_docente');

  const { data: personas } = await supabase
    .from('personas')
    .select('id_usuario, nombre_completo');

  const personasMap = new Map(personas?.map(p => [p.id_usuario, p.nombre_completo]) || []);
  const asigsByProy = new Map<string, any[]>();
  
  asigs?.forEach(a => {
    const list = asigsByProy.get(a.id_proyecto) || [];
    list.push({
      idAsignacion: a.id,
      nombre: personasMap.get(a.id_docente) || 'Docente'
    });
    asigsByProy.set(a.id_proyecto, list);
  });

  return proys.map((p: any) => ({
    id: p.id,
    codigo: p.codigo_proyecto,
    nombre: p.nombre_proyecto,
    sector: p.categoria || 'General',
    asistio: p.asistio ?? true,
    evaluadores: asigsByProy.get(p.id) || [],
    accion: (asigsByProy.get(p.id)?.length || 0) >= 4 ? 'Completo' : 'Asignar',
  }));
}

export async function eliminarAsignacion(idAsignacion: string) {
  return await supabase.from('asignaciones').delete().eq('id', idAsignacion);
}

export async function fetchAuditoriaAsignaciones() {
  const { data: asigs, error: asigError } = await supabase
    .from('asignaciones')
    .select('id, id_proyecto, id_docente');

  if (asigError || !asigs) return [];

  const [{ data: docs }, { data: proys }] = await Promise.all([
    supabase.from('personas').select('id_usuario, nombre_completo, materia'),
    supabase.from('proyectos').select('id, codigo_proyecto, nombre_proyecto')
  ]);

  const docsMap = new Map(docs?.map(d => [d.id_usuario, d]) || []);
  const proysMap = new Map(proys?.map(p => [p.id, p]) || []);

  return asigs.map((a: any) => {
    const d = docsMap.get(a.id_docente);
    const p = proysMap.get(a.id_proyecto);

    return {
      id: a.id,
      idProyecto: a.id_proyecto || '',
      idDocente: a.id_docente || '',
      proyectoCodigo: p?.codigo_proyecto || 'N/A',
      proyectoNombre: p?.nombre_proyecto || 'PROYECTO ELIMINADO',
      docenteNombre: d?.nombre_completo || 'DOCENTE NO ENCONTRADO',
      docenteMateria: d?.materia || 'N/A'
    };
  });
}

export async function crearAsignacion(idProyecto: string, idDocente: string) {
  return await supabase
    .from('asignaciones')
    .insert([{ id_proyecto: idProyecto, id_docente: idDocente }]);
}

export async function actualizarProyecto(id: string, data: any) {
  return await supabase
    .from('proyectos')
    .update({
      codigo_proyecto: data.codigo,
      nombre_proyecto: data.nombre,
      categoria: data.categoria,
      gestion: data.gestion || new Date().getFullYear().toString()
    })
    .eq('id', id);
}

export async function eliminarProyecto(id: string) {
  return await supabase.from('proyectos').delete().eq('id', id);
}

export async function cambiarAsistenciaProyecto(id: string, asistio: boolean) {
  return await supabase.from('proyectos').update({ asistio }).eq('id', id);
}

// ─── RESULTADOS ───────────────────────────────────────────────────────────────

export async function fetchResultadosTop(limit: number = 5): Promise<ResultadoTop[]> {
  const { data, error } = await supabase
    .from('resultados_proyectos')
    .select(`
      promedio_final,
      ranking_posicion,
      id_proyecto,
      proyectos:id_proyecto (
        codigo_proyecto,
        nombre_proyecto,
        evaluaciones(id)
      )
    `)
    .order('ranking_posicion', { ascending: true })
    .limit(limit);

  if (error || !data || data.length === 0) return [];

  return data.map((r: any) => ({
    posicion: r.ranking_posicion,
    nombre: r.proyectos?.nombre_proyecto || 'Proyecto Desconocido',
    puntajeFinal: Number(r.promedio_final) || 0,
    evaluaciones: r.proyectos?.evaluaciones?.length || 0,
  }));
}

// ─── CRITERIOS DE EVALUACIÓN ──────────────────────────────────────────────────

export interface Criterio {
  id: string;
  nombre: string;
  descripcion: string;
  peso: number;
}

export async function fetchCriterios(): Promise<Criterio[]> {
  const { data, error } = await supabase
    .from('criterios_evaluacion')
    .select('*')
    .order('id');
  return data || [];
}

export async function upsertCriterio(criterio: Criterio) {
  return await supabase.from('criterios_evaluacion').upsert(criterio);
}

export async function eliminarCriterio(id: string) {
  return await supabase.from('criterios_evaluacion').delete().eq('id', id);
}

// ─── DOCENTES CRUD ────────────────────────────────────────────────────────────

export async function upsertDocente(docente: any) {
  const payload = {
    id_usuario: docente.id_usuario,
    nombre_completo: docente.nombre_completo,
    email: docente.email,
    username: docente.username,
    rol: 'docente',
    estado: docente.estado,
    grado: docente.grado,
    materia: docente.materia
  };
  return await supabase.from('personas').upsert(payload);
}

export async function eliminarDocente(id_usuario: string) {
  return await supabase.from('personas').delete().eq('id_usuario', id_usuario);
}

export async function fetchDetalleProyectoEvaluaciones(idProyecto: string) {
  const { data } = await supabase
    .from('evaluaciones')
    .select(`
      nota_final,
      confirmada,
      id_docente
    `)
    .eq('id_proyecto', idProyecto);

  if (!data || data.length === 0) return [];

  const { data: personas } = await supabase
    .from('personas')
    .select('id_usuario, nombre_completo, materia')
    .in('id_usuario', data.map(e => e.id_docente));

  const pMap = new Map(personas?.map(p => [p.id_usuario, p]) || []);

  return data.map((e: any) => ({
    docente: pMap.get(e.id_docente)?.nombre_completo || 'Desconocido',
    departamento: pMap.get(e.id_docente)?.materia || 'General',
    estado: e.confirmada ? 'completado' : 'pendiente',
    puntaje: e.nota_final || null
  }));
}

export async function fetchAsignacionesDocente(idDocente: string): Promise<ProyectoAsignado[]> {
  const { data } = await supabase
    .from('asignaciones')
    .select(`
      id,
      id_proyecto,
      proyectos:id_proyecto (
        id,
        codigo_proyecto,
        nombre_proyecto
      )
    `)
    .eq('id_docente', idDocente);

  if (!data) return [];

  const { data: evals } = await supabase
    .from('evaluaciones')
    .select('id_proyecto, confirmada')
    .eq('id_docente', idDocente);

  const evalMap = new Map(evals?.map(e => [e.id_proyecto, e.confirmada]) || []);

  return data.map((a: any) => ({
    id: a.proyectos?.id || '',
    stand: a.proyectos?.codigo_proyecto || 'S/N',
    categoria: '',
    nombre: a.proyectos?.nombre_proyecto || 'Desconocido',
    estado: evalMap.get(a.id_proyecto) ? 'Calificado' : 'Pendiente' as EstadoAsignado,
  }));
}

// ─── CONFIGURACIÓN DEL SISTEMA ────────────────────────────────────────────────

export async function fetchConfiguracion(): Promise<ConfigSistema | null> {
  const { data, error } = await supabase
    .from('configuracion_sistema')
    .select('*')
    .single();

  if (error || !data) return null;
  return data;
}

export async function updateConfiguracion(config: ConfigSistema): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('configuracion_sistema')
    .update(config)
    .eq('id', config.id);

  if (error) return { error: error.message };
  return {};
}
