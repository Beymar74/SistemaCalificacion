import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UICYT – Sistema de Evaluación",
  description: "UICYT · Unidad de Investigación, Ciencia y Tecnología – Plataforma de Gestión y Evaluación de Proyectos",
  icons: {
    icon: "/logo/uicyt-emblem.png",
    shortcut: "/logo/uicyt-emblem.png",
    apple: "/logo/uicyt-emblem.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
