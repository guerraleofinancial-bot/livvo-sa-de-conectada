import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { PatientBottomNav } from "@/components/livvo/bottom-nav";
import { UserProfileMenu } from "@/components/livvo/user-profile-menu";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-10">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-5 md:px-8 h-14 flex items-center justify-between gap-3">
          <Link to="/app" className="text-sm font-bold tracking-tight">Livvo</Link>
          <div className="flex items-center gap-1.5">
            <Link to="/app/mensagens" className="p-2 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Mensagens">
              <Bell className="size-4" />
            </Link>
            <UserProfileMenu />
          </div>
        </div>
      </header>
      <Outlet />
      <PatientBottomNav />
    </div>
  );
}
