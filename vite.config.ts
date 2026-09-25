import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';

// En local, on sert /api/room avec le même code que la fonction Vercel.
function localApi(): Plugin {
  return {
    name: 'grand-tour-local-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/room', async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const mod = await server.ssrLoadModule('/api/room.ts');
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const url = `http://${req.headers.host}/api/room${req.url === '/' ? '' : req.url}`;
          const request = new Request(url, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
          });
          const handler = req.method === 'POST' ? mod.POST : mod.GET;
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          console.error(e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
    plugins: [react(), localApi()],
    server: { host: true, port: 5173 },
  };
});
