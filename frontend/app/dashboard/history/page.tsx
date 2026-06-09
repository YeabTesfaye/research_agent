"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Clock, FileText, History,
  Loader2, Plus, RefreshCw, Trash2,
} from "lucide-react";
import AuthGuard   from "@/components/AuthGuard";
import NavBar      from "@/components/NavBar";
import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface Report {
  id: number; topic: string; status: string;
  created_at: string; completed_at: string | null;
}

const STATUS_VARIANT: Record<string, "completed"|"running"|"pending"|"failed"> = {
  completed: "completed", running: "running", pending: "pending", failed: "failed",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return fmt(iso);
}

export default function HistoryPage() {
  const router = useRouter();
  const [reports,  setReports]  = useState<Report[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function fetchReports() {
    setLoading(true);
    try { const { data } = await api.get("/api/reports/"); setReports(data); }
    catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { fetchReports(); }, []);

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setDeleting(id);
    try { await api.delete(`/api/reports/${id}`); setReports(p => p.filter(r => r.id !== id)); }
    catch {}
    finally { setDeleting(null); }
  }

  function handleRowClick(r: Report) {
    if (r.status === "completed") router.push(`/reports/${r.id}`);
    else if (r.status === "running" || r.status === "pending") router.push("/dashboard");
  }

  const completed = reports.filter(r => r.status === "completed").length;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">

          {/* Header */}
          <div className="animate-fade-up mb-8 flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h1 className="text-xl font-semibold tracking-tight">Research history</h1>
              </div>
              {!loading && (
                <p className="text-sm text-muted-foreground">
                  {reports.length} {reports.length === 1 ? "report" : "reports"}
                  {completed > 0 && ` · ${completed} completed`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" onClick={fetchReports}
                disabled={loading} aria-label="Refresh" className="text-muted-foreground">
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/dashboard"><Plus className="h-3.5 w-3.5" />New</Link>
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Loading reports…</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="animate-fade-up flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">No reports yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start your first research and it'll appear here.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href="/dashboard"><Plus className="h-3.5 w-3.5" />Start researching</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {reports.map((r, i) => {
                const variant  = STATUS_VARIANT[r.status] ?? "pending";
                const clickable = r.status === "completed" || r.status === "running" || r.status === "pending";

                return (
                  <li
                    key={r.id}
                    onClick={() => handleRowClick(r)}
                    className={cn(
                      "group animate-fade-up relative flex items-center gap-3.5 rounded-xl border border-border bg-card p-4",
                      "transition-all duration-200",
                      i === 0 && "delay-75",  i === 1 && "delay-100",
                      i === 2 && "delay-150", i === 3 && "delay-200",
                      clickable && "cursor-pointer hover:border-border/80 hover:shadow-card-hover",
                      !clickable && "opacity-60 cursor-default"
                    )}
                  >
                    {/* Icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium leading-snug">{r.topic}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant={variant} className="capitalize text-[10px] py-0 h-4">
                          {r.status === "running" && (
                            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-accent animate-breathe inline-block" />
                          )}
                          {r.status}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                          <Clock className="h-2.5 w-2.5" />
                          {fmtRelative(r.created_at)}
                        </span>
                        {r.completed_at && (
                          <span className="hidden text-xs text-muted-foreground/50 sm:block">
                            · Completed {fmt(r.completed_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={e => handleDelete(e, r.id)}
                        disabled={deleting === r.id}
                        aria-label="Delete report"
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md",
                          "text-muted-foreground/40 transition-all",
                          "opacity-0 group-hover:opacity-100",
                          "hover:bg-destructive/8 hover:text-destructive",
                          "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                      >
                        {deleting === r.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                      {r.status === "completed" && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform duration-150 group-hover:translate-x-0.5" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
