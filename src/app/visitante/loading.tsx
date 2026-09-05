import LoadingScreen from '@/components/LoadingScreen';

export default function Loading() {
  return (
    <LoadingScreen
      message="Cargando portal de evaluación..."
      submessage="Feria de Innovación y Tecnología · UICYT"
      fullScreen={true}
    />
  );
}
