import React from 'react';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: 'KlikPOS Street - Presentación Comercial Oficial',
  description: 'Convierte tu teléfono en una Caja Registradora Inteligente. Facturación táctil, tasa BCV automática y 100% offline.',
};

export default function PresentacionPage() {
  const htmlPath = path.join(process.cwd(), 'public', 'presentacion-comercial.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  return (
    <div
      className="w-full min-h-screen bg-black"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
