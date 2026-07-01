/**
 * Gerador de materiais de divulgação em canvas — client-side, sem storage.
 * Cada template recebe as mesmas variáveis (foto, nome, especialidade, url, qr).
 * PNGs são baixados diretamente pelo navegador.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Instagram, MessageCircle, IdCard, QrCode as QrIcon, Mail, Printer, Share2, Facebook, Link as LinkIcon } from "lucide-react";
import { Skeleton } from "@/components/livvo/empty-state";

export interface KitVars {
  fullName: string;
  specialty?: string;
  city?: string;
  state?: string;
  avatarUrl?: string | null;
  logoUrl?: string | null;
  url: string;
  handle?: string; // ex: @drjoao
}

type Template = {
  id: string;
  label: string;
  size: { w: number; h: number };
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  draw: (ctx: CanvasRenderingContext2D, vars: KitVars, assets: KitAssets, w: number, h: number) => void;
};

interface KitAssets {
  avatar: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  qr: HTMLImageElement | null;
}

// ---------- design tokens (constantes para os canvases) ----------
const TEAL = "#14b8a6";
const TEAL_DARK = "#0d9488";
const INK = "#0f172a";
const INK_SOFT = "#334155";
const CLOUD = "#f1f5f9";
const WHITE = "#ffffff";

// ---------- utilitários ----------
async function loadImage(src?: string | null): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawAvatarCircle(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, cx: number, cy: number, r: number, initials: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = CLOUD;
  ctx.fill();
  ctx.clip();
  if (img) {
    // cover
    const ratio = Math.max((2 * r) / img.width, (2 * r) / img.height);
    const dw = img.width * ratio;
    const dh = img.height * ratio;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = TEAL;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = WHITE;
    ctx.font = `bold ${r}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, cx, cy);
  }
  ctx.restore();
  // ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 8;
  ctx.strokeStyle = WHITE;
  ctx.stroke();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 3): number {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, maxLines);
  shown.forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return shown.length * lineH;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("") || "L";
}

// ---------- templates ----------
const TEMPLATES: Template[] = [
  // 1. Cartão Digital
  {
    id: "cartao-digital",
    label: "Cartão Digital",
    size: { w: 1080, h: 600 },
    icon: IdCard,
    description: "Cartão de visita com QR Code, ideal para enviar por chat.",
    draw: (ctx, v, a, w, h) => {
      ctx.fillStyle = WHITE; ctx.fillRect(0, 0, w, h);
      // banda lateral
      const g = ctx.createLinearGradient(0, 0, 360, h);
      g.addColorStop(0, TEAL); g.addColorStop(1, TEAL_DARK);
      ctx.fillStyle = g; ctx.fillRect(0, 0, 360, h);
      drawAvatarCircle(ctx, a.avatar, 180, 240, 130, initials(v.fullName));
      // logo Livvo
      ctx.fillStyle = WHITE;
      ctx.font = "bold 26px system-ui, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("livvo", 180, 440);
      ctx.font = "500 14px system-ui, sans-serif";
      ctx.fillText("conecta.saúde", 180, 465);
      // texto
      ctx.fillStyle = INK; ctx.textAlign = "left";
      ctx.font = "bold 52px system-ui, sans-serif";
      wrap(ctx, v.fullName, 420, 200, 520, 58, 2);
      ctx.fillStyle = TEAL_DARK; ctx.font = "600 26px system-ui, sans-serif";
      if (v.specialty) ctx.fillText(v.specialty, 420, 320);
      ctx.fillStyle = INK_SOFT; ctx.font = "500 22px system-ui, sans-serif";
      if (v.city) ctx.fillText(`${v.city}${v.state ? " · " + v.state : ""}`, 420, 358);
      // QR
      if (a.qr) ctx.drawImage(a.qr, 820, 400, 180, 180);
      ctx.fillStyle = INK_SOFT; ctx.font = "500 18px system-ui, sans-serif"; ctx.textAlign = "left";
      ctx.fillText("Agende pelo QR Code →", 420, 500);
      ctx.font = "600 20px system-ui, sans-serif"; ctx.fillStyle = INK;
      ctx.fillText(v.url.replace(/^https?:\/\//, ""), 420, 530);
    },
  },
  // 2. Story IG — Agende sua Consulta
  {
    id: "story-agende",
    label: "Story · Agende sua Consulta",
    size: { w: 1080, h: 1920 },
    icon: Instagram,
    description: "Story vertical convidando o paciente a agendar.",
    draw: (ctx, v, a, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, TEAL); g.addColorStop(1, TEAL_DARK);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // card branco
      roundRect(ctx, 80, 260, w - 160, h - 520, 48); ctx.fillStyle = WHITE; ctx.fill();
      drawAvatarCircle(ctx, a.avatar, w / 2, 260, 160, initials(v.fullName));
      ctx.fillStyle = INK; ctx.textAlign = "center";
      ctx.font = "bold 68px system-ui, sans-serif";
      wrap(ctx, v.fullName, w / 2, 500, w - 240, 76, 2);
      if (v.specialty) {
        ctx.fillStyle = TEAL_DARK; ctx.font = "600 40px system-ui, sans-serif";
        ctx.fillText(v.specialty, w / 2, 680);
      }
      ctx.fillStyle = INK; ctx.font = "800 92px system-ui, sans-serif";
      ctx.fillText("Agende", w / 2, 900);
      ctx.fillText("sua consulta", w / 2, 1000);
      ctx.fillStyle = INK_SOFT; ctx.font = "500 36px system-ui, sans-serif";
      ctx.fillText("Escaneie o QR Code", w / 2, 1120);
      if (a.qr) ctx.drawImage(a.qr, w / 2 - 220, 1180, 440, 440);
      ctx.fillStyle = WHITE; ctx.textAlign = "center";
      ctx.font = "bold 32px system-ui, sans-serif";
      ctx.fillText(v.url.replace(/^https?:\/\//, ""), w / 2, h - 180);
      ctx.font = "600 24px system-ui, sans-serif";
      ctx.fillText("livvo · conecta.saúde", w / 2, h - 130);
    },
  },
  // 3. Story IG — Horários disponíveis
  {
    id: "story-horarios",
    label: "Story · Horários Disponíveis",
    size: { w: 1080, h: 1920 },
    icon: Instagram,
    description: "Story vertical divulgando horários livres.",
    draw: (ctx, v, a, w, h) => {
      ctx.fillStyle = INK; ctx.fillRect(0, 0, w, h);
      // faixa gradiente topo
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, TEAL); g.addColorStop(1, "#0ea5b7");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, 260);
      ctx.fillStyle = WHITE; ctx.textAlign = "center";
      ctx.font = "800 84px system-ui, sans-serif"; ctx.fillText("Horários", w / 2, 140);
      ctx.font = "800 84px system-ui, sans-serif"; ctx.fillText("livres hoje", w / 2, 230);
      drawAvatarCircle(ctx, a.avatar, w / 2, 460, 150, initials(v.fullName));
      ctx.fillStyle = WHITE; ctx.font = "bold 52px system-ui, sans-serif";
      wrap(ctx, v.fullName, w / 2, 700, w - 200, 60, 2);
      if (v.specialty) { ctx.font = "500 34px system-ui, sans-serif"; ctx.fillStyle = "#94e5d9"; ctx.fillText(v.specialty, w / 2, 820); }
      // "slots" ilustrativos
      const times = ["09:00", "11:30", "14:00", "16:30"];
      times.forEach((t, i) => {
        const y = 950 + i * 130;
        roundRect(ctx, 180, y, w - 360, 100, 24);
        ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.fill();
        ctx.fillStyle = WHITE; ctx.font = "bold 44px system-ui, sans-serif";
        ctx.textAlign = "left"; ctx.fillText(t, 220, y + 65);
        ctx.textAlign = "right"; ctx.font = "500 32px system-ui, sans-serif";
        ctx.fillStyle = "#94e5d9"; ctx.fillText("disponível", w - 220, y + 65);
      });
      if (a.qr) ctx.drawImage(a.qr, w / 2 - 160, 1560, 320, 320);
    },
  },
  // 4. Story IG — Conheça meu Perfil
  {
    id: "story-perfil",
    label: "Story · Conheça meu Perfil",
    size: { w: 1080, h: 1920 },
    icon: Instagram,
    description: "Story convidando a visitar sua página.",
    draw: (ctx, v, a, w, h) => {
      ctx.fillStyle = CLOUD; ctx.fillRect(0, 0, w, h);
      // banner teal em L
      ctx.fillStyle = TEAL; ctx.fillRect(0, 0, w, 500);
      ctx.fillStyle = TEAL_DARK; ctx.fillRect(0, 1400, w, 520);
      drawAvatarCircle(ctx, a.avatar, w / 2, 500, 180, initials(v.fullName));
      ctx.fillStyle = INK; ctx.textAlign = "center";
      ctx.font = "bold 64px system-ui, sans-serif";
      wrap(ctx, v.fullName, w / 2, 780, w - 200, 74, 2);
      if (v.specialty) { ctx.fillStyle = TEAL_DARK; ctx.font = "600 38px system-ui, sans-serif"; ctx.fillText(v.specialty, w / 2, 920); }
      ctx.fillStyle = INK; ctx.font = "800 76px system-ui, sans-serif";
      ctx.fillText("Conheça meu", w / 2, 1120);
      ctx.fillText("perfil na Livvo", w / 2, 1210);
      if (a.qr) ctx.drawImage(a.qr, w / 2 - 160, 1500, 320, 320);
      ctx.fillStyle = WHITE; ctx.font = "bold 30px system-ui, sans-serif";
      ctx.fillText(v.url.replace(/^https?:\/\//, ""), w / 2, h - 60);
    },
  },
  // 5. Post IG (quadrado)
  {
    id: "post-instagram",
    label: "Post Instagram",
    size: { w: 1080, h: 1080 },
    icon: Instagram,
    description: "Post quadrado com foto, nome e QR Code.",
    draw: (ctx, v, a, w, h) => {
      ctx.fillStyle = WHITE; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = TEAL; ctx.fillRect(0, 0, w, 220);
      drawAvatarCircle(ctx, a.avatar, w / 2, 220, 130, initials(v.fullName));
      ctx.fillStyle = INK; ctx.textAlign = "center";
      ctx.font = "bold 56px system-ui, sans-serif";
      wrap(ctx, v.fullName, w / 2, 430, w - 160, 64, 2);
      if (v.specialty) { ctx.fillStyle = TEAL_DARK; ctx.font = "600 34px system-ui, sans-serif"; ctx.fillText(v.specialty, w / 2, 560); }
      if (a.qr) ctx.drawImage(a.qr, w / 2 - 160, 620, 320, 320);
      ctx.fillStyle = INK_SOFT; ctx.font = "500 24px system-ui, sans-serif";
      ctx.fillText("Agende pelo QR ou acesse:", w / 2, 990);
      ctx.fillStyle = INK; ctx.font = "600 28px system-ui, sans-serif";
      ctx.fillText(v.url.replace(/^https?:\/\//, ""), w / 2, 1030);
    },
  },
  // 6. Banner WhatsApp
  {
    id: "banner-whatsapp",
    label: "Banner WhatsApp / Grupos",
    size: { w: 1080, h: 1080 },
    icon: MessageCircle,
    description: "Imagem quadrada para grupos e status do WhatsApp.",
    draw: (ctx, v, a, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#0d9488"); g.addColorStop(1, "#0f766e");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      drawAvatarCircle(ctx, a.avatar, 260, 260, 140, initials(v.fullName));
      ctx.fillStyle = WHITE; ctx.textAlign = "left";
      ctx.font = "bold 52px system-ui, sans-serif";
      wrap(ctx, v.fullName, 440, 240, 580, 60, 2);
      if (v.specialty) { ctx.font = "500 30px system-ui, sans-serif"; ctx.fillStyle = "#a7f3d0"; ctx.fillText(v.specialty, 440, 360); }
      ctx.fillStyle = WHITE; ctx.font = "800 76px system-ui, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("Agende sua consulta", w / 2, 620);
      if (a.qr) ctx.drawImage(a.qr, w / 2 - 180, 680, 360, 360);
    },
  },
  // 7. Cartaz para Recepção (A4-ish 3:4)
  {
    id: "cartaz",
    label: "Cartaz para Recepção",
    size: { w: 1080, h: 1440 },
    icon: Printer,
    description: "Cartaz vertical para imprimir na recepção da clínica.",
    draw: (ctx, v, a, w, h) => {
      ctx.fillStyle = WHITE; ctx.fillRect(0, 0, w, h);
      // topo colorido
      ctx.fillStyle = TEAL; ctx.fillRect(0, 0, w, 320);
      ctx.fillStyle = WHITE; ctx.textAlign = "center";
      ctx.font = "800 62px system-ui, sans-serif"; ctx.fillText("Agende com seu profissional", w / 2, 150);
      ctx.font = "600 34px system-ui, sans-serif"; ctx.fillText("Rápido, seguro e sem burocracia", w / 2, 220);
      drawAvatarCircle(ctx, a.avatar, w / 2, 380, 150, initials(v.fullName));
      ctx.fillStyle = INK; ctx.font = "bold 60px system-ui, sans-serif";
      wrap(ctx, v.fullName, w / 2, 620, w - 200, 70, 2);
      if (v.specialty) { ctx.fillStyle = TEAL_DARK; ctx.font = "600 36px system-ui, sans-serif"; ctx.fillText(v.specialty, w / 2, 760); }
      if (a.qr) ctx.drawImage(a.qr, w / 2 - 220, 830, 440, 440);
      ctx.fillStyle = INK_SOFT; ctx.font = "500 28px system-ui, sans-serif";
      ctx.fillText("Escaneie com a câmera do celular", w / 2, 1310);
      ctx.fillStyle = INK; ctx.font = "600 30px system-ui, sans-serif";
      ctx.fillText(v.url.replace(/^https?:\/\//, ""), w / 2, 1360);
      ctx.fillStyle = TEAL; ctx.font = "bold 24px system-ui, sans-serif";
      ctx.fillText("livvo · conecta.saúde", w / 2, 1410);
    },
  },
  // 8. Facebook 1200×630
  {
    id: "facebook-og",
    label: "Facebook / Link Preview",
    size: { w: 1200, h: 630 },
    icon: Facebook,
    description: "Imagem 1200×630 ideal para compartilhamentos no Facebook.",
    draw: (ctx, v, a, w, h) => {
      ctx.fillStyle = WHITE; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = TEAL; ctx.fillRect(0, 0, 420, h);
      drawAvatarCircle(ctx, a.avatar, 210, h / 2 - 60, 130, initials(v.fullName));
      ctx.fillStyle = WHITE; ctx.textAlign = "center";
      ctx.font = "bold 28px system-ui, sans-serif"; ctx.fillText("livvo", 210, h - 100);
      ctx.font = "500 16px system-ui, sans-serif"; ctx.fillText("conecta.saúde", 210, h - 70);
      ctx.fillStyle = INK; ctx.textAlign = "left";
      ctx.font = "bold 54px system-ui, sans-serif";
      wrap(ctx, v.fullName, 470, 220, 680, 62, 2);
      if (v.specialty) { ctx.fillStyle = TEAL_DARK; ctx.font = "600 30px system-ui, sans-serif"; ctx.fillText(v.specialty, 470, 360); }
      ctx.fillStyle = INK_SOFT; ctx.font = "500 22px system-ui, sans-serif";
      ctx.fillText(v.url.replace(/^https?:\/\//, ""), 470, 420);
      if (a.qr) ctx.drawImage(a.qr, w - 260, h - 260, 200, 200);
    },
  },
  // 9. Assinatura de e-mail
  {
    id: "email-signature",
    label: "Assinatura de E-mail",
    size: { w: 900, h: 260 },
    icon: Mail,
    description: "Assinatura horizontal para adicionar em respostas de e-mail.",
    draw: (ctx, v, a, w, h) => {
      ctx.fillStyle = WHITE; ctx.fillRect(0, 0, w, h);
      // borda esquerda teal
      ctx.fillStyle = TEAL; ctx.fillRect(0, 0, 8, h);
      drawAvatarCircle(ctx, a.avatar, 110, h / 2, 80, initials(v.fullName));
      ctx.fillStyle = INK; ctx.textAlign = "left";
      ctx.font = "bold 30px system-ui, sans-serif"; ctx.fillText(v.fullName, 220, 90);
      if (v.specialty) { ctx.fillStyle = TEAL_DARK; ctx.font = "600 20px system-ui, sans-serif"; ctx.fillText(v.specialty, 220, 120); }
      ctx.fillStyle = INK_SOFT; ctx.font = "500 16px system-ui, sans-serif";
      if (v.city) ctx.fillText(`${v.city}${v.state ? " · " + v.state : ""}`, 220, 150);
      ctx.fillText(v.url.replace(/^https?:\/\//, ""), 220, 180);
      ctx.fillStyle = TEAL; ctx.font = "bold 18px system-ui, sans-serif"; ctx.fillText("livvo · conecta.saúde", 220, 220);
      if (a.qr) ctx.drawImage(a.qr, w - 200, 40, 180, 180);
    },
  },
  // 10. Link da Bio (mini landing image)
  {
    id: "link-bio",
    label: "Link da Bio",
    size: { w: 1080, h: 1080 },
    icon: LinkIcon,
    description: "Imagem quadrada para destacar no link da bio.",
    draw: (ctx, v, a, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#14b8a6"); g.addColorStop(1, "#0f766e");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      drawAvatarCircle(ctx, a.avatar, w / 2, 320, 170, initials(v.fullName));
      ctx.fillStyle = WHITE; ctx.textAlign = "center";
      ctx.font = "bold 58px system-ui, sans-serif";
      wrap(ctx, v.fullName, w / 2, 560, w - 200, 66, 2);
      if (v.specialty) { ctx.font = "500 34px system-ui, sans-serif"; ctx.fillStyle = "#a7f3d0"; ctx.fillText(v.specialty, w / 2, 690); }
      // "botão"
      roundRect(ctx, 180, 780, w - 360, 130, 65); ctx.fillStyle = WHITE; ctx.fill();
      ctx.fillStyle = TEAL_DARK; ctx.font = "bold 42px system-ui, sans-serif";
      ctx.fillText("Agendar consulta", w / 2, 865);
      ctx.fillStyle = WHITE; ctx.font = "500 26px system-ui, sans-serif";
      ctx.fillText(v.url.replace(/^https?:\/\//, ""), w / 2, 980);
    },
  },
  // 11. QR Code isolado
  {
    id: "qr-only",
    label: "QR Code (isolado)",
    size: { w: 1024, h: 1024 },
    icon: QrIcon,
    description: "Somente o QR Code em alta resolução para uso livre.",
    draw: (ctx, v, a, w, h) => {
      ctx.fillStyle = WHITE; ctx.fillRect(0, 0, w, h);
      if (a.qr) ctx.drawImage(a.qr, 62, 62, 900, 900);
      ctx.fillStyle = INK_SOFT; ctx.textAlign = "center";
      ctx.font = "500 22px system-ui, sans-serif";
      ctx.fillText(v.url.replace(/^https?:\/\//, ""), w / 2, 1000);
    },
  },
];

export const KIT_TEMPLATES = TEMPLATES;

// ---------- Preview + download ----------
function TemplateCard({ template, vars, assets }: { template: Template; vars: KitVars; assets: KitAssets }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const render = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    c.width = template.size.w; c.height = template.size.h;
    const ctx = c.getContext("2d"); if (!ctx) return;
    template.draw(ctx, vars, assets, template.size.w, template.size.h);
    setReady(true);
  }, [template, vars, assets]);

  useEffect(() => { render(); }, [render]);

  const download = () => {
    const c = canvasRef.current; if (!c) return;
    const link = document.createElement("a");
    link.download = `livvo-${template.id}.png`;
    link.href = c.toDataURL("image/png");
    link.click();
  };

  const aspect = template.size.w / template.size.h;
  const Icon = template.icon;

  return (
    <div className="livvo-card livvo-card-hover p-4 space-y-3">
      <div className="flex items-start gap-2">
        <div className="size-9 shrink-0 rounded-lg bg-primary-soft grid place-items-center text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{template.label}</p>
          <p className="text-[11px] text-muted-foreground leading-snug">{template.description}</p>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden bg-muted/30 border border-border grid place-items-center" style={{ aspectRatio: aspect }}>
        {!ready && <Skeleton className="w-full h-full" />}
        <canvas ref={canvasRef} className="w-full h-auto max-h-72 object-contain" />
      </div>
      <Button size="sm" variant="outline" className="w-full" onClick={download} disabled={!ready}>
        <Download className="size-3.5 mr-2" /> Baixar PNG
      </Button>
    </div>
  );
}

export function KitGallery({ vars }: { vars: KitVars }) {
  const [assets, setAssets] = useState<KitAssets | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [avatar, logo, qrDataUrl] = await Promise.all([
        loadImage(vars.avatarUrl),
        loadImage(vars.logoUrl),
        QRCode.toDataURL(vars.url, { width: 640, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } }),
      ]);
      const qr = await loadImage(qrDataUrl);
      if (!cancelled) setAssets({ avatar, logo, qr });
    })();
    return () => { cancelled = true; };
  }, [vars]);

  if (!assets) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {TEMPLATES.map((t) => <TemplateCard key={t.id} template={t} vars={vars} assets={assets} />)}
    </div>
  );
}

export function KitGalleryLoader({ vars }: { vars: KitVars | null }) {
  if (!vars) {
    return (
      <div className="livvo-card p-6 text-center text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin mx-auto mb-2" /> Carregando dados do perfil…
      </div>
    );
  }
  return <KitGallery vars={vars} />;
}

// Ícone default export para o menu
export const KitShareIcon = Share2;
