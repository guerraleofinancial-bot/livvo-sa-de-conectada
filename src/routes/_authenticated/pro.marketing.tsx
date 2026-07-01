import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ShareMenu } from "@/components/livvo/share-menu";
import { Skeleton, EmptyState } from "@/components/livvo/empty-state";
import { KitGalleryLoader, type KitVars } from "@/components/livvo/kit-canvas";
import { toast } from "sonner";
import {
  Megaphone, Link as LinkIcon, Package, CheckCircle2, TrendingUp, BarChart3,
  Gift, FileBarChart, Copy, ExternalLink, ArrowRight, Sparkles, Trophy,
  QrCode as QrIcon, Circle, ChevronRight, Info,
} from "lucide-react";
import { computeProfessionalCompleteness } from "@/lib/livvo/profile-completeness";
import { computeMilestones, computeRecommendations } from "@/lib/livvo/growth-recommendations";

const SITE = "https://livvo-conecta-saude.lovable.app";

export const Route = createFileRoute("/_authenticated/pro/marketing")({
  component: MarketingHub,
});

function MarketingHub() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: pro, isLoading: loadingPro } = useQuery({
    queryKey: ["me-pro-marketing", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase
        .from("professionals")
        .select("*, profiles:profiles!professionals_profile_fkey(full_name, avatar_url), specialties(name), companies(trade_name, legal_name, logo_url)")
        .eq("id", user!.id)
        .maybeSingle()).data,
  });

  const { data: agg } = useQuery({
    queryKey: ["me-pro-agg", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [services, hours, reviews, appts, charges, wallet, sharedLogs] = await Promise.all([
        supabase.from("services").select("id", { count: "exact", head: true }).eq("professional_id", user!.id).eq("active", true),
        supabase.from("professional_business_hours").select("weekday", { count: "exact", head: true }).eq("professional_id", user!.id).eq("closed", false),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("professional_id", user!.id).eq("status", "publicada"),
        supabase.from("appointments").select("id, scheduled_at, status", { count: "exact" }).eq("professional_id", user!.id),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("professional_id", user!.id),
        supabase.from("wallet_transactions").select("id", { count: "exact", head: true }).eq("provider_id", user!.id),
        supabase.from("audit_logs").select("id", { count: "exact", head: true }).eq("actor_id", user!.id).eq("action", "profile_shared"),
      ]);
      const now = new Date();
      const emptySlotsToday = 0; // placeholder — cálculo real seria por availability minus appts
      const pendingReturns = (appts.data ?? []).filter(
        (a) => a.status === "realizada" && new Date(a.scheduled_at).getTime() < now.getTime() - 30 * 86400_000,
      ).length;
      return {
        servicesCount: services.count ?? 0,
        businessHoursCount: hours.count ?? 0,
        galleryCount: 0,
        hasReview: (reviews.count ?? 0) > 0,
        totalAppointments: appts.count ?? 0,
        hasFirstPatient: (appts.count ?? 0) > 0,
        hasFirstCharge: (charges.count ?? 0) > 0,
        hasFirstPayout: (wallet.count ?? 0) > 0,
        hasSharedProfile: (sharedLogs.count ?? 0) > 0,
        emptySlotsToday,
        pendingReturns,
        pendingCharges: 0,
      };
    },
  });

  const completeness = useMemo(
    () => computeProfessionalCompleteness(pro ?? null, {
      servicesCount: agg?.servicesCount ?? 0,
      businessHoursCount: agg?.businessHoursCount ?? 0,
      galleryCount: agg?.galleryCount ?? 0,
      hasReview: agg?.hasReview ?? false,
    }),
    [pro, agg],
  );

  const milestones = useMemo(
    () => computeMilestones({
      completeness,
      hasBusinessHours: (agg?.businessHoursCount ?? 0) > 0,
      hasServices: (agg?.servicesCount ?? 0) > 0,
      hasFirstPatient: agg?.hasFirstPatient ?? false,
      hasFirstReview: agg?.hasReview ?? false,
      hasFirstCharge: agg?.hasFirstCharge ?? false,
      hasFirstPayout: agg?.hasFirstPayout ?? false,
      hasSharedProfile: agg?.hasSharedProfile ?? false,
      isVerified: !!pro?.council_verified_at,
      emptySlotsToday: agg?.emptySlotsToday ?? 0,
      pendingReturns: agg?.pendingReturns ?? 0,
      pendingCharges: 0,
      totalAppointments: agg?.totalAppointments ?? 0,
    }),
    [completeness, agg, pro],
  );

  const recommendations = useMemo(
    () => computeRecommendations({
      completeness,
      hasBusinessHours: (agg?.businessHoursCount ?? 0) > 0,
      hasServices: (agg?.servicesCount ?? 0) > 0,
      hasFirstPatient: agg?.hasFirstPatient ?? false,
      hasFirstReview: agg?.hasReview ?? false,
      hasFirstCharge: agg?.hasFirstCharge ?? false,
      hasFirstPayout: agg?.hasFirstPayout ?? false,
      hasSharedProfile: agg?.hasSharedProfile ?? false,
      isVerified: !!pro?.council_verified_at,
      emptySlotsToday: agg?.emptySlotsToday ?? 0,
      pendingReturns: agg?.pendingReturns ?? 0,
      pendingCharges: 0,
      totalAppointments: agg?.totalAppointments ?? 0,
    }),
    [completeness, agg, pro],
  );

  const kitVars: KitVars | null = useMemo(() => {
    if (!pro) return null;
    const companyLogo = (pro as { companies?: { logo_url?: string } | null }).companies?.logo_url ?? null;
    const specialty = (pro as { specialties?: { name?: string } | null }).specialties?.name ?? undefined;
    const fullName = (pro as { profiles?: { full_name?: string } | null }).profiles?.full_name
      ?? pro.display_name
      ?? "Profissional Livvo";
    const avatar = pro.avatar_url ?? (pro as { profiles?: { avatar_url?: string } | null }).profiles?.avatar_url ?? null;
    return {
      fullName,
      specialty,
      city: pro.address_city ?? undefined,
      state: pro.address_state ?? undefined,
      avatarUrl: avatar,
      logoUrl: companyLogo,
      url: `${SITE}/p/${pro.slug ?? pro.id}`,
      handle: pro.instagram ?? undefined,
    };
  }, [pro]);

  const publicUrl = pro?.slug ? `${SITE}/p/${pro.slug}` : null;

  // ---- slug editor ----
  const [slugDraft, setSlugDraft] = useState<string>("");
  useEffect(() => { if (pro?.slug) setSlugDraft(pro.slug); }, [pro?.slug]);
  const [savingSlug, setSavingSlug] = useState(false);
  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugDraft) && slugDraft.length >= 3 && slugDraft.length <= 60;
  const previewUrl = slugValid ? `${SITE}/p/${slugDraft}` : publicUrl;

  const saveSlug = async () => {
    if (!user || !slugValid || slugDraft === pro?.slug) return;
    setSavingSlug(true);
    // check uniqueness
    const { data: taken } = await supabase.from("professionals").select("id").eq("slug", slugDraft).neq("id", user.id).maybeSingle();
    if (taken) {
      toast.error("Este link já está em uso — escolha outro.");
      setSavingSlug(false);
      return;
    }
    const { error } = await supabase.from("professionals").update({ slug: slugDraft }).eq("id", user.id);
    if (error) toast.error("Não foi possível atualizar o link.");
    else {
      toast.success("Link personalizado atualizado.");
      qc.invalidateQueries({ queryKey: ["me-pro-marketing"] });
    }
    setSavingSlug(false);
  };

  return (
    <div className="px-5 pt-4 pb-4 space-y-4">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Megaphone className="size-3.5" /> Marketing
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Centro de Crescimento</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Divulgue seu perfil, atraia mais pacientes e acompanhe sua evolução.</p>
      </div>

      {loadingPro ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : (
        <ProgressBanner score={completeness.score} />
      )}

      <Tabs defaultValue="pagina" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto p-1">
          <TabsTrigger value="pagina" className="text-[11px] py-2"><LinkIcon className="size-3.5 mr-1" /> Página</TabsTrigger>
          <TabsTrigger value="kit" className="text-[11px] py-2"><Package className="size-3.5 mr-1" /> Kit</TabsTrigger>
          <TabsTrigger value="perfil" className="text-[11px] py-2"><CheckCircle2 className="size-3.5 mr-1" /> Perfil 100%</TabsTrigger>
          <TabsTrigger value="crescimento" className="text-[11px] py-2"><TrendingUp className="size-3.5 mr-1" /> Crescimento</TabsTrigger>
        </TabsList>

        {/* ============ PÁGINA PÚBLICA ============ */}
        <TabsContent value="pagina" className="space-y-4 mt-4">
          <MyPublicPageCard
            publicUrl={publicUrl}
            previewUrl={previewUrl}
            slugDraft={slugDraft}
            setSlugDraft={setSlugDraft}
            slugValid={slugValid}
            savingSlug={savingSlug}
            saveSlug={saveSlug}
            currentSlug={pro?.slug}
            proName={kitVars?.fullName}
          />
          <ComingSoonCard
            icon={BarChart3}
            title="Analytics de Marketing"
            description="Visualizações, cliques, favoritos e conversão da sua página em breve neste painel."
          />
          <ComingSoonCard
            icon={Gift}
            title="Programa de Indicação"
            description="Convide profissionais e empresas para a Livvo — futuros benefícios exclusivos."
          />
          <ComingSoonCard
            icon={FileBarChart}
            title="Relatório mensal"
            description="Novos pacientes, retornos, receita, conversão e sugestões — enviado todo mês."
          />
        </TabsContent>

        {/* ============ KIT ============ */}
        <TabsContent value="kit" className="space-y-3 mt-4">
          <div className="livvo-card p-4 bg-gradient-to-br from-primary-soft/40 to-transparent border-primary/20">
            <p className="text-sm font-bold flex items-center gap-1.5"><Sparkles className="size-4 text-primary" /> Kit de Divulgação</p>
            <p className="text-xs text-muted-foreground mt-1">
              Materiais gerados automaticamente com sua foto, nome, especialidade e QR Code. Baixe e compartilhe onde quiser.
            </p>
          </div>
          <KitGalleryLoader vars={kitVars} />
        </TabsContent>

        {/* ============ PERFIL 100% ============ */}
        <TabsContent value="perfil" className="space-y-3 mt-4">
          <div className="livvo-card p-5 text-center bg-gradient-to-br from-primary-soft/50 to-transparent">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Perfil 100%</p>
            <div className="mt-2 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold font-mono">{completeness.score}</span>
              <span className="text-lg font-semibold text-muted-foreground">%</span>
            </div>
            <Progress value={completeness.score} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completeness.missing.length === 0
                ? "Seu perfil está completo. Excelente!"
                : `${completeness.missing.length} melhoria(s) sugeridas para atrair mais pacientes.`}
            </p>
          </div>

          {completeness.missing.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">O que falta</p>
              {completeness.missing.sort((a, b) => b.weight - a.weight).map((item) => (
                <div key={item.key} className="livvo-card p-3 flex items-start gap-3">
                  <Circle className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <Badge variant="secondary" className="text-[10px] h-4 font-mono">+{item.weight}%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.hint}</p>
                    {item.action && (
                      <Link to={item.action.to} className="text-xs text-primary font-semibold inline-flex items-center gap-1 mt-1.5 hover:underline">
                        {item.action.label} <ArrowRight className="size-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {completeness.done.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 pt-2">Concluído</p>
              {completeness.done.map((item) => (
                <div key={item.key} className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 rounded-lg bg-muted/30">
                  <CheckCircle2 className="size-3.5 text-health shrink-0" />
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto font-mono text-[10px]">+{item.weight}%</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============ CENTRO DE CRESCIMENTO ============ */}
        <TabsContent value="crescimento" className="space-y-4 mt-4">
          <MilestonesCard milestones={milestones} />

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">Recomendações para hoje</p>
            {recommendations.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="Você está indo muito bem!"
                description="Sem recomendações urgentes agora. Continue divulgando sua página e acompanhando pacientes."
                tone="primary"
              />
            ) : (
              <div className="space-y-2">
                {recommendations.map((r) => (
                  <div key={r.id} className="livvo-card livvo-card-hover p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-semibold">{r.title}</p>
                          <PriorityBadge priority={r.priority} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{r.description}</p>
                      </div>
                    </div>
                    {r.action && (
                      <Link to={r.action.to} className="text-xs text-primary font-semibold inline-flex items-center gap-1 mt-2 hover:underline">
                        {r.action.label} <ArrowRight className="size-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------- sub-components ----------------

function ProgressBanner({ score }: { score: number }) {
  return (
    <div className="livvo-card p-4 bg-gradient-to-br from-primary-soft/40 to-transparent border-primary/20">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-xs font-semibold text-primary">Seu perfil está {score}% completo</p>
          <p className="text-[11px] text-muted-foreground">Quanto mais completo, mais aparece nas buscas.</p>
        </div>
        <span className="text-3xl font-bold font-mono text-primary">{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}

function MyPublicPageCard({
  publicUrl, previewUrl, slugDraft, setSlugDraft, slugValid, savingSlug, saveSlug, currentSlug, proName,
}: {
  publicUrl: string | null;
  previewUrl: string | null;
  slugDraft: string;
  setSlugDraft: (v: string) => void;
  slugValid: boolean;
  savingSlug: boolean;
  saveSlug: () => void | Promise<void>;
  currentSlug?: string | null;
  proName?: string;
}) {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    if (!previewUrl) return;
    QRCode.toDataURL(previewUrl, { width: 320, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setQr).catch(() => setQr(null));
  }, [previewUrl]);

  if (!publicUrl) {
    return (
      <EmptyState
        icon={LinkIcon}
        title="Seu link ainda não foi gerado"
        description="Complete o onboarding para receber sua página pública."
        action={<Button asChild size="sm"><Link to="/onboarding-pro">Continuar cadastro</Link></Button>}
      />
    );
  }

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };

  return (
    <div className="livvo-card p-4 space-y-4">
      <div>
        <p className="text-sm font-bold flex items-center gap-1.5"><LinkIcon className="size-4 text-primary" /> Minha Página Pública</p>
        <p className="text-xs text-muted-foreground mt-0.5">Sua landing page com SEO otimizado no marketplace.</p>
      </div>

      {/* URL preview */}
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">URL final</p>
        <p className="text-sm font-mono break-all mt-1">{previewUrl}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={() => copy(previewUrl!)}>
            <Copy className="size-3.5 mr-1.5" /> Copiar
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5 mr-1.5" /> Visualizar
            </a>
          </Button>
          <ShareMenu url={publicUrl} title={proName ?? "Meu perfil Livvo"} text="Agende sua consulta pela Livvo" size="sm" />
        </div>
      </div>

      {/* Slug editor */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Personalizar link</Label>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card flex-1 min-w-0">
            <span className="text-xs text-muted-foreground px-2.5 py-2 bg-muted/40 border-r border-border">livvo/p/</span>
            <Input
              value={slugDraft}
              onChange={(e) => setSlugDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="dr-joao-silva"
              className="border-0 focus-visible:ring-0 h-9 text-sm font-mono"
              maxLength={60}
            />
          </div>
          <Button size="sm" onClick={saveSlug} disabled={!slugValid || savingSlug || slugDraft === currentSlug}>
            {savingSlug ? "Salvando…" : "Salvar"}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Info className="size-3" /> Somente letras minúsculas, números e hífens. Ex.: <span className="font-mono">dra-ana-silva</span>
        </p>
      </div>

      {/* QR */}
      {qr && (
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <img src={qr} alt="QR Code do seu perfil" className="size-24 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold flex items-center gap-1"><QrIcon className="size-3.5" /> QR Code do seu perfil</p>
            <p className="text-[11px] text-muted-foreground mt-1">Escaneie com a câmera do celular para abrir sua página.</p>
            <Button size="sm" variant="outline" className="mt-2 h-7 text-[11px]" onClick={() => {
              const a = document.createElement("a"); a.href = qr; a.download = "livvo-qr.png"; a.click();
            }}>
              <QrIcon className="size-3 mr-1" /> Baixar QR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MilestonesCard({ milestones }: { milestones: ReturnType<typeof computeMilestones> }) {
  const done = milestones.filter((m) => m.done).length;
  const pct = Math.round((done / milestones.length) * 100);
  return (
    <div className="livvo-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold flex items-center gap-1.5"><Trophy className="size-4 text-amber-500" /> Sua jornada Livvo</p>
          <p className="text-[11px] text-muted-foreground">{done} de {milestones.length} conquistas</p>
        </div>
        <span className="text-2xl font-bold font-mono">{pct}%</span>
      </div>
      <Progress value={pct} className="h-2 mb-3" />
      <div className="grid grid-cols-1 gap-1.5">
        {milestones.map((m) => (
          <div key={m.id} className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg ${m.done ? "bg-health-soft/50" : "bg-muted/30"}`}>
            {m.done ? <CheckCircle2 className="size-4 text-health shrink-0" /> : <Circle className="size-4 text-muted-foreground shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className={`font-semibold ${m.done ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{m.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: "alta" | "media" | "baixa" }) {
  const map = {
    alta: { label: "Alta", cls: "bg-destructive/10 text-destructive border-destructive/30" },
    media: { label: "Média", cls: "bg-warning-soft text-warning border-warning/30" },
    baixa: { label: "Baixa", cls: "bg-muted text-muted-foreground border-border" },
  } as const;
  const m = map[priority];
  return <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${m.cls}`}>{m.label}</span>;
}

function ComingSoonCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="livvo-card p-4 border-dashed opacity-90">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-lg bg-muted grid place-items-center text-muted-foreground shrink-0">
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{title}</p>
            <Badge variant="secondary" className="text-[9px] h-4 uppercase">Em breve</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{description}</p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground/50 shrink-0" />
      </div>
    </div>
  );
}
