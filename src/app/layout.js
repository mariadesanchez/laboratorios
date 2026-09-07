import "./globals.css";

export const metadata = {
  title: "Mueble Farmacia 5x9",
  description: "Gestión de mueble farmacéutico con búsqueda de laboratorios",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
