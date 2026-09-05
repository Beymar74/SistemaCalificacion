import LoadingScreen from '@/components/LoadingScreen';

export default function Loading() {
  return (
    <LoadingScreen
      message="Cargando portal docente..."
      submessage="Sistema de Calificación y Evaluación · EMI"
      fullScreen={true}
    />
  );
}
