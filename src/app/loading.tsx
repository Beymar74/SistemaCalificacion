import LoadingScreen from '@/components/LoadingScreen';

export default function Loading() {
  return (
    <LoadingScreen
      message="Cargando Sistema UICYT..."
      submessage="Escuela Militar de Ingeniería · 2026"
      fullScreen={true}
    />
  );
}
