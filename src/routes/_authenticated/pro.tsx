import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProBottomNav } from "@/components/livvo/bottom-nav";

export const Route = createFileRoute("/_authenticated/pro")({
  component: ProLayout,
});

function ProLayout() {
  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="mx-auto max-w-md">
        <Outlet />
      </div>
      <ProBottomNav />
    </div>
  );
}
