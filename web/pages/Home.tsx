import { Link } from "@inertiajs/react";

import { Container, Section } from "@/components/layout";
import { ThemeSelector } from "@/components/shell/theme-switch";
import { Main } from "@/components/shell/main";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = { title: string; email: string | null };

export default function Home({ title, email }: Props) {
  return (
    <Main className="my-0 py-12">
      <Container className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Badge variant="secondary">personal-starter-kit</Badge>
          <ThemeSelector />
        </div>

        <Section spacing="none">
          <Section.Header>
            <Section.Eyebrow>Fastify · Inertia · Drizzle</Section.Eyebrow>
            <Section.Title>{title}</Section.Title>
            <Section.Description>
              Rails-shaped monolith: models own domain, UI stays
              presentation-only.
            </Section.Description>
          </Section.Header>
          <Section.Content className="mt-8 flex flex-wrap gap-3">
            {email ? (
              <>
                <p className="w-full text-muted-foreground text-sm">
                  Signed in as{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <Button render={<Link href="/dashboard" />}>Dashboard</Button>
              </>
            ) : (
              <Button render={<Link href="/login" />}>Sign in</Button>
            )}
          </Section.Content>
        </Section>
      </Container>
    </Main>
  );
}
