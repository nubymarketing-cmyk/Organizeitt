/** @type {import('next').NextConfig} */
const basePath = process.env.BASE_PATH || '';

const nextConfig = {
  // Site 100% estático: gera a pasta out/ (GitHub Pages, Vercel, Netlify, qualquer hospedagem)
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  // ASSET_BASE permite caminhos relativos ('.') para pré-visualizações fora da raiz do domínio
  env: { NEXT_PUBLIC_BASE_PATH: process.env.ASSET_BASE ?? basePath },
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
