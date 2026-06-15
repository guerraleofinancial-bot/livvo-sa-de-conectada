import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/chat/$id")({
  component: ChatRoom,
});

interface Msg { id: string; sender_id: string; content: string; created_at: string }

function ChatRoom() {
  const { id: appointmentId } = Route.useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: appt } = useQuery({
    queryKey: ["appt", appointmentId],
    queryFn: async () => (await supabase.from("appointments").select("*, professionals(profiles:profiles!professionals_profile_fkey(full_name, avatar_url), specialties(name))").eq("id", appointmentId).single()).data,
  });

  useEffect(() => {
    let active = true;
    supabase.from("messages").select("*").eq("appointment_id", appointmentId).order("created_at").then(({ data }) => {
      if (active) setMessages((data ?? []) as Msg[]);
    });
    const channel = supabase
      .channel(`chat-${appointmentId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `appointment_id=eq.${appointmentId}` }, (p) => {
        setMessages((m) => [...m, p.new as Msg]);
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [appointmentId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({ appointment_id: appointmentId, sender_id: user.id, content });
    if (error) console.error(error);
  }

  const a = appt as (typeof appt & { professionals: { profiles: { full_name?: string; avatar_url?: string } | null; specialties: { name?: string } | null } | null }) | null;

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/app/mensagens" className="size-9 rounded-full grid place-items-center hover:bg-muted">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="size-10 rounded-full bg-primary-soft grid place-items-center text-primary font-bold border border-border overflow-hidden shrink-0">
          {a?.professionals?.profiles?.avatar_url ? <img src={a.professionals.profiles.avatar_url} alt="" className="size-full object-cover" /> : (a?.professionals?.profiles?.full_name ?? "?").charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{a?.professionals?.profiles?.full_name ?? "Conversa"}</p>
          <p className="text-xs text-muted-foreground truncate">{a?.professionals?.specialties?.name}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-surface">
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
                {m.content}
                <div className={`text-[10px] mt-1 opacity-70 ${mine ? "text-right" : ""}`}>
                  {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && <p className="text-center text-xs text-muted-foreground py-10">Início da conversa</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="sticky bottom-0 bg-card border-t border-border p-3 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite uma mensagem..." className="rounded-xl" />
        <Button type="submit" size="icon" className="rounded-xl shrink-0"><Send className="size-4" /></Button>
      </form>
    </div>
  );
}
