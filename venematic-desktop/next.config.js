/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Para Tauri podemos habilitar export estático cuando se haga el build final
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
