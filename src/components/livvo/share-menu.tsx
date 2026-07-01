import { useState } from "react";
import QRCode from "qrcode";
import { Share2, Copy, MessageCircle, Mail, Linkedin, Facebook, Instagram, QrCode, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ShareMenuProps {
  url: string;
  title: string;
  text?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}

/**
 * Menu de compartilhamento reutilizável (perfis, procedimentos, empresas).
 * WhatsApp / Instagram / Facebook / LinkedIn / e-mail / copiar link / QR code.
 */
export function ShareMenu({ url, title, text, variant = "outline", size = "sm", label = "Compartilhar" }: ShareMenuProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const share = text ? `${title} — ${text}\n${url}` : `${title}\n${url}`;

  const openWhats = () => window.open(`https://wa.me/?text=${encodeURIComponent(share)}`, "_blank");
  const openFb = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  const openLi = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
  const openEmail = () => window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(share)}`);
  const openInsta = async () => {
    await navigator.clipboard.writeText(share);
    toast.info("Link copiado — cole no Instagram");
    window.open("https://www.instagram.com/", "_blank");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const openQr = async () => {
    if (!qrDataUrl) {
      const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } });
      setQrDataUrl(dataUrl);
    }
    setQrOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size}>
            <Share2 className="size-4" />
            {size !== "icon" && <span className="ml-2">{label}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={openWhats}>
            <MessageCircle className="size-4 mr-2 text-emerald-600" /> WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openInsta}>
            <Instagram className="size-4 mr-2 text-pink-600" /> Instagram
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openFb}>
            <Facebook className="size-4 mr-2 text-blue-600" /> Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openLi}>
            <Linkedin className="size-4 mr-2 text-blue-700" /> LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openEmail}>
            <Mail className="size-4 mr-2" /> E-mail
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copy}>
            {copied ? <Check className="size-4 mr-2 text-emerald-600" /> : <Copy className="size-4 mr-2" />}
            Copiar link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openQr}>
            <QrCode className="size-4 mr-2" /> Gerar QR code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">Escaneie para abrir</DialogTitle>
          </DialogHeader>
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-3">
              <img src={qrDataUrl} alt="QR code" className="w-full rounded-lg border" />
              <p className="text-xs text-center text-muted-foreground break-all">{url}</p>
              <Button size="sm" variant="outline" onClick={copy} className="w-full">
                {copied ? <Check className="size-4 mr-2" /> : <Copy className="size-4 mr-2" />}
                Copiar link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
