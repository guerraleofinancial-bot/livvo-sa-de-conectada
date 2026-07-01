import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "paciente" | "profissional" | "empresa" | "admin";
export type AdminLevel = "admin" | "admin_master" | "super_admin";

export interface AuthState {
  user: User | null;
  roles: AppRole[];
  adminLevel: AdminLevel | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminMaster: boolean;
  isSuperAdmin: boolean;
  isProfessional: boolean;
  isCompany: boolean;
  isPatient: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [adminLevel, setAdminLevel] = useState<AdminLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadRoles = async (uid: string) => {
      const [{ data: r }, { data: g }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("admin_grants").select("level").eq("user_id", uid).maybeSingle(),
      ]);
      if (!mounted) return;
      setRoles((r ?? []).map((x) => x.role as AppRole));
      setAdminLevel((g?.level as AdminLevel | undefined) ?? null);
    };

    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      setUser(data.user);
      if (data.user) await loadRoles(data.user.id);
      else { setRoles([]); setAdminLevel(null); }
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        await loadRoles(session.user.id);
        if (mounted) setLoading(false);
      } else {
        setRoles([]); setAdminLevel(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isSuperAdmin = adminLevel === "super_admin";
  const isAdminMaster = adminLevel === "admin_master" || isSuperAdmin;
  const isAdmin = adminLevel !== null || roles.includes("admin");

  return {
    user,
    roles,
    adminLevel,
    loading,
    isAdmin,
    isAdminMaster,
    isSuperAdmin,
    isProfessional: roles.includes("profissional"),
    isCompany: roles.includes("empresa"),
    isPatient: roles.includes("paciente"),
  };
}
