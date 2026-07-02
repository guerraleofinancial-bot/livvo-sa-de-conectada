import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/livvo/marketing-shell";
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, FileText, Building2, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/verificacao")({
  head: () => ({
    meta: [
      { title: "Verificação de parceiros | Livvo" },
      {
        name: "description",
        content:
          "Entenda como a equipe Livvo valida a documentação e o registro profissional de cada parceiro antes de exibir o selo Parceiro Verificado.",
      },
      { property: "og:title", content: "Verificação de parceiros — Livvo" },
      {
        property: "og:description",
        content:
          "A Livvo analisa documento, conselho e situação ativa de cada profissional antes de aprovar. Saiba o que verificamos e o que não garantimos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerificacaoPage,
});

function VerificacaoPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-4xl px-5 py-14 md:py-20">
        <div className="flex items-center gap-3 text-health">
          <div className="size-11 rounded-2xl bg-health-soft grid place-items-center">
            <ShieldCheck className="size-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wide">Selo Parceiro Verificado Livvo</span>
        </div>

        <h1 className="mt-5 text-3xl md:text-4xl font-bold tracking-tight">
          Cada parceiro é analisado{" "}
          <span className="text-primary">antes de aparecer para o paciente.</span>
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          O selo <strong>Parceiro Verificado Livvo</strong> indica que a equipe da Livvo revisou manualmente a
          documentação do profissional ou empresa e confirmou que o registro está ativo e compatível com os serviços
          oferecidos na plataforma.
        </p>

        {/* Como funciona */}
        <div className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-bold tracking-tight">Como funciona nossa verificação</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">1</span>
              O profissional envia seus documentos durante o cadastro (identidade, registro do conselho e, quando aplicável, documentação da empresa).
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">2</span>
              A equipe da Livvo revisa cada peça enviada e confere o registro diretamente com o conselho responsável.
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">3</span>
              Os dados cadastrais, especialidade e serviços são comparados com a habilitação profissional apresentada.
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">4</span>
              Somente após a aprovação manual o perfil recebe o selo e passa a ser exibido nas buscas.
            </li>
          </ol>
        </div>

        {/* O que verificamos */}
        <div className="mt-6 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-[var(--shadow-card)]">
          <h2 className="text-xl font-bold tracking-tight">O que verificamos</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { Icon: FileText, label: "Documento de identidade" },
              { Icon: Stethoscope, label: "Registro profissional (CRM, CRO, CRP, CREFITO, CRN, CRBM, COREN e outros)" },
              { Icon: CheckCircle2, label: "Situação ativa no respectivo conselho" },
              { Icon: FileText, label: "Dados cadastrais informados" },
              { Icon: Stethoscope, label: "Especialidade declarada" },
              { Icon: Building2, label: "Empresa legalmente constituída (quando aplicável)" },
              { Icon: CheckCircle2, label: "Consistência entre todas as informações enviadas" },
            ].map(({ Icon, label }) => (
              <li key={label} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3">
                <div className="size-8 shrink-0 grid place-items-center rounded-lg bg-health-soft text-health">
                  <Icon className="size-4" />
                </div>
                <span className="text-sm">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* O que NÃO garantimos */}
        <div className="mt-6 rounded-3xl border border-warning/40 bg-warning/5 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-warning/15 text-warning grid place-items-center">
              <AlertTriangle className="size-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">O que a Livvo não garante</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            A verificação Livvo comprova <strong>identidade e habilitação profissional</strong>. Ela não substitui
            avaliação clínica nem garante resultados de tratamentos, diagnósticos ou procedimentos, que dependem de
            cada caso e da conduta profissional.
          </p>
        </div>

        {/* Atualização */}
        <div className="mt-6 rounded-3xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <RefreshCw className="size-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Revisão periódica</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            A documentação dos parceiros pode ser revisada periodicamente. Caso um registro deixe de estar ativo ou
            surja alguma inconsistência, o selo é removido até nova regularização.
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-primary text-primary-foreground p-6 md:p-8">
          <div>
            <p className="text-sm font-bold">É profissional ou empresa da saúde?</p>
            <p className="text-xs opacity-90 mt-1">Cadastre-se e envie sua documentação para receber o selo verificado.</p>
          </div>
          <Link
            to="/auth"
            search={{ mode: "signup", role: "profissional" }}
            className="inline-flex items-center rounded-full bg-primary-foreground text-primary px-5 py-2.5 text-sm font-bold hover:opacity-90"
          >
            Quero ser parceiro Livvo
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
