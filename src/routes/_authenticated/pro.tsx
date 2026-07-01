import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { ProBottomNav } from "@/components/livvo/bottom-nav";
import { ProHeader } from "@/components/livvo/pro-header";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/pro")({
  component: ProLayout,
});

function ProLayout() {
  const { user, isProfessional, isCompany, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!isProfessional && !isCompany && !isAdmin) {
      navigate({ to: "/app", replace: true });
    }
  }, [loading, user, isProfessional, isCompany, isAdmin, navigate]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!isProfessional && !isCompany && !isAdmin) return null;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="mx-auto max-w-md">
        <ProHeader />
        <Outlet />
      </div>
      <ProBottomNav />
    </div>
  );
}

