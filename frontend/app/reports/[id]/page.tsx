"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calendar, ChevronRight, Clock,
  Loader2, RefreshCw, Trash2, Download, Copy,
  Check, ExternalLink, BookOpen, AlignLeft,
} from "lucide-react";
import AuthGuard      from "@/components/AuthGuard";
import NavBar         from "@/components/NavBar";
import AgentProgress  from "@/components/AgentProgress";
import { Button }     from "@/components/ui/button";
import { Badge }      from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

/* ── Minimal markdown renderer (no external dep) ────────────────── */
import ReactMarkdown from "react-markdown";
import remarkGfm     from "remark-gfm";
import rehypeRaw     from "rehype-raw";

interface Report {
  id: number;
  topic: string;
  content: string | null;
  status: string;
  current_agent?: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

interface TocEntry { id: string; text: string; level: number; }

const STATUS_VARIANT: Record<string, any> = {
  completed: "completed", running: "running",
  pending: "pending",     failed: "failed",
};

function fmtFull(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "long", day: "numeric",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function fmtReadTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  const mins  = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function extractToc(content: string): TocEntry[] {
  const lines = content.split("\n");
  const toc: TocEntry[] = [];
  for (const line of lines) {
    const m = line.match(/^(#{1,3})\s+(.+)/);
    if (m) {
      const text = m[2].replace(/\*\*|__|`/g, "").trim();
      toc.push({ id: slugify(text), text, level: m[1].length });
    }
  }
  return toc;
}

/* ── Markdown components ────────────────────────────────────────── */
function makeComponents(onExternalLink: (url: string) => void) {
  return {
    h1: ({ children, ...props }: any) => {
      const text = String(children).replace(/\s+/g, " ").trim();
      return (
        <h1 id={slugify(text)}
          className="scroll-mt-24 font-display text-2xl sm:text-3xl font-semibold text-foreground mt-0 mb-4 leading-tight"
          {...props}>{children}</h1>
      );
    },
    h2: ({ children, ...props }: any) => {
      const text = String(children).replace(/\s+/g, " ").trim();
      return (
        <h2 id={slugify(text)}
          className="scroll-mt-24 font-display text-xl font-semibold text-foreground mt-10 mb-3 pb-2 border-b border-border/50 leading-snug"
          {...props}>{children}</h2>
      );
    },
    h3: ({ children, ...props }: any) => {
      const text = String(children).replace(/\s+/g, " ").trim();
      return (
        <h3 id={slugify(text)}
          className="scroll-mt-24 text-base font-semibold text-foreground mt-7 mb-2 leading-snug"
          {...props}>{children}</h3>
      );
    },
    p: ({ children }: any) => (
      <p className="text-[15px] leading-relaxed text-foreground/85 mb-4">{children}</p>
    ),
    a: ({ href, children }: any) => {
      if (!href) return <span>{children}</span>;
      const isExternal = href.startsWith("http");
      if (isExternal) {
        return (
          <button
            onClick={() => onExternalLink(href)}
            className="inline-flex items-center gap-0.5 text-accent underline underline-offset-2 decoration-accent/40 hover:decoration-accent transition-all cursor-pointer"
          >
            {children}
            <ExternalLink className="h-3 w-3 shrink-0 ml-0.5 opacity-60" />
          </button>
        );
      }
      return (
        <Link href={href} className="text-accent underline underline-offset-2 decoration-accent/40 hover:decoration-accent transition-all">
          {children}
        </Link>
      );
    },
    ul: ({ children }: any) => (
      <ul className="my-3 space-y-1.5 pl-5 list-disc marker:text-accent/50">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="my-3 space-y-1.5 pl-5 list-decimal marker:text-muted-foreground">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="text-[15px] leading-relaxed text-foreground/85">{children}</li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-2 border-accent/40 pl-4 py-1 my-5 italic text-muted-foreground bg-secondary/30 rounded-r-lg">
        {children}
      </blockquote>
    ),
    code: ({ inline, children }: any) =>
      inline ? (
        <code className="px-1.5 py-0.5 rounded text-[13px] font-mono bg-secondary text-foreground/90 border border-border/40">
          {children}
        </code>
      ) : (
        <pre className="my-5 overflow-x-auto rounded-xl border border-border/40 bg-secondary/60 p-4">
          <code className="text-[13px] font-mono text-foreground/85 leading-relaxed">{children}</code>
        </pre>
      ),
    strong: ({ children }: any) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-foreground/80">{children}</em>
    ),
    hr: () => <hr className="my-8 border-border/40" />,
    table: ({ children }: any) => (
      <div className="my-5 overflow-x-auto rounded-xl border border-border/40">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-secondary/60 text-left">{children}</thead>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-2.5 font-medium text-foreground border-b border-border/40">{children}</th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-2.5 text-foreground/80 border-b border-border/20">{children}</td>
    ),
  };
}

/* ── Table of contents ──────────────────────────────────────────── */
function TableOfContents({ toc, activeId }: { toc: TocEntry[]; activeId: string }) {
  if (toc.length < 3) return null;
  return (
    <nav aria-label="Table of contents" className="space-y-0.5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
        Contents
      </p>
      {toc.map((entry) => (
        <a
          key={entry.id}
          href={`#${entry.id}`}
          className={cn(
            "block rounded-md px-2 py-1 text-xs transition-all duration-150",
            entry.level === 1 && "font-medium",
            entry.level === 2 && "pl-3",
            entry.level === 3 && "pl-5 text-muted-foreground/70",
            activeId === entry.id
              ? "bg-accent/8 text-accent"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(entry.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {entry.text.length > 42 ? entry.text.slice(0, 42) + "…" : entry.text}
        </a>
      ))}
    </nav>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */
export default function ReportPage() {
  const { id }    = useParams() as { id: string };
  const router    = useRouter();

  const [report,   setReport]   = useState<Report | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [activeId, setActiveId] = useState("");
  const [showToc,  setShowToc]  = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /* ── Fetch ── */
  const fetchReport = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/reports/${id}`);
      setReport(data);
    } catch {
      router.push("/dashboard/history");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  /* ── Poll while running ── */
  useEffect(() => {
    if (!report) return;
    if (report.status === "running" || report.status === "pending") {
      pollRef.current = setInterval(fetchReport, 6000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [report?.status, fetchReport]);

  useEffect(() => { if (id) fetchReport(); }, [id]);

  /* ── Active heading via IntersectionObserver ── */
  useEffect(() => {
    if (!report?.content) return;
    const headings = contentRef.current?.querySelectorAll("h1,h2,h3") ?? [];
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId(e.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [report?.content]);

  /* ── Actions ── */
  async function handleDelete() {
    if (!confirm("Delete this report permanently?")) return;
    setDeleting(true);
    try { await api.delete(`/api/reports/${id}`); router.push("/dashboard/history"); }
    catch { setDeleting(false); }
  }

  function handleCopy() {
    if (!report?.content) return;
    navigator.clipboard.writeText(report.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!report?.content) return;
    const blob = new Blob([report.content], { type: "text/markdown" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${report.topic.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExternalLink(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  /* ── Derived ── */
  const toc       = report?.content ? extractToc(report.content) : [];
  const readTime  = report?.content ? fmtReadTime(report.content) : null;
  const isRunning = report?.status === "running" || report?.status === "pending";

  /* ── Loading skeleton ── */
  if (loading) return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="space-y-4">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="mt-8 rounded-xl border border-border p-8 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton h-4" style={{ width: `${65 + (i % 4) * 8}%` }} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );

  if (!report) return null;

  const mdComponents = makeComponents(handleExternalLink);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <NavBar />

        <main className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">

          {/* ── Breadcrumb ── */}
          <nav aria-label="Breadcrumb"
            className="animate-fade-in mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/dashboard/history"
              className="flex items-center gap-1 transition-colors hover:text-foreground">
              <ArrowLeft className="h-3 w-3" />History
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
            <span className="truncate max-w-[200px] sm:max-w-sm text-foreground/70">{report.topic}</span>
          </nav>

          {/* ── Header ── */}
          <div className="animate-fade-up mb-8 space-y-4">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANT[report.status]} className="capitalize">
                {report.status === "running" && (
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent animate-breathe" />
                )}
                {report.status}
              </Badge>
              {report.completed_at && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />{fmtFull(report.completed_at)}
                </span>
              )}
              {readTime && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />{readTime}
                </span>
              )}
            </div>

            {/* Title + actions */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-2xl leading-snug text-foreground sm:text-3xl">
                {report.topic}
              </h1>

              {report.content && (
                <div className="flex shrink-0 items-center gap-1.5">
                  {/* TOC toggle (mobile) */}
                  <Button
                    variant="ghost" size="icon-sm"
                    onClick={() => setShowToc(v => !v)}
                    aria-label="Toggle contents"
                    className={cn(
                      "text-muted-foreground hover:text-foreground lg:hidden",
                      showToc && "bg-secondary text-foreground"
                    )}
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </Button>

                  {/* Copy markdown */}
                  <Button
                    variant="ghost" size="icon-sm"
                    onClick={handleCopy}
                    aria-label="Copy markdown"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copied
                      ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                      : <Copy className="h-3.5 w-3.5" />}
                  </Button>

                  {/* Download .md */}
                  <Button
                    variant="ghost" size="icon-sm"
                    onClick={handleDownload}
                    aria-label="Download as .md"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>

                  {/* Refresh */}
                  <Button
                    variant="ghost" size="icon-sm"
                    onClick={fetchReport}
                    aria-label="Refresh"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>

                  {/* Delete */}
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
              )}
            </div>
          </div>

          {/* ── Mobile TOC ── */}
          {showToc && toc.length > 0 && (
            <div className="animate-fade-up mb-6 rounded-xl border border-border/60 bg-card p-4 lg:hidden">
              <TableOfContents toc={toc} activeId={activeId} />
            </div>
          )}

          {/* ── Body layout: sidebar TOC + content ── */}
          <div className="flex gap-8">

            {/* Desktop sidebar TOC */}
            {toc.length > 2 && (
              <aside className="hidden lg:block w-52 shrink-0">
                <div className="sticky top-24 rounded-xl border border-border/40 bg-card p-4">
                  <TableOfContents toc={toc} activeId={activeId} />
                </div>
              </aside>
            )}

            {/* Content */}
            <div className="min-w-0 flex-1">
              <Card className="animate-fade-up delay-100 shadow-card">
                <CardContent className="p-6 sm:p-8">

                  {/* ── Completed report ── */}
                  {report.content ? (
                    <>
                      {/* Source count badge */}
                      {(() => {
                        const refs = (report.content.match(/https?:\/\/[^\s\)\"]+/g) ?? []);
                        const unique = new Set(refs).size;
                        return unique > 0 ? (
                          <div className="mb-6 flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/40 px-4 py-2.5">
                            <BookOpen className="h-3.5 w-3.5 text-accent shrink-0" />
                            <span className="text-xs text-muted-foreground">
                              Based on <strong className="text-foreground">{unique} sources</strong> — links open in a new tab
                            </span>
                          </div>
                        ) : null;
                      })()}

                      {/* Rendered markdown */}
                      <div ref={contentRef} className="prose-report">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={mdComponents as any}
                        >
                          {report.content}
                        </ReactMarkdown>
                      </div>

                      {/* Footer actions */}
                      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-6">
                        <p className="text-xs text-muted-foreground">
                          Generated {report.completed_at ? fmtFull(report.completed_at) : ""}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? "Copied!" : "Copy markdown"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
                            <Download className="h-3.5 w-3.5" />Download .md
                          </Button>
                        </div>
                      </div>
                    </>

                  /* ── Still running ── */
                  ) : isRunning ? (
                    <div className="space-y-5">
                      <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-secondary/40 px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          Agents are working — this page refreshes automatically every 6 seconds.
                        </p>
                      </div>
                      <AgentProgress
                        status={report.status}
                        currentAgent={report.current_agent}
                      />
                      <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <Link href="/dashboard">
                          <Clock className="h-3.5 w-3.5" />Watch live progress
                        </Link>
                      </Button>
                    </div>

                  /* ── Failed ── */
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-destructive">Research job failed</p>
                        <p className="max-w-sm text-xs text-muted-foreground">
                          {report.error_message ?? "An unknown error occurred. Check your API keys and try again."}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard">Try again</Link>
                      </Button>
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>
          </div>

        </main>
      </div>
    </AuthGuard>
  );
}