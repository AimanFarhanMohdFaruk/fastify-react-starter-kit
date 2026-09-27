import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import fastifyStatic from "@fastify/static";
import inertia from "alex-fastify-inertiajs";
import { registerAuthRoutes } from "../../app/controllers/auth";
import { registerHomeRoutes } from "../../app/controllers/home";
import { registerDashboardRoutes } from "../../app/controllers/dashboard";
import { registerJobRoutes } from "../../app/controllers/jobs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../..");
const isProd = process.env.NODE_ENV === "production";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cookie);
  await app.register(formbody);

  if (isProd) {
    await app.register(fastifyStatic, {
      root: path.join(root, "build/client"),
      prefix: "/",
      decorateReply: false,
    });
  }

  await app.register(inertia, {
    rootElementId: "root",
    assetsVersion: "v1",
    ssrEnabled: true,
    indexEntrypoint: path.join(root, "index.html"),
    indexBuildEntrypoint: path.join(root, "build/client/index.html"),
    ssrEntrypoint: path.join(root, "web/ssr.tsx"),
    ssrBuildEntrypoint: path.join(root, "build/ssr/ssr.js"),
    vite: {
      configFile: path.join(root, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "custom",
    },
  });

  await registerAuthRoutes(app);
  await registerHomeRoutes(app);
  await registerDashboardRoutes(app);
  await registerJobRoutes(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Web listening on http://localhost:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
