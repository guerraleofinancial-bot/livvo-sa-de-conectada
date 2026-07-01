import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  professionalId?: string;
  companyId?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/**
 * Botão de favoritar reutilizável — funciona para profissionais e empresas.
 * Se o usuário não estiver logado, redireciona ao /auth preservando destino.
 */
export function FavoriteButton({ professionalId, companyId, variant = "outline", size = "sm", className }: FavoriteButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favId, setFavId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setFavId(null); return; }
    let query = supabase.from("favorites").select("id").eq("patient_id", user.id);
    if (professionalId) query = query.eq("professional_id", professionalId);
    if (companyId) query = query.eq("company_id", companyId);
    query.maybeSingle().then(({ data }) => setFavId(data?.id ?? null));
  }, [user, professionalId, companyId]);

  const toggle = async () => {
    if (!user) {
      toast.info("Entre para salvar seus favoritos");
      navigate({ to: "/auth" });
      return;
    }
    setLoading(true);
    try {
      if (favId) {
        await supabase.from("favorites").delete().eq("id", favId);
        setFavId(null);
        toast.success("Removido dos favoritos");
      } else {
        const { data } = await supabase
          .from("favorites")
          .insert({
            patient_id: user.id,
            professional_id: professionalId ?? null,
            company_id: companyId ?? null,
          })
          .select("id")
          .maybeSingle();
        setFavId(data?.id ?? null);
        toast.success("Salvo nos favoritos");
      }
    } finally {
      setLoading(false);
    }
  };

  const active = !!favId;
  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggle}
      disabled={loading}
      className={cn(active && "text-rose-600 border-rose-200", className)}
    >
      <Heart className={cn("size-4", active && "fill-current")} />
      {size !== "icon" && <span className="ml-2">{active ? "Salvo" : "Favoritar"}</span>}
    </Button>
  );
}
