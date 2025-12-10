import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurar headers para evitar cache excessivo do HTML
  async headers() {
    return [
      {
        // Aplica a todas as páginas HTML
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            // no-cache: força revalidação com servidor antes de usar cache
            // stale-while-revalidate: permite usar versão em cache enquanto busca nova
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        // Assets estáticos com hash podem ser cacheados por muito tempo
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
