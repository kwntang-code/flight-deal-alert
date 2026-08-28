import { createFileRoute, Link } from "@tanstack/react-router";
import { Plane, BellRing, LineChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "機票降價通知 | 追蹤航線，降價即時提醒" },
      {
        name: "description",
        content: "設定想飛的航線與目標票價，票價一降就通知你，不再錯過便宜機票。",
      },
      { property: "og:title", content: "機票降價通知 | 追蹤航線，降價即時提醒" },
      {
        property: "og:description",
        content: "設定想飛的航線與目標票價，票價一降就通知你，不再錯過便宜機票。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: Plane,
    title: "追蹤任何航線",
    text: "輸入出發地、目的地與日期，設定你能接受的目標票價。",
  },
  {
    icon: BellRing,
    title: "降價立刻通知",
    text: "票價跌破目標價，降價通知中心第一時間出現提醒。",
  },
  {
    icon: LineChart,
    title: "價格一目了然",
    text: "目前票價與目標價差距清楚呈現，決策不再猶豫。",
  },
  {
    icon: ShieldCheck,
    title: "資料只屬於你",
    text: "帳號登入保護，追蹤清單與通知僅本人可見。",
  },
];

function Index() {
  const { user } = useSession();

  return (
    <main className="min-h-screen surface-sky">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Plane className="size-5 text-primary" />
          飛價雷達
        </div>
        {user ? (
          <Button asChild>
            <Link to="/dashboard">前往我的追蹤</Link>
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button asChild variant="ghost">
              <Link to="/auth">登入</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">免費註冊</Link>
            </Button>
          </div>
        )}
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-20 text-center">
        <p className="text-sm font-medium tracking-[0.3em] text-primary uppercase">
          Flight Price Radar
        </p>
        <h1 className="mt-5 text-4xl leading-tight font-bold sm:text-6xl">
          機票降價，
          <span className="text-primary">馬上通知你</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          建立你的追蹤航線清單，設定目標票價。票價一往下走，我們就把降價通知送到你的通知中心。
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="glow-ring">
            <Link to={user ? "/dashboard" : "/auth"}>開始追蹤航線</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth">我已經有帳號</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-2">
        {features.map((f) => (
          <article key={f.title} className="surface-card rounded-2xl border border-border p-6">
            <f.icon className="size-6 text-accent" />
            <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
