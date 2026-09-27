import type { FastifyInstance } from "fastify";
import { getSessionUser } from "./auth";

/** Root / marketing surface. */
export async function registerHomeRoutes(app: FastifyInstance) {
  app.get("/", async (req, reply) => {
    const user = await getSessionUser(req);
    return reply.inertia.render("Home", {
      title: "Personal starter-kit",
      email: user?.email ?? null,
    });
  });
}
