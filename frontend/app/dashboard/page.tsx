"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import NavBar from "@/components/NavBar";
import AgentProgress from "@/components/AgentProgress";
import api from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeReport, setActiveReport] = useState<{
    id: number;
    status: string;
    topic: string;
  } | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const clearPoll = () => {
    if (pollRef.current) clearInterval(pollRef.current);
  };

  useEffect(() => {
    return () => clearPoll();
  }, []);

  const pollReport = (id: number, topicStr: string) => {
    clearPoll();
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/reports/${id}`);
        setActiveReport({ id: data.id, status: data.status, topic: topicStr });
        if (data.status === "completed") {
          clearPoll();
          router.push(`/reports/${id}`);
        } else if (data.status === "failed") {
          clearPoll();
        }
      } catch {
        clearPoll();
      }
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || topic.trim().length < 3) {
      setError("Please enter a topic with at least 3 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/reports/", { topic: topic.trim() });
      setActiveReport({ id: data.id, status: data.status, topic: data.topic });
      setTopic("");
      pollReport(data.id, data.topic);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Failed to start research. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const exampleTopics = [
    "AI trends in healthcare 2025",
    "RAG systems in production",
    "Climate tech investment landscape",
    "The future of remote work",
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f9f9f7]">
        <NavBar />
        <main className="max-w-2xl mx-auto px-6 py-12">
          {!activeReport ? (
            <>
              <div className="mb-10">
                <h1 className="text-2xl font-semibold text-[#1a1a18] mb-2">
                  What do you want to research?
                </h1>
                <p className="text-sm text-[#9b9b96]">
                  Four specialized AI agents will search the web, read sources, analyze findings,
                  and write a structured report — in about 3–5 minutes.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="bg-white border border-[#e8e8e3] rounded-2xl p-4 mb-3">
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. AI trends in healthcare 2025, latest developments in fusion energy, the state of venture capital in 2025…"
                    rows={3}
                    className="w-full text-sm text-[#1a1a18] placeholder-[#c0c0bb] resize-none outline-none bg-transparent leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0f0eb]">
                    <span className="text-xs text-[#c0c0bb]">
                      {topic.length} chars
                    </span>
                    <button
                      type="submit"
                      disabled={loading || !topic.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-[#1a1a18] text-white text-sm font-medium rounded-lg hover:bg-[#2a2a26] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                          Starting…
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 1v8M4 6l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 11h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          Run research
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-[#993c1d] mb-3">{error}</p>
                )}
              </form>

              <div>
                <p className="text-xs text-[#c0c0bb] mb-2">Try an example</p>
                <div className="flex flex-wrap gap-2">
                  {exampleTopics.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className="px-3 py-1.5 text-xs text-[#6b6b66] bg-white border border-[#e8e8e3] rounded-full hover:border-[#1a1a18] hover:text-[#1a1a18] transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-3">
                {[
                  { icon: "🔍", label: "Researcher", desc: "Searches Tavily for 5+ credible sources" },
                  { icon: "📖", label: "Reader", desc: "Extracts key facts from each source" },
                  { icon: "🧠", label: "Analyst", desc: "Synthesizes cross-source insights" },
                  { icon: "✍️", label: "Writer", desc: "Formats a structured markdown report" },
                ].map((a) => (
                  <div key={a.label} className="bg-white border border-[#e8e8e3] rounded-xl p-3.5">
                    <div className="text-lg mb-2">{a.icon}</div>
                    <p className="text-sm font-medium text-[#1a1a18] mb-0.5">{a.label}</p>
                    <p className="text-xs text-[#9b9b96] leading-relaxed">{a.desc}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              <div className="mb-6">
                <p className="text-xs text-[#9b9b96] uppercase tracking-wide font-medium mb-1">
                  Researching
                </p>
                <h2 className="text-lg font-semibold text-[#1a1a18]">
                  {activeReport.topic}
                </h2>
              </div>

              <div className="bg-white border border-[#e8e8e3] rounded-2xl p-5 mb-4">
                <AgentProgress status={activeReport.status} />
              </div>

              {activeReport.status !== "failed" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#f9f9f7] border border-[#e8e8e3] rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3b6d11] animate-pulse" />
                  <p className="text-xs text-[#6b6b66]">
                    Your report will open automatically when ready. You can also check{" "}
                    <button
                      onClick={() => router.push("/dashboard/history")}
                      className="text-[#1a1a18] underline"
                    >
                      history
                    </button>{" "}
                    later.
                  </p>
                </div>
              )}

              {activeReport.status === "failed" && (
                <button
                  onClick={() => setActiveReport(null)}
                  className="w-full py-2.5 text-sm text-[#1a1a18] border border-[#e8e8e3] rounded-lg hover:bg-[#f0f0eb] transition-colors"
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
