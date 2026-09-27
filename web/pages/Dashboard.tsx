import { useForm, router, Link } from "@inertiajs/react";
import { useEffect } from "react";

import { Container } from "@/components/layout";
import { Main } from "@/components/shell/main";
import { ThemeSelector } from "@/components/shell/theme-switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { authClient } from "../lib/auth-client";

type Job = {
  id: string;
  payload: string;
  status: string;
  result: string | null;
  createdAt: string;
};

type Props = { email: string; jobs: Job[]; flash: string | null };

const ACTIVE = new Set(["queued", "running"]);

export default function Dashboard({ email, jobs, flash }: Props) {
  const form = useForm({ payload: "" });
  const hasActiveJobs = jobs.some((j) => ACTIVE.has(j.status));

  // usePoll always hits window.location — after POST /jobs that URL can be /jobs.
  // Poll /dashboard explicitly so partial reloads stay on a real GET route.
  useEffect(() => {
    if (!hasActiveJobs) return;
    const tick = () => {
      router.get(
        "/dashboard",
        {},
        {
          only: ["jobs"],
          preserveState: true,
          preserveScroll: true,
          async: true,
          showProgress: false,
        },
      );
    };
    tick();
    const id = window.setInterval(tick, 1500);
    return () => window.clearInterval(id);
  }, [hasActiveJobs]);

  return (
    <Main className="my-0 py-12">
      <Container className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-sm">
              Dashboard · pg-boss
            </p>
            <h1 className="font-bold text-3xl tracking-tight">Hi, {email}</h1>
          </div>
          <ThemeSelector />
        </div>

        {flash ? (
          <Alert>
            <AlertDescription>{flash}</AlertDescription>
          </Alert>
        ) : null}

        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            form.post("/jobs", { onSuccess: () => form.reset("payload") });
          }}
        >
          <Input
            className="flex-1"
            value={form.data.payload}
            onChange={(e) => form.setData("payload", e.target.value)}
            placeholder="job payload"
            required
          />
          <Button
            type="submit"
            disabled={form.processing}
            loading={form.processing}
          >
            Enqueue demo job
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.reload()}
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/";
            }}
          >
            Log out
          </Button>
          <Button variant="link" render={<Link href="/" />}>
            Home
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Jobs</h2>
          {jobs.length === 0 ? (
            <p className="text-muted-foreground text-sm">None yet.</p>
          ) : (
            <ul className="space-y-3">
              {jobs.map((j) => (
                <li
                  key={j.id}
                  className="rounded-lg border border-border bg-card px-4 py-3 text-card-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{j.status}</Badge>
                    <span className="text-sm">{j.payload}</span>
                  </div>
                  {j.result ? (
                    <p className="mt-2 text-muted-foreground text-xs">
                      {j.result}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </Main>
  );
}
