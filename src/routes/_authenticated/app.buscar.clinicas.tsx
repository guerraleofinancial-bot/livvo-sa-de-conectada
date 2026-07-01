import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";
import { SectionHeader } from "@/components/livvo/ui";
import { CompanyResultCard, CompanyResultCardSkeleton, type CompanyRow } from "@/components/livvo/CompanyResultCard";

export const Route = createFileRoute("/_authenticated/app/buscar/clinicas")({
  component: BuscarClinicas,
});

const parent = getRouteApi("/_authenticated/app/buscar");

function BuscarClinicas() {
  const s = parent.useSearch();
  const q = s.q ?? "";
  const city = s.city ?? "";
  const uf = s.uf ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["search-clinicas", q, city, uf],
    queryFn: async () => {
      let query = supabase
        .from("companies")
        .select("id, legal_name, trade_name, type, address_city, address_state, logo_url, slug, description, rating_average, rating_count")
        .eq("status", "aprovado")
        .eq("type", "clinica");
      if (uf.trim()) query = query.eq("address_state", uf.trim().toUpperCase());
      if (city.trim()) query = query.ilike("address_city", `%${city}%`);
      if (q.trim()) query = query.or(`legal_name.ilike.%${q}%,trade_name.ilike.%${q}%,description.ilike.%${q}%`);
      return ((await query.order("rating_average", { ascending: false }).limit(60)).data ?? []) as CompanyRow[];
    },
  });

  return (
    <>
      <SectionHeader
        eyebrow="Estabelecimentos"
        title="Clínicas"
        trailing={
          !isLoading && data ? (
            <span className="livvo-subtle">
              {data.length} resultado{data.length !== 1 ? "s" : ""}
            </span>
          ) : undefined
        }
      />
      {isLoading && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <CompanyResultCardSkeleton key={i} />
          ))}
        </div>
      )}
      {!isLoading && (data ?? []).length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(data ?? []).map((row) => (
            <CompanyResultCard key={row.id} row={row} />
          ))}
        </div>
      )}
      {!isLoading && (data ?? []).length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-border bg-card p-10 md:p-14 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-health-soft text-health">
            <Building2 className="size-6" />
          </div>
          <p className="mt-4 text-base font-semibold text-foreground">Nenhuma clínica encontrada</p>
          <p className="livvo-subtle mt-1 max-w-sm mx-auto">
            Ajuste a cidade ou o termo de busca. Novas clínicas parceiras entram toda semana.
          </p>
        </div>
      )}
    </>
  );
}
