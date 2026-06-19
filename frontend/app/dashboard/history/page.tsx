"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Clock, FileText, History,
  Loader2, Plus, RefreshCw, Trash2, Search,
  CheckCircle2, Timer, XCircle, Check, X,
} from "lucide-react";
import AuthGuard    from "@/components/AuthGuard";
import NavBar       from "@/components/NavBar";
import { Button }   from "@/components/ui/button";
import { Badge }    from "@/components/ui/badge";
import { Input }    from "@/components/ui/input";
import { toast } from "sonner";
import { reportsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Report {
  id: number; topic: string; status: string;
  created_at: string; completed_at: string | null;
}

const STATUS_META: Record<string, {
  variant: "completed"|"running"|"pending"|"failed";
  icon: React.ElementType;
  label: string;
}> = {
  completed: { variant: "completed", icon: CheckCircle2, label: "Completed" },
  running:   { variant: "running",   icon: Loader2,       label: "Running"   },
  pending:   { variant: "pending",   icon: Timer,         label: "Pending"   },
  failed:    { variant: "failed",    icon: XCircle,       label: "Failed"    },
};

// Static delay classes so Tailwind's compiler can see them (dynamic
// template strings like `delay-${n}` are invisible to the JIT scanner).
const ROW_DELAYS = ["delay-50", "delay-100", "delay-150", "delay-200", "delay-250"];

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4">
      <div className="skeleton h-9 w-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
      <div className="skeleton h-5 w-16 rounded-full" />
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [reports,    setReports]    = useState<Report[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [deleting,   setDeleting]   = useState<Set<number>>(new Set());
  const [confirmId,  setConfirmId]  = useState<number | null>(null);
  const [query,      setQuery]      = useState("");
  const [filter,     setFilter]     = useState<string>("all");
  const confirmTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await reportsApi.list();
      setReports(data);
    } catch {
      toast.error("Failed to load", { description: "Could not fetch your reports." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => () => { if (confirmTimer.current) clearTimeout(confirmTimer.current); }, []);

  /* ── Delete flow: click once to arm, click again within 3s to confirm ── */
  function handleDeleteClick(e: React.MouseEvent, id: number) {
    e.stopPropagation();

    if (confirmId !== id) {
      // First click — arm the confirm state
      setConfirmId(id);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmId(null), 3000);
      return;
    }

    // Second click within window — actually delete
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmId(null);
    performDelete(id);
  }

  function handleCancelConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setConfirmId(null);
  }

  async function performDelete(id: number) {
    const target = reports.find(r => r.id === id);
    setDeleting(p => new Set(p).add(id));
    try {
      await reportsApi.delete(id);
      setReports(p => p.filter(r => r.id !== id));
      toast.success("Report deleted", {
        description: target?.topic,
      });
    } catch {
      toast.error("Failed to delete", { description: "Please try again." });
    } finally {
      setDeleting(p => { const next = new Set(p); next.delete(id); return next; });
    }
  }

  function handleRowClick(r: Report) {
    if (confirmId === r.id) return; // don't navigate while confirm is armed
    if (r.status === "completed") router.push(`/reports/${r.id}`);
    else if (r.status === "running" || r.status === "pending") router.push("/dashboard");
  }

  // Filter + search
  const filtered = reports.filter(r => {
    const matchSearch = !query || r.topic.toLowerCase().includes(query.toLowerCase());
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = reports.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const FILTERS = [
    { key: "all",       label: "All",       count: reports.length },
    { key: "completed", label: "Completed", count: counts.completed || 0 },
    { key: "running",   label: "Active",    count: (counts.running || 0) + (counts.pending || 0) },
    { key: "failed",    label: "Failed",    count: counts.failed || 0 },
  ].filter(f => f.key === "all" || f.count > 0);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">

          {/* Header */}
          <div className="animate-fade-up mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h1 className="text-xl font-semibold tracking-tight">Research history</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {reports.length} {reports.length === 1 ? "report" : "reports"}
                {counts.completed ? ` · ${counts.completed} completed` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="icon-sm" onClick={fetchReports}
                disabled={loading} aria-label="Refresh" className="text-muted-foreground">
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/dashboard"><Plus className="h-3.5 w-3.5" />New</Link>
              </Button>
            </div>
          </div>

          {/* Search + filter */}
          {reports.length > 0 && (
            <div className="animate-fade-up delay-75 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search reports…"
                  value={query} onChange={e => setQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
                {FILTERS.map(({ key, label, count }) => (
                  <button key={key} onClick={() => setFilter(key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all",
                      filter === key
                        ? "border-primary/30 bg-secondary text-foreground shadow-sm"
                        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                    )}>
                    {label}
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px]",
                      filter === key ? "bg-background" : "bg-secondary"
                    )}>{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="animate-fade-up flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">No reports yet</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
                  Start your first research and it'll appear here.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href="/dashboard"><Plus className="h-3.5 w-3.5" />Start researching</Link>
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No reports match "{query}"</p>
              <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setFilter("all"); }}>
                Clear search
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((r, i) => {
                const meta = STATUS_META[r.status] ?? STATUS_META.pending;
                const clickable = r.status === "completed" || r.status === "running" || r.status === "pending";
                const isDeleting = deleting.has(r.id);
                const isConfirming = confirmId === r.id;

                return (
                  <li key={r.id}
                    onClick={() => handleRowClick(r)}
                    className={cn(
                      "group animate-fade-up relative flex items-center gap-3.5 rounded-xl border bg-card p-4",
                      "transition-all duration-200",
                      i < ROW_DELAYS.length && ROW_DELAYS[i],
                      clickable && !isConfirming && "cursor-pointer hover:border-border/80 hover:shadow-card-hover",
                      isDeleting && "opacity-50 pointer-events-none",
                      r.status === "failed" && !isConfirming && "opacity-70",
                      isConfirming
                        ? "border-destructive/40 bg-destructive/[0.03] ring-1 ring-destructive/15"
                        : "border-border"
                    )}
                  >
                    {/* Left icon */}
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary transition-colors",
                      r.status === "completed" && !isConfirming && "group-hover:bg-emerald-subtle/60",
                      isConfirming && "bg-destructive/10"
                    )}>
                      {isConfirming
                        ? <Trash2 className="h-4 w-4 text-destructive" />
                        : <FileText className="h-4 w-4 text-muted-foreground" />}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      {isConfirming ? (
                        <p className="text-sm font-medium leading-snug text-destructive">
                          Delete this report? This can't be undone.
                        </p>
                      ) : (
                        <>
                          <p className="truncate text-sm font-medium leading-snug">{r.topic}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                              <Clock className="h-2.5 w-2.5 shrink-0" />
                              {fmtRelative(r.created_at)}
                            </span>
                            {r.completed_at && r.status === "completed" && (
                              <span className="hidden text-xs text-muted-foreground/50 sm:block">
                                · done {fmtRelative(r.completed_at)}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Status + actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {isConfirming ? (
                        <>
                          {/* Cancel */}
                          <button
                            onClick={handleCancelConfirm}
                            aria-label="Cancel delete"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          {/* Confirm */}
                          <button
                            onClick={e => handleDeleteClick(e, r.id)}
                            disabled={isDeleting}
                            aria-label="Confirm delete"
                            className="flex h-7 items-center gap-1 rounded-md bg-destructive px-2.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                          >
                            {isDeleting
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Check className="h-3 w-3" />}
                            {isDeleting ? "Deleting…" : "Confirm"}
                          </button>
                        </>
                      ) : (
                        <>
                          <Badge variant={meta.variant} className="capitalize text-[10px] py-0 h-5 hidden sm:inline-flex">
                            {r.status === "running" && (
                              <span className="mr-0.5 h-1.5 w-1.5 rounded-full bg-accent animate-breathe inline-block" />
                            )}
                            {meta.label}
                          </Badge>
                          <button
                            onClick={e => handleDeleteClick(e, r.id)}
                            disabled={isDeleting}
                            aria-label={`Delete "${r.topic}"`}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40",
                              "transition-all opacity-0 group-hover:opacity-100",
                              "hover:bg-destructive/8 hover:text-destructive",
                              "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            )}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          {r.status === "completed" && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                          )}
                        </>
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