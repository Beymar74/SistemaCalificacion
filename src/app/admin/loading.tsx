import LoadingScreen from '@/components/LoadingScreen';

export default function Loading() {
  return (
    <LoadingScreen
      message="Cargando módulo institucional..."
      submessage="Unidad de Investigación Ciencia y Tecnología · EMI"
      fullScreen={false}
    />
  );
}
