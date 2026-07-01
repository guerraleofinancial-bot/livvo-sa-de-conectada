import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, FlaskConical, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/livvo/ui";

export const Route = createFileRoute("/_authenticated/app/buscar/exames")({
  component: BuscarExames,
});

// Catálogo inicial estático de categorias de exames. Servirá para
// pesquisa direta assim que a base de exames for populada.
const EXAM_CATEGORIES = [
  { label: "Hemograma completo", desc: "Análise de células sanguíneas." },
  { label: "Glicemia de jejum", desc: "Diagnóstico e controle de diabetes." },
  { label: "Colesterol total e frações", desc: "Perfil lipídico completo." },
  { label: "TSH e T4 livre", desc: "Função da tireoide." },
  { label: "Urina tipo 1 (EAS)", desc: "Rastreio de infecções e rins." },
  { label: "Beta HCG", desc: "Confirmação de gravidez." },
  { label: "Vitamina D (25-OH)", desc: "Dosagem sérica." },
  { label: "PCR ultrassensível", desc: "Marcador inflamatório." },
  { label: "Ultrassom abdominal", desc: "Imagem dos órgãos abdominais." },
  { label: "Raio-X de tórax", desc: "Avaliação pulmonar e cardíaca." },
];

function BuscarExames() {
  return (
    <>
      <SectionHeader
        eyebrow="Em breve"
        title="Busca por exames"
        trailing={
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
            <Sparkles className="size-3" /> Novidade
          </span>
        }
      />

      <div className="mt-4 rounded-3xl border border-primary/20 bg-primary-soft/40 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-card text-primary shadow-sm">
            <ClipboardList className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm md:text-base font-semibold text-foreground">
              Estamos preparando a busca direta por exames
            </p>
            <p className="livvo-subtle mt-1">
              Enquanto isso, encontre laboratórios verificados prontos para atender você.
            </p>
            <Link
              to="/app/buscar/laboratorios"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90 transition"
            >
              <FlaskConical className="size-3.5" /> Ver laboratórios
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <SectionHeader eyebrow="Catálogo" title="Exames mais procurados" />
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {EXAM_CATEGORIES.map((e) => (
            <div
              key={e.label}
              className="rounded-2xl border border-border/70 bg-card p-4 hover:border-primary/40 hover:shadow-[var(--shadow-soft)] transition-all"
            >
              <p className="text-sm font-semibold text-foreground">{e.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{e.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
