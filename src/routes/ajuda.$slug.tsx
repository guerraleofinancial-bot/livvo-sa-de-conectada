import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Mail, CheckCircle2, Lightbulb, Info } from "lucide-react";
import { getArticle, helpArticles, type HelpArticle } from "@/lib/livvo/help-content";

export const Route = createFileRoute("/ajuda/$slug")({
  loader: ({ params }) => {
    const article = getArticle(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.article.title ?? "Ajuda"} | Central de Ajuda Livvo` },
      { name: "description", content: loaderData?.article.description ?? "Central de Ajuda Livvo" },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl p-10 text-center">
      <p className="text-sm text-muted-foreground">Artigo não encontrado.</p>
      <Link to="/ajuda" className="mt-3 inline-block text-sm font-semibold text-primary">Voltar à Central de Ajuda</Link>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-2xl p-10 text-center">
      <p className="text-sm text-muted-foreground">Erro ao carregar artigo.</p>
      <Link to="/ajuda" className="mt-3 inline-block text-sm font-semibold text-primary">Voltar</Link>
    </div>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData() as { article: HelpArticle };
  const related = (article.related ?? [])
    .map((s: string) => helpArticles.find((a) => a.slug === s))
    .filter((a): a is HelpArticle => Boolean(a));

  return (
    <div className="min-h-screen bg-surface">
      <main className="mx-auto max-w-2xl px-5 py-8">
        <Link to="/ajuda" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Central de Ajuda
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{article.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{article.description}</p>

        {article.steps && article.steps.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Passo a passo</h2>
            <ol className="space-y-3">
              {article.steps.map((s: string, i: number) => (
                <li key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                  <span className="text-sm">{s}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {article.tips && article.tips.length > 0 && (
          <section className="mt-6 rounded-2xl border border-primary/20 bg-primary-soft/40 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Lightbulb className="size-4" /> Dicas
            </p>
            <ul className="mt-2 space-y-1.5">
              {article.tips.map((t: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </section>
        )}

        {article.notes && article.notes.length > 0 && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Info className="size-4" /> Observações
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {article.notes.map((n: string, i: number) => <li key={i}>• {n}</li>)}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Artigos relacionados</h2>
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link to="/ajuda/$slug" params={{ slug: r.slug }} className="block p-4 hover:bg-muted/40">
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-sm font-bold">Ainda precisa de ajuda?</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <a href="https://wa.me/5511000000000" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:border-primary/40">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <a href="mailto:suporte@livvo.app" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:border-primary/40">
              <Mail className="size-4" /> E-mail
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
