import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRISDAL Agency | Catálogos digitales",
  description: "Catálogos digitales personalizados, responsivos y fáciles de compartir por link o QR."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
