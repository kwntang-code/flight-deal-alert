import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plane, BellRing, Trash2, TrendingDown, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "我的追蹤航線 | 飛價雷達" },
      { name: "description", content: "管理追蹤航線、目標票價，並查看最新的機票降價通知。" },
      { property: "og:title", content: "我的追蹤航線 | 飛價雷達" },
      { property: "og:description", content: "管理追蹤航線、目標票價，並查看最新的機票降價通知。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type RouteRow = {
  id: string;
  origin: string;
  destination: string;
  depart_date: string;
  return_date: string | null;
  target_price: number;
  current_price: number | null;
  currency: string;
};

type AlertRow = {
  id: string;
  old_price: number;
  new_price: number;
  is_read: boolean;
  created_at: string;
  tracked_routes: { origin: string; destination: string } | null;
};

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    depart_date: "",
    return_date: "",
    target_price: "",
  });

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", auth.user.id)
        .maybeSingle();
      return data;
    },
  });

  const routes = useQuery({
    queryKey: ["routes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_routes")
        .select("id, origin, destination, depart_date, return_date, target_price, current_price, currency")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RouteRow[];
    },
  });

  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_alerts")
        .select("id, old_price, new_price, is_read, created_at, tracked_routes(origin, destination)")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as AlertRow[];
    },
  });

  const addRoute = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("尚未登入");
      const { error } = await supabase.from("tracked_routes").insert({
        user_id: auth.user.id,
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        depart_date: form.depart_date,
        return_date: form.return_date || null,
        target_price: Number(form.target_price),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("已加入追蹤");
      setForm({ origin: "", destination: "", depart_date: "", return_date: "", target_price: "" });
      qc.invalidateQueries({ queryKey: ["routes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRoute = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tracked_routes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("已移除追蹤");
      qc.invalidateQueries({ queryKey: ["routes"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const unread = (alerts.data ?? []).filter((a) => !a.is_read).length;

  return (
    <main className="surface-sky min-h-screen">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Plane className="size-5 text-primary" />
          飛價雷達
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            嗨，{profile.data?.nickname || "旅人"}
          </span>
          <Button variant="secondary" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" /> 登出
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-6 pb-20 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="surface-card rounded-2xl border border-border p-6">
            <h1 className="text-lg font-semibold">新增追蹤航線</h1>
            <p className="mt-1 text-sm text-muted-foreground">設定目標票價，降價時就會收到通知。</p>
            <form
              className="mt-5 grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                addRoute.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="origin">出發地</Label>
                <Input
                  id="origin"
                  required
                  placeholder="TPE 台北"
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">目的地</Label>
                <Input
                  id="destination"
                  required
                  placeholder="NRT 東京"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depart">出發日期</Label>
                <Input
                  id="depart"
                  type="date"
                  required
                  value={form.depart_date}
                  onChange={(e) => setForm({ ...form, depart_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ret">回程日期（可留空）</Label>
                <Input
                  id="ret"
                  type="date"
                  value={form.return_date}
                  onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="target">目標票價（TWD）</Label>
                <Input
                  id="target"
                  type="number"
                  min={0}
                  required
                  placeholder="12000"
                  value={form.target_price}
                  onChange={(e) => setForm({ ...form, target_price: e.target.value })}
                />
              </div>
              <Button type="submit" className="sm:col-span-2" disabled={addRoute.isPending}>
                加入追蹤
              </Button>
            </form>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold">追蹤中的航線</h2>
            {routes.isLoading ? (
              <p className="text-sm text-muted-foreground">載入中…</p>
            ) : (routes.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">還沒有追蹤航線，先新增一條吧。</p>
            ) : (
              (routes.data ?? []).map((r) => (
                <article
                  key={r.id}
                  className="surface-card flex items-center justify-between gap-4 rounded-2xl border border-border p-5"
                >
                  <div>
                    <div className="flex items-center gap-2 font-semibold">
                      {r.origin} <Plane className="size-4 text-accent" /> {r.destination}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.depart_date}
                      {r.return_date ? ` － ${r.return_date}` : ""}
                    </p>
                    <p className="mt-2 text-sm">
                      目標價 <span className="text-primary">${r.target_price}</span>
                      {r.current_price != null && (
                        <span className="ml-3 text-muted-foreground">目前 ${r.current_price}</span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="移除追蹤"
                    onClick={() => removeRoute.mutate(r.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BellRing className="size-4 text-primary" />
            <h2 className="text-base font-semibold">降價通知</h2>
            {unread > 0 && <Badge>{unread} 則新通知</Badge>}
          </div>
          {(alerts.data ?? []).length === 0 ? (
            <div className="surface-card rounded-2xl border border-border p-6 text-sm text-muted-foreground">
              目前還沒有降價通知。當追蹤航線的票價下降時，這裡會出現提醒。
            </div>
          ) : (
            (alerts.data ?? []).map((a) => (
              <article key={a.id} className="surface-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingDown className="size-4 text-success" />
                  {a.tracked_routes?.origin} → {a.tracked_routes?.destination}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  ${a.old_price} 降到 <span className="text-primary">${a.new_price}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("zh-TW")}
                </p>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
