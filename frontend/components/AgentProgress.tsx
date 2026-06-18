"use client";
import { cn } from "@/lib/utils";
import {
  Search, BookOpen, Brain, PenLine,
  CheckCircle2, Clock, Loader2, XCircle,
} from "lucide-react";

interface AgentDef {
  key: string;
  name: string;
  role: string;
  description: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  spinnerClass: string;
  doneClass: string;
  iconBg: string;
}

const AGENTS: AgentDef[] = [
  {
    key: "researcher",
    name: "Researcher",
    role: "Web search",
    description: "Queries Tavily to find 5+ authoritative sources — academic papers, official reports, and industry publications.",
    Icon: Search,
    spinnerClass: "text-blue-500",
    doneClass: "text-emerald",
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    key: "reader",
    name: "Reader",
    role: "Content extraction",
    description: "Reads every source in full, extracting key facts, data points, and quotes with precise source attribution.",
    Icon: BookOpen,
    spinnerClass: "text-violet-500",
    doneClass: "text-emerald",
    iconBg: "bg-violet-50 text-violet-600",
  },
  {
    key: "analyst",
    name: "Analyst",
    role: "Synthesis",
    description: "Cross-references all sources to surface trends, consensus, contradictions, and gaps the individual sources miss.",
    Icon: Brain,
    spinnerClass: "text-amber-500",
    doneClass: "text-emerald",
    iconBg: "bg-amber-50 text-amber-600",
  },
  {
    key: "writer",
    name: "Writer",
    role: "Report writing",
    description: "Composes a structured markdown report with an executive summary, inline citations, and a numbered references list.",
    Icon: PenLine,
    spinnerClass: "text-emerald",
    doneClass: "text-emerald",
    iconBg: "bg-emerald-50 text-emerald-600",
  },
];

interface Props {
  status: string;
}

export default function AgentProgress({ status }: Props) {
  const isDone   = status === "completed";
  const isFailed = status === "failed";
  const isActive = status === "running" || status === "pending";

  return (
    <div className="space-y-2.5">
      {AGENTS.map((agent, i) => {
        const { Icon, name, role, description, spinnerClass, doneClass, iconBg } = agent;

        return (
          <div
            key={agent.key}
            className={cn(
              "relative flex items-start gap-3.5 rounded-xl border p-4 transition-all duration-300",
              "animate-fade-up",
              i === 0 && "delay-75",
              i === 1 && "delay-150",
              i === 2 && "delay-200",
              i === 3 && "delay-250",
              isDone   && "border-emerald/20 bg-emerald-subtle/25",
              isFailed && "border-border bg-background opacity-60",
              isActive && "border-border bg-card shadow-card",
              !isDone && !isFailed && !isActive && "border-border/50 bg-background"
            )}
          >
            {/* Status icon */}
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all",
              isDone   && "bg-emerald/10",
              isFailed && "bg-secondary",
              isActive && iconBg,
              !isDone && !isFailed && !isActive && "bg-secondary"
            )}>
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-emerald" strokeWidth={2} />
              ) : isActive ? (
                <Loader2 className={cn("h-4 w-4 animate-spin", spinnerClass)} strokeWidth={2} />
              ) : (
                <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
              )}
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className={cn(
                  "text-sm font-semibold leading-none tracking-tight",
                  isDone ? "text-emerald" : "text-foreground"
                )}>
                  {name}
                </span>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="text-xs text-muted-foreground">{role}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>

            {/* Status indicator */}
            <div className="shrink-0 flex items-center gap-1 pt-0.5">
              {isDone && <span className="text-xs font-medium text-emerald">Done</span>}
              {isActive && (
                <span className="flex gap-[3px] items-center">
                  {[0, 1, 2].map((d) => (
                    <span key={d}
                      className="h-1 w-1 rounded-full bg-accent animate-breathe"
                      style={{ animationDelay: `${d * 220}ms` }} />
                  ))}
                </span>
              )}
              {!isDone && !isActive && (
                <Clock className="h-3.5 w-3.5 text-muted-foreground/30" />
              )}
            </div>

            {/* Animated bottom bar when active */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden bg-secondary">
                <div className="h-full animate-progress-indeterminate rounded-full bg-gradient-to-r from-accent/40 via-accent to-accent/40" />
              </div>
            )}
          </div>
        );
      })}

      {isActive && (
        <p className="animate-fade-in text-center text-xs text-muted-foreground pt-1">
          Polling every 5 s — reports typically take 3–5 minutes.
        </p>
      )}

      {isFailed && (
        <div className="animate-fade-in rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm font-medium text-destructive flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0" />Research job failed
          </p>
          <p className="text-xs text-destructive/70 mt-1 ml-6">
            Check your OpenAI and Tavily API keys, then try again.
          </p>
        </div>
      )}
    </div>
  );
}
