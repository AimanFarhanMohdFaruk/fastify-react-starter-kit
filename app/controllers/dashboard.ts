import type { FastifyInstance } from "fastify";
import { getSessionUser } from "./auth";
import { listDemoJobsForUser } from "../models/demo-job";

const FLASH: Record<string, string> = {
  queued: "Job queued — run npm run worker in another terminal",
};

function dashboardJobs(jobs: Awaited<ReturnType<typeof listDemoJobsForUser>>) {
  return jobs.map((j) => ({
    id: j.id,
    payload: j.payload,
    status: j.status,
    result: j.result,
    createdAt: j.createdAt.toISOString(),
  }));
}

export async function registerDashboardRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { flash?: string } }>(
    "/dashboard",
    async (req, reply) => {
      const user = await getSessionUser(req);
      if (!user) return reply.redirect("/login");
      const jobs = await listDemoJobsForUser(user.id);
      const flashKey =
        typeof req.query.flash === "string" ? req.query.flash : null;
      return reply.inertia.render("Dashboard", {
        email: user.email,
        jobs: dashboardJobs(jobs),
        flash: flashKey
          ? (FLASH[flashKey] ?? decodeURIComponent(flashKey))
          : null,
      });
    },
  );
}
