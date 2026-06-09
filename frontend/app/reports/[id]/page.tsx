"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calendar, ChevronRight, Clock,
  Loader2, RefreshCw, Trash2,
} from "lucide-react";
import AuthGuard      from "@/components/AuthGuard";
import NavBar         from "@/components/NavBar";
import ReportViewer   from "@/components/ReportViewer";
import AgentProgress  from "@/components/AgentProgress";
import { Button }     from "@/components/ui/button";
import { Badge }      from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";

interface Report {
  id: number; topic: string;
  content: string | null; status: string;
  error_message: string | null;
  created_at: string; completed_at: string | null;
}

const STATUS_VARIANT: Record<string, any> = {
  completed: "completed", running: "running", pending: "pending", failed: "failed",
};

function fmtFull(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "long", day: "numeric",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ReportPage() {
  const { id }   = useParams() as { id: string };
  const router   = useRouter();
  const [report,   setReport]   = useState<Report | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(false);

  async function fetchReport() {
    try { const { data } = await api.get(`/api/reports/${id}`); setReport(data); }
    catch { router.push("/dashboard/history"); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (id) fetchReport(); }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this report permanently?")) return;
    setDeleting(true);
    try { await api.delete(`/api/reports/${id}`); router.push("/dashboard/history"); }
    catch { setDeleting(false); }
  }

  /* Loading skeleton */
  if (loading) return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="space-y-4">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="mt-8 rounded-xl border border-border p-8 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-4" style={{ width: `${70 + (i % 3) * 10}%` }} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );

  if (!report) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavBar />

        <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="animate-fade-in mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/dashboard/history" className="flex items-center gap-1 transition-colors hover:text-foreground">
              <ArrowLeft className="h-3 w-3" />History
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
            <span className="truncate max-w-[160px] sm:max-w-xs text-foreground/70">{report.topic}</span>
          </nav>

          {/* Report header */}
          <div className="animate-fade-up mb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[report.status]} className="capitalize">
                {report.status === "running" && (
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-accent animate-breathe" />
                )}
                {report.status}
              </Badge>
              {report.completed_at && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {fmtFull(report.completed_at)}
                </span>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-2xl leading-snug text-foreground sm:text-3xl">
                {report.topic}
              </h1>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="ghost" size="icon-sm" onClick={fetchReport}
                  aria-label="Refresh" className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={handleDelete} disabled={deleting}
                  className="gap-1.5 text-destructive hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                >
                  {deleting
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{deleting ? "Deleting…" : "Delete"}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Report body */}
          <Card className="animate-fade-up delay-100 shadow-card">
            <CardContent className="p-6 sm:p-8">
              {report.content ? (
                <ReportViewer content={report.content} topic={report.topic} />
              ) : (report.status === "running" || report.status === "pending") ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-secondary/40 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Agents are still working — this page will refresh automatically.
                    </p>
                  </div>
                  <AgentProgress status={report.status} />
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href="/dashboard">
                      <Clock className="h-3.5 w-3.5" />Watch live progress
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <p className="text-sm font-medium text-destructive">Research job failed</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    {report.error_message || "An unknown error occurred. Check your API keys and try again."}
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard">Try again</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  );
}
