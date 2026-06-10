import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PatientBottomNav } from "@/components/livvo/bottom-nav";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="mx-auto max-w-md">
        <Outlet />
      </div>
      <PatientBottomNav />
    </div>
  );
}
