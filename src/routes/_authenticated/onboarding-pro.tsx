import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2, Building2, Stethoscope, MapPin, Phone, Calendar, Briefcase, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/livvo/onboarding/ImageUpload";
import { BusinessHoursGrid, defaultHours, type DayHours } from "@/components/livvo/onboarding/BusinessHoursGrid";
import { ChipsInput } from "@/components/livvo/onboarding/ChipsInput";
import { ServiceFormDialog } from "@/components/livvo/onboarding/ServiceFormDialog";
import { DocumentUploadRow } from "@/components/livvo/onboarding/DocumentUploadRow";
import { saveOnboardingStep, setBusinessHours, submitOnboarding, lookupCep, deleteProviderService } from "@/lib/livvo/onboarding-pro.functions";

export const Route = createFileRoute("/_authenticated/onboarding-pro")({ component: Onboarding });

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const STEPS = [
  { icon: Sparkles, title: "Identidade visual" },
  { icon: Stethoscope, title: "Identificação" },
  { icon: Briefcase, title: "Experiência" },
  { icon: Phone, title: "Contato" },
  { icon: MapPin, title: "Endereço" },
  { icon: Calendar, title: "Horários" },
  { icon: ShieldCheck, title: "Serviços & Docs" },
];

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);

  const { data: pro, refetch: refetchPro } = useQuery({
    queryKey: ["pro-self", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("professionals").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: specs } = useQuery({
    queryKey: ["specs"],
    queryFn: async () => (await supabase.from("specialties").select("*").order("name")).data ?? [],
  });

  const { data: services, refetch: refetchServices } = useQuery({
    queryKey: ["pro-services", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("services").select("*").eq("professional_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: docs, refetch: refetchDocs } = useQuery({
    queryKey: ["pro-docs", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("professional_documents").select("*").eq("professional_id", user!.id)).data ?? [],
  });

  // Form state
  const [avatar, setAvatar] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [registry, setRegistry] = useState("");
  const [specId, setSpecId] = useState("");
  const [secondarySpecs, setSecondarySpecs] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [years, setYears] = useState("");
  const [formation, setFormation] = useState("");
  const [postgrad, setPostgrad] = useState("");
  const [certs, setCerts] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["Português"]);
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [zip, setZip] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [hours, setHours] = useState<DayHours[]>(defaultHours());
  const hydrated = useRef(false);

  useEffect(() => {
    if (!pro || hydrated.current) return;
    hydrated.current = true;
    setAvatar(pro.avatar_url ?? null);
    setLogo(pro.logo_url ?? null);
    setCover(pro.cover_url ?? null);
    setDisplayName(pro.display_name ?? "");
    setCpfCnpj(pro.cpf_cnpj ?? "");
    setRegistry(pro.professional_registry ?? "");
    setSpecId(pro.specialty_id ?? "");
    setSecondarySpecs(pro.secondary_specialties ?? []);
    setBio(pro.bio ?? "");
    setYears(pro.years_experience ? String(pro.years_experience) : "");
    setFormation(pro.academic_formation ?? "");
    setPostgrad(pro.postgrad ?? "");
    setCerts(pro.certifications ?? []);
    setLanguages(pro.languages?.length ? pro.languages : ["Português"]);
    setWhatsapp(pro.whatsapp ?? "");
    setPhone(pro.phone ?? "");
    setEmail(pro.professional_email ?? "");
    setInstagram(pro.instagram ?? "");
    setWebsite(pro.website ?? "");
    setZip(pro.address_zip ?? "");
    setStreet(pro.address_street ?? "");
    setNumber(pro.address_number ?? "");
    setComplement(pro.address_complement ?? "");
    setDistrict(pro.address_district ?? "");
    setCity(pro.address_city ?? "");
    setStateUf(pro.address_state ?? "");
    if (typeof pro.onboarding_step === "number") setStep(Math.min(6, pro.onboarding_step) as Step);
  }, [pro]);

  const save = useServerFn(saveOnboardingStep);
  const saveHours = useServerFn(setBusinessHours);
  const submit = useServerFn(submitOnboarding);
  const lookup = useServerFn(lookupCep);
  const delService = useServerFn(deleteProviderService);

  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const clean = zip.replace(/\D/g, "");
    if (clean.length !== 8) return;
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(async () => {
      try {
        const r = await lookup({ data: { cep: clean } });
        if (r.street) setStreet(r.street);
        if (r.district) setDistrict(r.district);
        if (r.city) setCity(r.city);
        if (r.state) setStateUf(r.state);
      } catch { /* silencioso */ }
    }, 600);
  }, [zip, lookup]);

  function buildPatch(forStep: Step) {
    const base: Record<string, unknown> = {};
    if (forStep >= 0) Object.assign(base, { avatar_url: avatar, logo_url: logo, cover_url: cover });
    if (forStep >= 1) Object.assign(base, { display_name: displayName, cpf_cnpj: cpfCnpj, professional_registry: registry, specialty_id: specId || null, secondary_specialties: secondarySpecs });
    if (forStep >= 2) Object.assign(base, { bio, years_experience: years ? Number(years) : null, academic_formation: formation, postgrad, certifications: certs, languages });
    if (forStep >= 3) Object.assign(base, { whatsapp, phone, professional_email: email || null, instagram, website });
    if (forStep >= 4) Object.assign(base, { address_zip: zip, address_street: street, address_number: number, address_complement: complement, address_district: district, address_city: city, address_state: stateUf });
    return base;
  }

  async function next() {
    try {
      // step-specific minimal validation
      if (step === 1 && (!registry || !specId)) { toast.error("Informe especialidade e registro"); return; }
      await save({ data: { step: Math.min(6, step + 1), patch: buildPatch(step) } });
      if (step === 5) await saveHours({ data: { hours } });
      setStep((s) => Math.min(6, s + 1) as Step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { toast.error("Erro ao salvar", { description: (e as Error).message }); }
  }

  async function finish() {
    if (!(services?.length)) { toast.error("Cadastre ao menos 1 serviço"); return; }
    try {
      await save({ data: { step: 6, patch: buildPatch(6) } });
      await saveHours({ data: { hours } });
      await submit({});
      toast.success("Cadastro enviado para análise!");
      navigate({ to: "/pro" });
    } catch (e) { toast.error("Erro", { description: (e as Error).message }); }
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const StepIcon = STEPS[step].icon;

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-5 py-6 pb-32">
        <Link to="/app/perfil" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4"><ArrowLeft className="size-4" /> Voltar</Link>

        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-11 rounded-2xl bg-white/15 grid place-items-center"><StepIcon className="size-6" /></div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Etapa {step + 1} de {STEPS.length}</p>
              <h1 className="text-xl font-bold">{STEPS[step].title}</h1>
            </div>
          </div>
          <Progress value={progress} className="bg-white/20" />
        </div>

        <Card className="rounded-3xl border-border/60">
          <CardContent className="p-6 space-y-5">
            {step === 0 && (
              <div className="grid sm:grid-cols-3 gap-6">
                <ImageUpload label="Foto do profissional" value={avatar} onChange={setAvatar} shape="circle" folder="avatar" />
                <ImageUpload label="Logo (opcional)" value={logo} onChange={setLogo} folder="logo" aspect="aspect-square" />
                <ImageUpload label="Capa do perfil" value={cover} onChange={setCover} folder="cover" aspect="aspect-video" className="sm:col-span-3" />
                <p className="sm:col-span-3 text-xs text-muted-foreground">As imagens aparecerão na sua página pública e nos resultados de busca da Livvo.</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Nome profissional</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ex.: Dra. Helena Souza" /></div>
                  <div><Label>CPF ou CNPJ</Label><Input value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} /></div>
                </div>
                <div><Label>Registro profissional</Label><Input value={registry} onChange={(e) => setRegistry(e.target.value)} placeholder="Ex.: CRM 123456/SP" /></div>
                <div>
                  <Label>Especialidade principal</Label>
                  <select value={specId} onChange={(e) => setSpecId(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm">
                    <option value="">Selecione...</option>
                    {(specs ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Especialidades secundárias</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(specs ?? []).map((s) => {
                      const on = secondarySpecs.includes(s.id);
                      return (
                        <button key={s.id} type="button" onClick={() => setSecondarySpecs(on ? secondarySpecs.filter((x) => x !== s.id) : [...secondarySpecs, s.id])}
                          className={`text-xs px-3 py-1.5 rounded-full border ${on ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div><Label>Bio / Apresentação</Label><Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte sua experiência, abordagem e diferenciais..." /></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Anos de experiência</Label><Input type="number" value={years} onChange={(e) => setYears(e.target.value)} /></div>
                </div>
                <div><Label>Formação acadêmica</Label><Input value={formation} onChange={(e) => setFormation(e.target.value)} placeholder="Ex.: Medicina - USP (2010)" /></div>
                <div><Label>Pós-graduações</Label><Input value={postgrad} onChange={(e) => setPostgrad(e.target.value)} placeholder="Ex.: Residência em Dermatologia - Hospital das Clínicas" /></div>
                <div><Label>Certificações</Label><ChipsInput value={certs} onChange={setCerts} placeholder="Adicione e pressione Enter" /></div>
                <div><Label>Idiomas atendidos</Label><ChipsInput value={languages} onChange={setLanguages} suggestions={["Português", "Inglês", "Espanhol", "Libras", "Francês"]} /></div>
              </div>
            )}

            {step === 3 && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-0000" /></div>
                <div><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <div className="sm:col-span-2"><Label>E-mail profissional</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>Instagram</Label><Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seuperfil" /></div>
                <div><Label>Site</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" /></div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <div><Label>CEP</Label><Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="00000-000" maxLength={9} />
                  <p className="text-xs text-muted-foreground mt-1">Preenchemos endereço automaticamente.</p>
                </div>
                <div className="grid sm:grid-cols-[1fr_140px] gap-3">
                  <div><Label>Rua</Label><Input value={street} onChange={(e) => setStreet(e.target.value)} /></div>
                  <div><Label>Número</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Complemento</Label><Input value={complement} onChange={(e) => setComplement(e.target.value)} /></div>
                  <div><Label>Bairro</Label><Input value={district} onChange={(e) => setDistrict(e.target.value)} /></div>
                </div>
                <div className="grid sm:grid-cols-[1fr_120px] gap-3">
                  <div><Label>Cidade</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                  <div><Label>UF</Label><Input maxLength={2} value={stateUf} onChange={(e) => setStateUf(e.target.value.toUpperCase())} /></div>
                </div>
              </div>
            )}

            {step === 5 && <BusinessHoursGrid value={hours} onChange={setHours} />}

            {step === 6 && (
              <div className="space-y-6">
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Serviços oferecidos</h3>
                    <ServiceFormDialog onSaved={refetchServices} />
                  </div>
                  <div className="space-y-2">
                    {(services ?? []).map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.type} · {s.duration_minutes}min · R$ {Number(s.price).toFixed(2)}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={async () => { await delService({ data: { id: s.id } }); refetchServices(); }}>Remover</Button>
                      </div>
                    ))}
                    {!services?.length && <p className="text-sm text-muted-foreground">Cadastre ao menos um serviço para finalizar.</p>}
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-3">Documentos para validação</h3>
                  <div className="space-y-2">
                    {(["documento_pessoal", "registro", "comprovante_endereco", "documento_empresa"] as const).map((k) => {
                      const existing = (docs ?? []).find((d) => d.kind === k) ?? null;
                      return <DocumentUploadRow key={k} kind={k} existing={existing} onUploaded={refetchDocs} />;
                    })}
                  </div>
                </section>

                <div className="rounded-2xl bg-health/10 border border-health/30 p-5">
                  <Badge className="bg-health text-white mb-2">Programa Comissão Zero</Badge>
                  <h3 className="font-bold text-lg">Parabéns! Seu perfil está quase pronto</h3>
                  <p className="text-sm text-muted-foreground mt-2">Após a aprovação você ganha <strong>90 dias de comissão zero</strong>: receberá 100% do valor dos agendamentos, com acesso completo à plataforma.</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-health" /> Recebimento integral dos agendamentos</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-health" /> Acesso à agenda, financeiro e mensagens</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-health" /> Possibilidade de impulsionar perfil</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl mt-4 border-dashed">
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground flex-1">É clínica, laboratório ou centro de diagnóstico?</p>
            <Button asChild variant="outline" size="sm"><Link to="/pro">Cadastrar empresa</Link></Button>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur border-t border-border">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}>
            <ArrowLeft className="size-4 mr-1" /> Voltar
          </Button>
          {step < 6 ? (
            <Button onClick={next} className="rounded-xl">Salvar e continuar <ArrowRight className="size-4 ml-1" /></Button>
          ) : (
            <Button onClick={finish} className="rounded-xl bg-health text-white hover:bg-health/90">Enviar para análise</Button>
          )}
        </div>
      </div>
    </div>
  );
}
