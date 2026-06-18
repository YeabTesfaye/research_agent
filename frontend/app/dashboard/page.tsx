"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Loader2, Search, BookOpen, Brain, PenLine,
  Sparkles, Zap, Clock, FileCheck, AlertCircle, RefreshCw,
} from "lucide-react";
import AuthGuard     from "@/components/AuthGuard";
import NavBar        from "@/components/NavBar";
import AgentProgress from "@/components/AgentProgress";
import { Button }    from "@/components/ui/button";
import { Textarea }  from "@/components/ui/textarea";
import { Badge }     from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

/* ── Environment detection ─────────────────────────────────────── */
const IS_DEV  = process.env.NODE_ENV === "development";
const LLM_TAG = IS_DEV ? "Ollama (local)" : "Gemini 2.5 Flash";
const LLM_ETA = IS_DEV ? "8–12 min"       : "2–4 min";

/* ── Static data ────────────────────────────────────────────────── */
const EXAMPLES = [
  "AI trends in healthcare 2025",
  "RAG systems in production",
  "Climate tech investment landscape",
  "The future of remote work",
  "Quantum computing progress in 2025",
  "State of open source AI models",
];

const PIPELINE = [
  { icon: Search,   label: "Researcher", blurb: "Finds 5+ authoritative sources via Tavily",      color: "bg-blue-50 text-blue-600 border-blue-100"    },
  { icon: BookOpen, label: "Reader",     blurb: "Extracts facts and citations from every source",  color: "bg-violet-50 text-violet-600 border-violet-100" },
  { icon: Brain,    label: "Analyst",    blurb: "Synthesises trends, patterns and contradictions", color: "bg-amber-50 text-amber-600 border-amber-100"   },
  { icon: PenLine,  label: "Writer",     blurb: "Formats a structured markdown report with refs",  color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
];

/* ── Types ──────────────────────────────────────────────────────── */
interface ActiveReport {
  id: number;
  status: string;
  topic: string;
  currentAgent?: string | null;
  error?: string;
}

/* ── Component ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const [topic,        setTopic]   = useState("");
  const [loading,      setLoading] = useState(false);
  const [error,        setError]   = useState("");
  const [activeReport, setActive]  = useState<ActiveReport | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  /* ── Polling ── */
  function startPolling(id: number, t: string) {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/reports/${id}`);

        setActive({
          id:           data.id,
          status:       data.status,
          topic:        t,
          currentAgent: data.current_agent ?? null,
          error:        data.error_message ?? data.error ?? undefined,
        });

        if (data.status === "completed") {
          clearInterval(pollRef.current!);
          router.push(`/reports/${id}`);
        } else if (data.status === "failed") {
          setError(data.error_message ?? "The research pipeline failed.");
          clearInterval(pollRef.current!);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail ?? "Lost connection while checking status.");
        clearInterval(pollRef.current!);
      }
    }, IS_DEV ? 8000 : 5000); // poll less aggressively when Ollama is slow
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = topic.trim();
    if (!t || t.length < 3) { setError("Please enter at least 3 characters."); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/api/reports/", { topic: t });
      setActive({ id: data.id, status: data.status, topic: data.topic });
      setTopic("");
      startPolling(data.id, data.topic);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Failed to start research. Try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Reset ── */
  function handleReset() {
    if (pollRef.current) clearInterval(pollRef.current);
    setActive(null);
    setError("");
    setTopic("");
  }

  /* ── Render ── */
  const isRunning = activeReport?.status === "running" || activeReport?.status === "pending";
  const isFailed  = activeReport?.status === "failed";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">

          {!activeReport ? (
            /* ══════════════════════════════════════════
               IDLE — topic input
            ══════════════════════════════════════════ */
            <div className="space-y-10">

              {/* Hero */}
              <div className="animate-fade-up space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-medium text-muted-foreground">Multi-agent research pipeline</span>
                  </div>
                  {/* LLM mode badge */}
                  <div className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
                    IS_DEV
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                  )}>
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      IS_DEV ? "bg-amber-500" : "bg-blue-500"
                    )} />
                    <span className="text-xs font-medium">{LLM_TAG}</span>
                  </div>
                </div>

                <h1 className="font-display text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
                  What should we<br />
                  <em className="text-accent not-italic">research?</em>
                </h1>
                <p className="max-w-md text-base text-muted-foreground leading-relaxed">
                  Four AI agents search the web, read sources, synthesize insights, and write a cited
                  report — powered by <strong className="text-foreground">{LLM_TAG}</strong>, typically in{" "}
                  <strong className="text-foreground">{LLM_ETA}</strong>.
                </p>
              </div>

              {/* Input */}
              <div className="animate-fade-up delay-100 space-y-3">
                <form onSubmit={handleSubmit}>
                  <Card className="shadow-card-hover transition-shadow duration-300 hover:shadow-card-hover">
                    <CardContent className="p-0">
                      <Textarea
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="e.g. AI trends in healthcare 2025, fusion energy progress, venture capital in 2025…"
                        rows={4}
                        className="resize-none rounded-t-xl rounded-b-none border-0 border-b border-border/50 bg-transparent px-5 py-4 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <div className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{LLM_ETA}</span>
                          <span className="flex items-center gap-1"><Zap className="h-3 w-3" />4 agents</span>
                          <span className="flex items-center gap-1"><FileCheck className="h-3 w-3" />Cited report</span>
                        </div>
                        <Button
                          type="submit"
                          disabled={loading || topic.trim().length < 3}
                          size="sm"
                          className="gap-1.5"
                        >
                          {loading
                            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Starting…</>
                            : <>Research <ArrowRight className="h-3.5 w-3.5" /></>}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  {error && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
                    </p>
                  )}
                </form>

                {/* Example chips */}
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map(ex => (
                    <button
                      key={ex} type="button" onClick={() => setTopic(ex)}
                      className={cn(
                        "rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-xs text-muted-foreground",
                        "transition-all duration-150 hover:border-border hover:bg-secondary hover:text-foreground",
                        "active:scale-[0.97]",
                        topic === ex && "border-accent/40 bg-accent/8 text-accent"
                      )}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pipeline cards */}
              <div className="animate-fade-up delay-200">
                <div className="mb-4 flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">The pipeline</span>
                  <Separator className="flex-1" />
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {PIPELINE.map(({ icon: Icon, label, blurb, color }, i) => (
                    <div
                      key={label}
                      className={cn(
                        "animate-fade-up flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-card",
                        "hover:shadow-card-hover transition-shadow duration-200",
                        i === 0 && "delay-200",
                        i === 1 && "delay-250",
                        i === 2 && "delay-300",
                        i === 3 && "delay-400",
                      )}
                    >
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border text-sm", color)}>
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{blurb}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dev-mode notice */}
              {IS_DEV && (
                <div className="animate-fade-up delay-300 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
                  <p className="text-xs font-medium text-amber-700">
                    🛠 Development mode — using Ollama ({process.env.NEXT_PUBLIC_OLLAMA_MODEL ?? "llama3.2"}) locally.
                    Reports may take 8–12 minutes. Switch to production for Gemini speed.
                  </p>
                </div>
              )}
            </div>

          ) : (
            /* ══════════════════════════════════════════
               ACTIVE — progress view
            ══════════════════════════════════════════ */
            <div className="animate-scale-in space-y-5">

              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {isRunning && (
                    <Badge variant="running" className="gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent animate-breathe" />
                      In progress
                    </Badge>
                  )}
                  {isFailed && (
                    <Badge variant="destructive" className="gap-1.5">
                      Failed
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {isRunning
                      ? `Polling every ${IS_DEV ? "8" : "5"} s · ${LLM_TAG}`
                      : isFailed ? "Pipeline stopped" : ""}
                  </span>
                </div>

                <h2 className="font-display text-2xl leading-snug text-foreground sm:text-3xl">
                  {activeReport.topic}
                </h2>

                {isRunning && (
                  <p className="text-sm text-muted-foreground">
                    {IS_DEV
                      ? `Running locally via Ollama — this takes ${LLM_ETA}. The report will open automatically.`
                      : "Four agents are working. Your report will open automatically when ready."}
                  </p>
                )}
              </div>

              {/* Agent progress card */}
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <AgentProgress
                    status={activeReport.status}
                    currentAgent={activeReport.currentAgent}
                  />
                </CardContent>
              </Card>

              {/* Dev-mode slow warning */}
              {IS_DEV && isRunning && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
                  <p className="text-xs text-amber-700">
                    🛠 Running on Ollama locally. Each agent takes 2–3 min on CPU.
                    In production this would take ~2 min with Gemini.
                  </p>
                </div>
              )}

              {/* Error state */}
              {isFailed && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 space-y-1">
                  <p className="text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Pipeline failed
                  </p>
                  <p className="text-xs text-destructive/70 ml-6">
                    {activeReport.error ?? error ?? (
                      IS_DEV
                        ? "Check that Ollama is running and your TAVILY_API_KEY is set."
                        : "Check your Gemini and Tavily API keys, then try again."
                    )}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/history")}
                  className="gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5" />
                  View history
                </Button>

                {(isFailed || isRunning) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {isFailed ? "Try again" : "Start over"}
                  </Button>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}