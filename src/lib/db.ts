import { supabase } from './supabase';
import type { Proyecto, EstadoProyecto, ProyectoGestion, ResultadoTop, ProyectoAsignado, EstadoAsignado } from './data';
import { CATEGORIA_DEFAULT, getCategoriaPorCarrera } from './constants';

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
  estado: 'Activo' | 'Inactivo' | 'Visitante';
  initials: string;
  proyectosEvaluados: number;
  proyectosPendientes: number;
  avancePorcentaje: number;
  estadoEvaluacion: 'Pendiente' | 'En Progreso' | 'Completado';
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
    .select('id, codigo_proyecto, nombre_proyecto, categoria, sociedad')
    .order('codigo_proyecto');

  if (proyError || !proys) return [];

  // 2. Obtener TODAS las evaluaciones para contar manualmente
  const { data: evals } = await supabase
    .from('evaluaciones')
    .select('id, id_proyecto, confirmada');

  // 3. Obtener todas las asignaciones para saber cuántos jurados tiene asignados cada proyecto
  const { data: asigs } = await supabase
    .from('asignaciones')
    .select('id_proyecto');

  const asigCountMap = new Map<string, number>();
  asigs?.forEach(a => {
    asigCountMap.set(a.id_proyecto, (asigCountMap.get(a.id_proyecto) || 0) + 1);
  });

  // 4. Mapear evaluaciones por proyecto
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

    const asignados = asigCountMap.get(p.id) || 0;
    // Si tiene jurados asignados, el total esperado es la cantidad asignada. Si no, por defecto es 3.
    const total = asignados > 0 ? asignados : 3;

    let estado: EstadoProyecto = 'Pendiente';
    if (confirmadas >= total && total > 0) {
      estado = 'Evaluado';
    } else if (completadas > 0) {
      estado = 'En Proceso';
    }

    return {
      id: p.id,
      codigo: p.codigo_proyecto,
      nombre: p.nombre_proyecto,
      grupo: '',
      categoria: (p.categoria && p.categoria !== 'General' && !p.categoria.startsWith('Categoría')) ? p.categoria : getCategoriaPorCarrera(p.carrera || p.sociedad),
      carrera: p.carrera || p.sociedad || '',
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

  const { data: evals } = await supabase
    .from('evaluaciones')
    .select('id_docente, confirmada')
    .in('id_docente', ids);

  const countMap: Record<string, number> = {};
  (asigs ?? []).forEach((a: any) => {
    countMap[a.id_docente] = (countMap[a.id_docente] ?? 0) + 1;
  });

  const evalsConfirmadasMap: Record<string, number> = {};
  (evals ?? []).forEach((e: any) => {
    if (e.confirmada) {
      evalsConfirmadasMap[e.id_docente] = (evalsConfirmadasMap[e.id_docente] ?? 0) + 1;
    }
  });

  return data.map((d: any) => {
    const asignados = countMap[d.id_usuario] ?? 0;
    const evaluados = evalsConfirmadasMap[d.id_usuario] ?? 0;
    const pendientes = Math.max(0, asignados - evaluados);
    const avance = asignados > 0 ? Math.round((evaluados / asignados) * 100) : 0;
    
    let estadoEvaluacion: 'Pendiente' | 'En Progreso' | 'Completado' = 'Pendiente';
    if (asignados > 0) {
      if (evaluados === asignados) {
        estadoEvaluacion = 'Completado';
      } else if (evaluados > 0) {
        estadoEvaluacion = 'En Progreso';
      }
    }

    return {
      id: d.id_usuario,
      codigo: d.username ?? 'S/C',
      nombre: d.nombre_completo,
      email: d.email,
      departamento: d.materia ?? 'General',
      especialidad: d.grado ?? 'Especialista',
      proyectosAsignados: asignados,
      proyectosTotal: 3,
      estado: d.estado === true ? 'Activo' : d.estado === false ? 'Inactivo' : 'Visitante',
      initials: getInitials(d.nombre_completo),
      proyectosEvaluados: evaluados,
      proyectosPendientes: pendientes,
      avancePorcentaje: avance,
      estadoEvaluacion
    };
  });
}

