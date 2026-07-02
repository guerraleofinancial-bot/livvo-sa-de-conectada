import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  Store,
  FileCheck2,
  UserCircle2,
  Users2,
  CalendarClock,
  Receipt,
  Wallet,
  Sparkles,
  Globe,
  Megaphone,
  Landmark,
  Percent,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/livvo/marketing-shell";

export const Route = createFileRoute("/para-parceiros")({
  head: () => ({
    meta: [
      { title: "Para profissionais e empresas | Livvo" },
      {
        name: "description",
        content:
          "Marketplace, CRM, agenda, cobranças, financeiro, marketing e centro de crescimento em um só lugar. Cadastro gratuito para profissionais e clínicas.",
      },
      { property: "og:title", content: "Livvo para profissionais e empresas" },
      {
        property: "og:description",
        content: "Receba pacientes da sua região e gerencie toda sua operação em uma única plataforma.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PartnerLanding,
});

const modules = [
  {
    Icon: Store,
    title: "Marketplace",
    desc: "Sua vitrine em um marketplace de alta intenção, ranqueado por relevância, localização e reputação.",
  },
  {
    Icon: FileCheck2,
    title: "Aprovação documental",
    desc: "Análise manual de identidade, conselho e especialização — só entra quem é verificado.",
  },
  {
    Icon: UserCircle2,
    title: "Perfil público",
    desc: "Página institucional com bio, serviços, avaliações, endereço, horários e botão de agendamento.",
  },
  {
    Icon: Users2,
    title: "CRM",
    desc: "Histórico de pacientes, pendências, retornos, no-shows e evolução em um funil visual.",
  },
  {
    Icon: CalendarClock,
    title: "Agenda",
    desc: "Slots configuráveis, confirmação, remarcação, cancelamento e integração com cobrança.",
  },
  {
    Icon: Receipt,
    title: "Cobranças",
    desc: "Cobrança digital para cada atendimento, com link, QR e confirmação automática.",
  },
  {
    Icon: Wallet,
    title: "Financeiro",
    desc: "Dashboard de receita, pendências, repasses e conciliação por período.",
  },
  {
    Icon: Sparkles,
    title: "Centro de crescimento",
    desc: "Metas, recomendações personalizadas e progresso de perfil para atrair mais pacientes.",
  },
  {
    Icon: Globe,
    title: "Página pública",
    desc: "URL personalizada (ex.: livvo.app/p/seu-nome), SEO otimizado e schema.org.",
  },
  {
    Icon: Megaphone,
    title: "Marketing",
    desc: "Kit de divulgação, QR code, compartilhamento em redes sociais e destaques patrocinados.",
  },
  {
    Icon: Landmark,
    title: "Recebimentos",
    desc: "Repasse automático dos valores líquidos direto para sua conta bancária.",
  },
  {
    Icon: Percent,
    title: "Comissão da Livvo",
    desc: "Modelo transparente por agendamento concluído. Novos parceiros ganham 90 dias sem comissão.",
  },
];

const approvalSteps = [
  { n: "1", title: "Cadastro", desc: "Crie sua conta como profissional ou empresa em minutos." },
  { n: "2", title: "Envio de documentos", desc: "Identidade, registro no conselho e especialização." },
  { n: "3", title: "Análise manual", desc: "Nossa equipe valida cada documento em até 48h úteis." },
  { n: "4", title: "Aprovação e go-live", desc: "Perfil publicado com selo de parceiro verificado." },
];

const stats = [
  { Icon: TrendingUp, label: "Alta intenção", value: "Pacientes prontos para agendar", },
  { Icon: ShieldCheck, label: "Verificação", value: "Todos os parceiros validados manualmente" },
  { Icon: Clock, label: "Setup rápido", value: "Perfil publicado em até 48h úteis" },
];

function PartnerLanding() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(160_60%_92%)_0%,transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-16 md:pt-20 md:pb-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-health-soft px-3 py-1 text-xs font-semibold text-health">
            <Briefcase className="size-3.5" /> Área do profissional e empresa
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl">
            Receba pacientes da sua região e gerencie{" "}
            <span className="text-primary">toda sua operação</span> em um só lugar.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Marketplace, CRM, agenda, cobranças, financeiro, marketing e centro de crescimento —
            tudo integrado, com aprovação documental e comissão transparente.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup", role: "profissional" }}>
              <Button size="lg" className="rounded-xl bg-health text-white hover:bg-health/90">
                Cadastrar-se grátis
              </Button>
            </Link>
            <Link to="/auth" search={{ mode: "login", role: "profissional" }}>
              <Button size="lg" variant="outline" className="rounded-xl">Entrar como parceiro</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            É uma clínica, laboratório ou centro de imagem?{" "}
            <Link to="/para-empresas" className="font-semibold text-primary hover:underline">
              Conheça a área para empresas
            </Link>
          </p>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {stats.map(({ Icon, label, value }) => (
              <div key={label} className="rounded-2xl border border-border bg-card p-5 text-left">
                <div className="grid size-10 place-items-center rounded-xl bg-health-soft text-health">
                  <Icon className="size-5" />
                </div>
                <p className="mt-3 text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Módulos da plataforma */}
      <section className="border-t border-border/60 bg-card/40 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">A plataforma</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Tudo o que você precisa para operar e crescer</h2>
            <p className="mt-3 text-muted-foreground">
              Cada módulo foi desenhado para reduzir tarefas manuais e liberar seu tempo para o que importa: cuidar.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Processo de aprovação */}
      <section id="aprovacao" className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                <FileCheck2 className="size-3.5" /> Processo de aprovação
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Só entra quem é verificado.
              </h2>
              <p className="mt-4 text-muted-foreground">
                A confiança do paciente vem da nossa verificação. Antes de publicar seu perfil,
                nossa equipe analisa manualmente:
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Documento de identidade oficial com foto",
                  "Registro ativo no conselho profissional",
                  "Comprovação da especialidade declarada",
                  "Dados cadastrais da pessoa jurídica (quando aplicável)",
                ].map((i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-health text-white text-xs">✓</span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground">
                Enquanto o perfil está em análise você já pode explorar a plataforma em{" "}
                <span className="font-semibold text-foreground">modo demonstração</span>, sem
                receber agendamentos reais.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/verificacao">
                  <Button variant="outline" className="rounded-xl">
                    Ver critérios completos <ArrowRight className="ml-1 size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              {approvalSteps.map((s) => (
                <div key={s.n} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comissão / Financeiro / Recebimentos */}
      <section className="border-t border-border/60 bg-card/40 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Financeiro transparente</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Comissão simples, repasse automático</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Percent className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">Comissão por agendamento concluído</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Sem mensalidade obrigatória: a Livvo só ganha quando você atende. Modelo transparente,
                exibido antes de cada cobrança.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Sparkles className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">90 dias sem comissão</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Novos parceiros recebem 100% do valor nos primeiros 90 dias para acelerar a
                validação da plataforma.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Landmark className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">Repasse automático</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                O valor líquido cai direto na sua conta bancária cadastrada, com extrato detalhado
                no painel financeiro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Checklist final */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-5">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elevated)]">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Pronto para começar?</h2>
            <p className="mt-2 text-muted-foreground">Em minutos você cria sua conta, envia documentos e prepara seu perfil.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Cadastro gratuito, sem cartão",
                "Suporte humano durante o onboarding",
                "Modo demonstração enquanto seu perfil é analisado",
                "Documentação verificada e selo de parceiro",
              ].map((i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-health" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup", role: "profissional" }}>
                <Button size="lg" className="rounded-xl bg-health text-white hover:bg-health/90">
                  Criar conta de profissional
                </Button>
              </Link>
              <Link to="/auth" search={{ mode: "login", role: "profissional" }}>
                <Button size="lg" variant="outline" className="rounded-xl">Entrar como parceiro</Button>
              </Link>
              <Link to="/planos-e-precos">
                <Button size="lg" variant="ghost" className="rounded-xl gap-1">
                  Ver planos <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
