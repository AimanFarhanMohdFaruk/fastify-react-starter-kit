import type { FastifyInstance } from "fastify";
import { getSessionUser } from "./auth";
import { enqueueDemoJob } from "../services/enqueue-demo";

export async function registerJobRoutes(app: FastifyInstance) {
  /** Enqueue then redirect so the browser URL is /dashboard (not /jobs). */
  app.post("/jobs", async (req, reply) => {
    const user = await getSessionUser(req);
    if (!user) return reply.redirect("/login");
    const body = req.body as { payload?: string };
    try {
      await enqueueDemoJob(user.id, String(body.payload ?? ""));
      return reply.redirect("/dashboard?flash=queued");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Enqueue failed";
      return reply.redirect(`/dashboard?flash=${encodeURIComponent(message)}`);
    }
  });

  /** Safety for tabs still stuck on /jobs after an earlier non-redirecting POST. */
  app.get("/jobs", async (_req, reply) => reply.redirect("/dashboard"));
}
