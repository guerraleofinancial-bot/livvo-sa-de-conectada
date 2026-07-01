import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, HelpCircle, MessageCircle, Mail, ArrowRight, ChevronDown } from "lucide-react";
import * as Icons from "lucide-react";
import { helpCategories, helpArticles, faqItems, searchHelp, type HelpCategoryId } from "@/lib/livvo/help-content";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Central de Ajuda — Livvo" },
      { name: "description", content: "Aprenda a usar a Livvo: guias, tutoriais e respostas rápidas para pacientes, profissionais e empresas." },
      { property: "og:title", content: "Central de Ajuda — Livvo" },
      { property: "og:description", content: "Guias, tutoriais e FAQ da Livvo." },
    ],
  }),
  component: HelpCenter,
});

function HelpCenter() {
  const [q, setQ] = useState("");
  const results = useMemo(() => (q.trim() ? searchHelp(q) : []), [q]);
  const [openCat, setOpenCat] = useState<HelpCategoryId | null>(null);

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto max-w-4xl px-5 py-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Início</Link>
            <span>/</span>
            <span className="text-foreground">Central de Ajuda</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Como podemos ajudar?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Guias e respostas rápidas para tirar o máximo da Livvo.</p>
          <div className="relative mt-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar: cadastrar paciente, reagendar, cobrar, comissão…"
              className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm shadow-sm outline-none focus:border-primary/40"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8 space-y-10">
        {q.trim() && (
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Resultados ({results.length})
            </h2>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nada encontrado para "{q}". Tente outras palavras ou fale com o suporte abaixo.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
                {results.map((a) => (
                  <li key={a.slug}>
                    <Link
                      to="/ajuda/$slug"
                      params={{ slug: a.slug }}
                      className="flex items-start gap-3 p-4 hover:bg-muted/40"
                    >
                      <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.description}</p>
                      </div>
                      <ArrowRight className="mt-1 ml-auto size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Categorias</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {helpCategories.map((c) => {
              const Icon = ((Icons as unknown) as Record<string, typeof HelpCircle>)[c.icon] ?? HelpCircle;
              const count = helpArticles.filter((a) => a.category === c.id).length + (c.id === "faq" ? faqItems.length : 0);
              return (
                <button
                  key={c.id}
                  onClick={() => setOpenCat(openCat === c.id ? null : c.id)}
                  className={`livvo-card livvo-card-hover p-4 text-left ${openCat === c.id ? "border-primary/40" : ""}`}
                >
                  <div className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-4" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{c.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                  <p className="mt-2 text-[11px] font-bold text-muted-foreground">{count} artigos</p>
                </button>
              );
            })}
          </div>
        </section>

        {openCat && openCat !== "faq" && (
          <section>
            <h2 className="mb-3 text-sm font-bold">
              {helpCategories.find((c) => c.id === openCat)?.title}
            </h2>
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {helpArticles.filter((a) => a.category === openCat).map((a) => (
                <li key={a.slug}>
                  <Link to="/ajuda/$slug" params={{ slug: a.slug }} className="flex items-center gap-3 p-4 hover:bg-muted/40">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(openCat === "faq" || !openCat) && (
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Perguntas frequentes
            </h2>
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {faqItems.slice(0, openCat === "faq" ? faqItems.length : 12).map((f, i) => (
                <FaqRow key={i} q={f.q} a={f.a} />
              ))}
            </ul>
            {openCat !== "faq" && (
              <button
                onClick={() => setOpenCat("faq")}
                className="mt-3 text-xs font-semibold text-primary"
              >
                Ver todas as {faqItems.length} perguntas →
              </button>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm font-bold">Ainda precisa de ajuda?</p>
          <p className="mt-1 text-xs text-muted-foreground">Fale com nosso time. Respondemos rapidinho.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a href="https://wa.me/5511000000000" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:border-primary/40">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <a href="mailto:suporte@livvo.app" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:border-primary/40">
              <Mail className="size-4" /> E-mail
            </a>
            <a href="mailto:suporte@livvo.app" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Abrir chamado
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/40">
        <span className="flex-1 text-sm font-medium">{q}</span>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-4 pb-4 text-sm text-muted-foreground">{a}</p>}
    </li>
  );
}
