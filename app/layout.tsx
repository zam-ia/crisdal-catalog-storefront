import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catálogos CRISDAL",
  description: "Catálogos digitales administrados por CRISDAL Agency"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