export async function fetchEvaluadoresDisponibles(): Promise<EvaluadorDisponible[]> {
  const { data, error } = await supabase
    .from('personas')
    .select('id_usuario, nombre_completo, materia')
    .eq('rol', 'docente')
    .or('estado.eq.true,estado.is.null');

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
    .select('id, codigo_proyecto, nombre_proyecto, categoria, sociedad, asistio, habilitado')
    .order('codigo_proyecto');

  if (!proys) return [];

  const { data: asigs } = await supabase
    .from('asignaciones')
    .select('id, id_proyecto, id_docente');

  const { data: personas } = await supabase
    .from('personas')
    .select('id_usuario, nombre_completo, estado');

  const personasMap = new Map(
    personas
      ?.filter((p: any) => p.estado !== false)
      ?.map((p: any) => [p.id_usuario, p.nombre_completo]) || []
  );
  const asigsByProy = new Map<string, any[]>();
  
  asigs?.forEach(a => {
    const nombreDocente = personasMap.get(a.id_docente);
    if (!nombreDocente) return; // Skip if the teacher is inactive
    const list = asigsByProy.get(a.id_proyecto) || [];
    list.push({
      idAsignacion: a.id,
      nombre: nombreDocente
    });
    asigsByProy.set(a.id_proyecto, list);
  });

  return proys.map((p: any) => ({
    id: p.id,
    codigo: p.codigo_proyecto,
    nombre: p.nombre_proyecto,
    sector: (p.categoria && p.categoria !== 'General' && !p.categoria.startsWith('Categoría')) ? p.categoria : getCategoriaPorCarrera(p.carrera || p.sociedad),
    carrera: p.carrera || p.sociedad || '',
    sociedad: p.sociedad || '',
    asistio: p.asistio ?? true,
    habilitado: p.habilitado ?? true,
    evaluadores: asigsByProy.get(p.id) || [],
    accion: (asigsByProy.get(p.id)?.length || 0) >= 3 ? 'Completo' : 'Asignar',
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

export async function autoAsignarDocentes(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    // 1. Obtener todos los proyectos habilitados
    const { data: proys, error: proyError } = await supabase
      .from('proyectos')
      .select('id, codigo_proyecto, nombre_proyecto')
      .eq('habilitado', true);

    if (proyError || !proys) throw new Error(proyError?.message || 'No se pudieron obtener los proyectos');

    // 2. Obtener todos los docentes activos (o visitantes, que también evalúan)
    const { data: docs, error: docError } = await supabase
      .from('personas')
      .select('id_usuario, nombre_completo')
      .eq('rol', 'docente')
      .or('estado.eq.true,estado.is.null');

    if (docError || !docs) throw new Error(docError?.message || 'No se pudieron obtener los docentes');
    if (docs.length < 3) throw new Error('Se necesitan al menos 3 docentes activos para realizar la asignación.');

    // 3. Obtener las asignaciones existentes
    const { data: asigs, error: asigError } = await supabase
      .from('asignaciones')
      .select('id, id_proyecto, id_docente');

    if (asigError) throw new Error(asigError.message);

    // Mapear asignaciones existentes por proyecto y docente
    const asigMap = new Map<string, Set<string>>(); // id_proyecto -> Set of id_docente
    const docAsigCount: Record<string, number> = {}; // id_docente -> count of assignments

    // Inicializar contadores para todos los docentes activos en 0
    docs.forEach(d => {
      docAsigCount[d.id_usuario] = 0;
    });

    (asigs ?? []).forEach(a => {
      if (!asigMap.has(a.id_proyecto)) {
        asigMap.set(a.id_proyecto, new Set());
      }
      asigMap.get(a.id_proyecto)!.add(a.id_docente);
      
      // Incrementar contador si el docente está entre los activos
      if (a.id_docente in docAsigCount) {
        docAsigCount[a.id_docente]++;
      }
    });

    const nuevasAsignaciones: { id_proyecto: string; id_docente: string }[] = [];

    // 4. Para cada proyecto, rellenar hasta tener 3 evaluadores
    for (const p of proys) {
      const asignados = asigMap.get(p.id) || new Set<string>();
      
      while (asignados.size < 3) {
        // Encontrar docentes que no estén asignados a este proyecto
        const candidatos = docs.filter(d => !asignados.has(d.id_usuario));
        if (candidatos.length === 0) break; // No hay más docentes disponibles para este proyecto

        // Ordenar candidatos por cantidad de asignaciones (ascendente) para balancear la carga
        candidatos.sort((a, b) => docAsigCount[a.id_usuario] - docAsigCount[b.id_usuario]);

        // Tomar el docente con menor carga
        const elegido = candidatos[0];
        
        // Agregar la asignación localmente
        asignados.add(elegido.id_usuario);
        docAsigCount[elegido.id_usuario]++;
        
        // Guardar para inserción masiva
        nuevasAsignaciones.push({
          id_proyecto: p.id,
          id_docente: elegido.id_usuario
        });
      }
    }

    // 5. Insertar nuevas asignaciones en la base de datos si hay alguna
    if (nuevasAsignaciones.length > 0) {
      const { error: insertError } = await supabase
        .from('asignaciones')
        .insert(nuevasAsignaciones);

      if (insertError) throw new Error(insertError.message);
    }

    return { success: true, count: nuevasAsignaciones.length };
  } catch (error: any) {
    console.error('Error en autoAsignarDocentes:', error);
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

export async function actualizarProyecto(id: string, data: any) {
  const carrera = data.carrera || data.sociedad || '';
  const payload: any = {
    codigo_proyecto: data.codigo,
    nombre_proyecto: data.nombre,
    categoria: (data.categoria && data.categoria !== 'General' && !data.categoria.startsWith('Categoría')) ? data.categoria : getCategoriaPorCarrera(carrera),
    sociedad: carrera,
    gestion: data.gestion || new Date().getFullYear().toString()
  };
  return await supabase
    .from('proyectos')
    .update(payload)
    .eq('id', id);
}

export async function eliminarProyecto(id: string) {
  return await supabase.from('proyectos').delete().eq('id', id);
}

export async function cambiarAsistenciaProyecto(id: string, asistio: boolean) {
  return await supabase.from('proyectos').update({ asistio }).eq('id', id);
}

// ─── RESULTADOS ───────────────────────────────────────────────────────────────

export async function fetchResultadosTop(limit: number = 50): Promise<ResultadoTop[]> {
  const { data, error } = await supabase
    .from('resultados_proyectos')
    .select(`
      promedio_final,
      ranking_posicion,
      id_proyecto,
      proyectos:id_proyecto (
        codigo_proyecto,
        nombre_proyecto,
        categoria,
        sociedad
      )
    `)
    .order('ranking_posicion', { ascending: true })
    .limit(limit);

  if (error || !data || data.length === 0) return [];

  const proyIds = data.map((r: any) => r.id_proyecto);
  const { data: evals } = await supabase
    .from('evaluaciones')
    .select('id_proyecto')
    .in('id_proyecto', proyIds)
    .eq('confirmada', true);

  const evalCount: Record<string, number> = {};
  evals?.forEach((e: any) => {
    evalCount[e.id_proyecto] = (evalCount[e.id_proyecto] || 0) + 1;
  });

  return data.map((r: any) => {
    const rawCat = r.proyectos?.categoria;
    const carrera = r.proyectos?.carrera || r.proyectos?.sociedad || '';
    const categoria = (rawCat && rawCat !== 'General' && !rawCat.startsWith('Categoría')) ? rawCat : getCategoriaPorCarrera(carrera);
    return {
      id: r.id_proyecto,
      posicion: r.ranking_posicion,
      codigo: r.proyectos?.codigo_proyecto || 'S/C',
      nombre: r.proyectos?.nombre_proyecto || 'Proyecto Desconocido',
      categoria,
      carrera,
      puntajeFinal: Number(r.promedio_final) || 0,
      evaluaciones: evalCount[r.id_proyecto] || 0,
    };
  });
}

export async function resetTodasLasCalificaciones(): Promise<{ error?: string }> {
  const { data: evalIds } = await supabase.from('evaluaciones').select('id');
  if (evalIds && evalIds.length > 0) {
    const { error } = await supabase
      .from('evaluaciones')
      .delete()
      .in('id', evalIds.map((e: any) => e.id));
    if (error) return { error: error.message };
  }

  const { data: resIds } = await supabase
    .from('resultados_proyectos')
    .select('id_proyecto');
  if (resIds && resIds.length > 0) {
    const { error } = await supabase
      .from('resultados_proyectos')
      .delete()
      .in('id_proyecto', resIds.map((r: any) => r.id_proyecto));
    if (error) return { error: error.message };
  }

  return {};
}

/**
 * Calcula el promedio de las evaluaciones de un proyecto y actualiza la tabla de resultados.
 */
export async function sincronizarResultadosProyecto(idProyecto: string) {
  // 1. Obtener todas las evaluaciones confirmadas del proyecto
  const { data: evals } = await supabase
    .from('evaluaciones')
    .select('nota_final')
    .eq('id_proyecto', idProyecto)
    .eq('confirmada', true);

  if (!evals || evals.length === 0) return;

  // 2. Calcular acumulado y promedio
  const puntajeAcumulado = evals.reduce((acc, curr) => acc + (Number(curr.nota_final) || 0), 0);
  const promedio = puntajeAcumulado / evals.length;

  // 3. Upsert en resultados_proyectos
  const { error } = await supabase
    .from('resultados_proyectos')
    .upsert({
      id_proyecto: idProyecto,
      puntaje_acumulado: parseFloat(puntajeAcumulado.toFixed(2)),
      promedio_final: parseFloat(promedio.toFixed(2))
    }, { onConflict: 'id_proyecto' });

  if (error) console.error('Error sincronizando resultados:', error.message);
  
  // 4. Recalcular ranking global
  await recalcularTodoElRanking();
}

/**
 * Sincroniza los resultados de TODOS los proyectos registrados.
 */
export async function sincronizarTodosLosResultados() {
  const { data: proys } = await supabase.from('proyectos').select('id');
  if (!proys) return;

  for (const p of proys) {
    await sincronizarResultadosProyecto(p.id);
  }
}

/**
 * Recalcula las posiciones de ranking para todos los proyectos basados en su promedio.
 */
export async function recalcularTodoElRanking() {
  const { data: resultados } = await supabase
    .from('resultados_proyectos')
    .select('id_proyecto, promedio_final, proyectos:id_proyecto (categoria, sociedad)');

  if (!resultados || resultados.length === 0) return;

  const porCategoria = new Map<string, any[]>();
  resultados.forEach((r: any) => {
    const rawCat = r.proyectos?.categoria;
    const carrera = r.proyectos?.carrera || r.proyectos?.sociedad || '';
    const categoria = (rawCat && rawCat !== 'General' && !rawCat.startsWith('Categoría'))
      ? rawCat
      : getCategoriaPorCarrera(carrera);

    const lista = porCategoria.get(categoria) || [];
    lista.push(r);
    porCategoria.set(categoria, lista);
  });

  for (const [, grupo] of porCategoria) {
    const ordenados = grupo.sort((a, b) => b.promedio_final - a.promedio_final);
    for (let i = 0; i < ordenados.length; i++) {
      await supabase
        .from('resultados_proyectos')
        .update({ ranking_posicion: i + 1 })
        .eq('id_proyecto', ordenados[i].id_proyecto);
    }
  }
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
  return await supabase.from('personas').upsert(payload, { onConflict: 'id_usuario' });
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

export async function fetchProyectosHabilitados(): Promise<{ id: string; codigo_proyecto: string; nombre_proyecto: string; categoria: string; carrera?: string }[]> {
  const { data } = await supabase
    .from('proyectos')
    .select('id, codigo_proyecto, nombre_proyecto, categoria, sociedad')
    .eq('habilitado', true)
    .order('codigo_proyecto');
  return (data || []).map((p: any) => {
    const rawCat = p.categoria;
    const carrera = p.carrera || p.sociedad || '';
    const categoria = (rawCat && rawCat !== 'General' && !rawCat.startsWith('Categoría')) ? rawCat : getCategoriaPorCarrera(carrera);
    return {
      id: p.id,
      codigo_proyecto: p.codigo_proyecto,
      nombre_proyecto: p.nombre_proyecto,
      categoria,
      carrera
    };
  });
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
        nombre_proyecto,
        categoria,
        sociedad
      )
    `)
    .eq('id_docente', idDocente);

  if (!data) return [];

  const { data: evals } = await supabase
    .from('evaluaciones')
    .select('id_proyecto, confirmada')
    .eq('id_docente', idDocente);

  const evalMap = new Map(evals?.map(e => [e.id_proyecto, e.confirmada]) || []);

  return data.map((a: any) => {
    const rawCat = a.proyectos?.categoria;
    const carrera = a.proyectos?.carrera || a.proyectos?.sociedad || '';
    const categoria = (rawCat && rawCat !== 'General' && !rawCat.startsWith('Categoría')) ? rawCat : getCategoriaPorCarrera(carrera);
    return {
      id: a.proyectos?.id || '',
      stand: a.proyectos?.codigo_proyecto || 'S/N',
      categoria,
      carrera,
      nombre: a.proyectos?.nombre_proyecto || 'Desconocido',
      estado: evalMap.get(a.id_proyecto) ? 'Calificado' : 'Pendiente' as EstadoAsignado,
    };
  });
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

// ─── DESHABILITAR (en lugar de eliminar) ─────────────────────────────────────

export async function deshabilitarDocente(id_usuario: string) {
  return await supabase
    .from('personas')
    .update({ estado: false })
    .eq('id_usuario', id_usuario);
}

export async function habilitarDocente(id_usuario: string) {
  return await supabase
    .from('personas')
    .update({ estado: true })
    .eq('id_usuario', id_usuario);
}

export async function deshabilitarProyecto(id: string) {
  return await supabase
    .from('proyectos')
    .update({ habilitado: false })
    .eq('id', id);
}

export async function habilitarProyecto(id: string) {
  return await supabase
    .from('proyectos')
    .update({ habilitado: true })
    .eq('id', id);
}

// ─── CÓMPUTO ─────────────────────────────────────────────────────────────────

export interface ProyectoComputo {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  carrera?: string;
  evaluacionesConfirmadas: number;
  puntajeAcumulado: number;
  promedio: number;
  ranking: number;
  evaluadores: { docente: string; nota: number; observaciones: string }[];
}

export async function fetchComputoProyectos(): Promise<ProyectoComputo[]> {
  const { data: proys } = await supabase
    .from('proyectos')
    .select('id, codigo_proyecto, nombre_proyecto, categoria, sociedad')
    .order('codigo_proyecto');

  if (!proys) return [];

  const { data: evals } = await supabase
    .from('evaluaciones')
    .select('id_proyecto, id_docente, nota_final, confirmada, observaciones');

  const { data: resultados } = await supabase
    .from('resultados_proyectos')
    .select('id_proyecto, puntaje_acumulado, promedio_final, ranking_posicion');

  const { data: personas } = await supabase
    .from('personas')
    .select('id_usuario, nombre_completo');

  const personasMap = new Map(personas?.map(p => [p.id_usuario, p.nombre_completo]) || []);
  const resultadosMap = new Map(resultados?.map(r => [r.id_proyecto, r]) || []);

  const evalsByProy = new Map<string, typeof evals>();
  evals?.forEach(e => {
    const list = evalsByProy.get(e.id_proyecto) || [];
    list.push(e);
    evalsByProy.set(e.id_proyecto, list);
  });

  return proys.map((p: any) => {
    const pEvals = evalsByProy.get(p.id) || [];
    const confirmadas = pEvals.filter((e: any) => e.confirmada);
    const res = resultadosMap.get(p.id);

    const rawCat = p.categoria;
    const carrera = p.carrera || p.sociedad || '';
    const categoria = (rawCat && rawCat !== 'General' && !rawCat.startsWith('Categoría')) ? rawCat : getCategoriaPorCarrera(carrera);

    return {
      id: p.id,
      codigo: p.codigo_proyecto,
      nombre: p.nombre_proyecto,
      categoria,
      carrera,
      evaluacionesConfirmadas: confirmadas.length,
      puntajeAcumulado: res ? Number(res.puntaje_acumulado) : 0,
      promedio: res ? Number(res.promedio_final) : 0,
      ranking: res ? Number(res.ranking_posicion) : 0,
      evaluadores: confirmadas.map((e: any) => ({
        docente: personasMap.get(e.id_docente) || 'Docente',
        nota: Number(e.nota_final) || 0,
        observaciones: e.observaciones || ''
      }))
    };
  });
}

// ─── EVALUACIONES DETALLE (para panel admin) ─────────────────────────────────

export interface EvaluacionDetalle {
  idEvaluacion: string;
  idProyecto: string;
  proyectoCodigo: string;
  proyectoNombre: string;
  proyectoCategoria?: string;
  proyectoCarrera?: string;
  idDocente: string;
  docenteNombre: string;
  docenteMateria: string;
  notaFinal: number;
  observaciones: string;
  confirmada: boolean;
  // Bloques
  bloque1Total: number;
  bloque2Total: number;
  // Indicadores individuales
  doc_ind1: number; doc_ind2: number; doc_ind3: number;
  doc_ind4: number; doc_ind5: number; doc_ind6: number; doc_ind7: number;
  exp_ind1: number; exp_ind2: number; exp_ind3: number;
  exp_ind4: number; exp_ind5: number; exp_ind6: number; exp_ind7: number;
}

export async function fetchEvaluacionesDetalle(): Promise<EvaluacionDetalle[]> {
  const { data: evals, error } = await supabase
    .from('evaluaciones')
    .select(`
      id, id_proyecto, id_docente, nota_final, observaciones, confirmada,
      doc_ind1, doc_ind2, doc_ind3, doc_ind4, doc_ind5, doc_ind6, doc_ind7,
      exp_ind1, exp_ind2, exp_ind3, exp_ind4, exp_ind5, exp_ind6, exp_ind7
    `)
    .order('id_proyecto');

  if (error || !evals) return [];

  const [{ data: proys }, { data: personas }] = await Promise.all([
    supabase.from('proyectos').select('id, codigo_proyecto, nombre_proyecto, categoria, sociedad'),
    supabase.from('personas').select('id_usuario, nombre_completo, materia')
  ]);

  const proysMap = new Map(proys?.map(p => [p.id, p]) || []);
  const personasMap = new Map(personas?.map(p => [p.id_usuario, p]) || []);

  return evals.map((e: any) => {
    const proy = proysMap.get(e.id_proyecto);
    const docente = personasMap.get(e.id_docente);

    const bloque1 = e.doc_ind1 + e.doc_ind2 + e.doc_ind3 + e.doc_ind4 + e.doc_ind5 + e.doc_ind6; // máx 30
    const bloque2 = e.exp_ind1 + e.exp_ind2 + e.exp_ind3 + e.exp_ind4 + e.exp_ind5 + e.exp_ind6 + e.exp_ind7; // máx 70

    const rawCat = proy?.categoria;
    const carrera = (proy as any)?.carrera || proy?.sociedad || '';
    const categoria = (rawCat && rawCat !== 'General' && !rawCat.startsWith('Categoría')) ? rawCat : getCategoriaPorCarrera(carrera);

    return {
      idEvaluacion: e.id,
      idProyecto: e.id_proyecto,
      proyectoCodigo: proy?.codigo_proyecto || 'S/C',
      proyectoNombre: proy?.nombre_proyecto || 'Proyecto desconocido',
      proyectoCategoria: categoria,
      proyectoCarrera: carrera,
      idDocente: e.id_docente,
      docenteNombre: docente?.nombre_completo || 'Docente desconocido',
      docenteMateria: docente?.materia || 'General',
      notaFinal: parseFloat(Number(e.nota_final).toFixed(2)),
      observaciones: e.observaciones || '',
      confirmada: e.confirmada,
      bloque1Total: parseFloat(bloque1.toFixed(2)),
      bloque2Total: parseFloat(bloque2.toFixed(2)),
      doc_ind1: e.doc_ind1 || 0, doc_ind2: e.doc_ind2 || 0, doc_ind3: e.doc_ind3 || 0,
      doc_ind4: e.doc_ind4 || 0, doc_ind5: e.doc_ind5 || 0, doc_ind6: e.doc_ind6 || 0,
      doc_ind7: e.doc_ind7 || 0, exp_ind1: e.exp_ind1 || 0, exp_ind2: e.exp_ind2 || 0,
      exp_ind3: e.exp_ind3 || 0, exp_ind4: e.exp_ind4 || 0, exp_ind5: e.exp_ind5 || 0,
      exp_ind6: e.exp_ind6 || 0, exp_ind7: e.exp_ind7 || 0
    };
  });
}

// ─── RESULTADOS CON OBSERVACIONES ─────────────────────────────────────────────

export async function fetchDetalleConObservaciones(idProyecto: string) {
  const { data } = await supabase
    .from('evaluaciones')
    .select('nota_final, confirmada, id_docente, observaciones')
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
    puntaje: e.nota_final || null,
    observaciones: e.observaciones || ''
  }));
}

// ─── RESULTADOS LIVE (todos los proyectos con ranking) ────────────────────────

export interface ResultadoLive {
  posicion: number;
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  carrera?: string;
  promedio: number;
  evaluacionesConfirmadas: number;
}

export async function fetchResultadosLive(): Promise<ResultadoLive[]> {
  const { data: resultados } = await supabase
    .from('resultados_proyectos')
    .select('id_proyecto, promedio_final, ranking_posicion, puntaje_acumulado')
    .order('ranking_posicion', { ascending: true });

  if (!resultados || resultados.length === 0) return [];

  const proyIds = resultados.map((r: any) => r.id_proyecto);

  const [{ data: proys }, { data: evals }] = await Promise.all([
    supabase.from('proyectos').select('id, codigo_proyecto, nombre_proyecto, categoria, sociedad').in('id', proyIds),
    supabase.from('evaluaciones').select('id_proyecto').in('id_proyecto', proyIds).eq('confirmada', true)
  ]);

  const proysMap = new Map<string, any>(proys?.map((p: any) => [p.id, p]) || []);
  const evalCount: Record<string, number> = {};
  evals?.forEach((e: any) => { evalCount[e.id_proyecto] = (evalCount[e.id_proyecto] || 0) + 1; });

  return resultados.map((r: any) => {
    const p = proysMap.get(r.id_proyecto);
    const rawCat = p?.categoria;
    const carrera = (p as any)?.carrera || p?.sociedad || '';
    const categoria = (rawCat && rawCat !== 'General' && !rawCat.startsWith('Categoría')) ? rawCat : getCategoriaPorCarrera(carrera);
    return {
      posicion: r.ranking_posicion,
      id: r.id_proyecto,
      codigo: p?.codigo_proyecto || 'S/C',
      nombre: p?.nombre_proyecto || 'Proyecto Desconocido',
      categoria,
      carrera,
      promedio: Number(r.promedio_final) || 0,
      evaluacionesConfirmadas: evalCount[r.id_proyecto] || 0
    };
  });
}
