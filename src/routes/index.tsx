import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartPulse, ShieldCheck, Calendar, MessageSquare, Sparkles, Activity, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Livvo — Saúde Conectada" },
      { name: "description", content: "Encontre profissionais de saúde perto de você. Agende, converse e acompanhe sua saúde com segurança." },
      { property: "og:title", content: "Livvo — Saúde Conectada" },
      { property: "og:description", content: "Sua saúde conectada em um só lugar." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-surface text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <HeartPulse className="size-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Livvo</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Recursos</a>
            <a href="#for-pros" className="hover:text-foreground">Para profissionais</a>
            <a href="#trust" className="hover:text-foreground">Segurança</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="sm">Criar conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(215_85%_94%)_0%,transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="livvo-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
                <span className="size-2 rounded-full bg-health animate-pulse" />
                Plataforma de saúde digital
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                Sua saúde <span className="text-primary">conectada</span><br />
                em um só lugar
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                Encontre profissionais de saúde perto de você, agende consultas de forma simples e segura e acompanhe seus exames e orientações pelo app.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth" search={{ mode: "signup" }}>
                  <Button size="lg" className="rounded-xl px-6">Começar agora</Button>
                </Link>
                <Link to="/auth" search={{ mode: "signup", role: "profissional" }}>
                  <Button size="lg" variant="outline" className="rounded-xl px-6">Sou profissional</Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-health" /> LGPD compliant</div>
                <div className="flex items-center gap-2"><Activity className="size-4 text-health" /> Telemedicina</div>
                <div className="flex items-center gap-2"><Stethoscope className="size-4 text-health" /> +10 especialidades</div>
              </div>
            </div>

            {/* Mock device */}
            <div className="livvo-slide-up relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/20 via-health/10 to-transparent blur-2xl" />
              <div className="overflow-hidden rounded-[2.5rem] border-8 border-foreground/90 bg-surface shadow-2xl">
                <div className="bg-primary px-6 pt-10 pb-8 text-primary-foreground">
                  <p className="text-xs opacity-80">Bem-vinda de volta</p>
                  <p className="text-lg font-semibold">Olá, Maria</p>
                  <div className="mt-6 rounded-2xl bg-white/15 p-4 backdrop-blur">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Próxima consulta</p>
                    <p className="mt-1 text-sm font-semibold">Dra. Helena Souza · 14h30</p>
                    <p className="text-xs opacity-80">Dermatologia</p>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  {["Cardiologia", "Pediatria", "Psicologia"].map((s) => (
                    <div key={s} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                        <HeartPulse className="size-5" />
                      </div>
                      <div className="flex-1 text-sm font-semibold">{s}</div>
                      <span className="text-xs font-bold text-health">★ 4.9</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-card/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Acompanhe consultas, exames e orientações pelo app</h2>
            <p className="mt-4 text-muted-foreground">Uma experiência completa, do agendamento ao pós-atendimento.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Calendar, title: "Agendamento simples", desc: "Encontre horários disponíveis e marque em poucos toques." },
              { icon: MessageSquare, title: "Chat seguro", desc: "Converse com seu profissional após a confirmação da consulta." },
              { icon: Sparkles, title: "Carteira de saúde", desc: "Exames, receitas e orientações sempre à mão." },
            ].map((f) => (
              <div key={f.title} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <f.icon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For pros */}
      <section id="for-pros" className="py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex rounded-full bg-health-soft px-3 py-1 text-xs font-semibold text-health">Para profissionais</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Cresça sua prática com a Livvo</h2>
            <p className="mt-4 text-muted-foreground">Gerencie sua agenda, pacientes e atendimentos em uma plataforma feita para você.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {["Agenda inteligente com bloqueios", "Lista de pacientes e histórico clínico", "Chat seguro após confirmação", "Painel de avaliações e métricas"].map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="grid size-5 place-items-center rounded-full bg-health text-white">✓</span>
                  <span className="text-foreground">{i}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link to="/auth" search={{ mode: "signup", role: "profissional" }}>
                <Button size="lg" className="rounded-xl">Cadastrar como profissional</Button>
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elevated)]">
            <div className="grid grid-cols-2 gap-4">
              {[
                { v: "247", l: "Consultas no mês" },
                { v: "4.9", l: "Avaliação média" },
                { v: "12", l: "Próximos agendamentos" },
                { v: "R$ 18k", l: "Receita do mês" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-border bg-surface p-4">
                  <p className="font-mono text-2xl font-bold text-primary">{s.v}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="trust" className="border-t border-border/60 bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Pronto para começar?</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">Junte-se a milhares de pacientes e profissionais que confiam na Livvo.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" variant="secondary" className="rounded-xl">Criar minha conta</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Livvo Saúde Conectada · LGPD compliant
      </footer>
    </div>
  );
}
