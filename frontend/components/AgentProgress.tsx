"use client";

type AgentStatus = "waiting" | "running" | "done";

interface AgentStep {
  name: string;
  role: string;
  description: string;
  icon: string;
}

const AGENTS: AgentStep[] = [
  {
    name: "Researcher",
    role: "Finding sources",
    description: "Searching the web for credible, recent sources via Tavily",
    icon: "🔍",
  },
  {
    name: "Reader",
    role: "Extracting content",
    description: "Reading each source and extracting key facts with citations",
    icon: "📖",
  },
  {
    name: "Analyst",
    role: "Synthesizing insights",
    description: "Finding trends, contradictions, and cross-source patterns",
    icon: "🧠",
  },
  {
    name: "Writer",
    role: "Writing report",
    description: "Formatting everything into a structured markdown report",
    icon: "✍️",
  },
];

interface Props {
  status: string;
}

function getAgentStatus(reportStatus: string, agentIndex: number): AgentStatus {
  if (reportStatus === "pending") return "waiting";
  if (reportStatus === "failed") return agentIndex === 0 ? "running" : "waiting";
  if (reportStatus === "completed") return "done";
  // running — animate through agents based on index
  // We can't know exactly which agent is running without websockets,
  // so we show a rolling animation
  return "running";
}

export default function AgentProgress({ status }: Props) {
  const isActive = status === "running" || status === "pending";

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-[#1a1a18]">Agent pipeline</p>
        <span className="text-xs text-[#9b9b96]">~3–5 min</span>
      </div>

      <div className="space-y-2">
        {AGENTS.map((agent, i) => {
          const isDone = status === "completed";
          const isFailed = status === "failed";
          const isRunning = status === "running" || status === "pending";

          return (
            <div
              key={agent.name}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                isDone
                  ? "border-[#c0dda0] bg-[#f0f7e8]"
                  : isFailed && i === 0
                  ? "border-[#f5c4b3] bg-[#fdf0eb]"
                  : isRunning
                  ? "border-[#e8e8e3] bg-white"
                  : "border-[#e8e8e3] bg-[#f9f9f7]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center text-sm flex-shrink-0 ${
                  isDone
                    ? "bg-[#d4edba]"
                    : isRunning
                    ? "bg-[#f0f0eb]"
                    : "bg-[#f0f0eb]"
                }`}
              >
                {isDone ? "✓" : agent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-[#1a1a18]">{agent.name}</span>
                  <span className="text-xs text-[#9b9b96]">·</span>
                  <span className="text-xs text-[#6b6b66]">{agent.role}</span>
                </div>
                <p className="text-xs text-[#9b9b96] leading-relaxed">{agent.description}</p>
              </div>
              <div className="flex-shrink-0 flex items-center">
                {isDone && (
                  <span className="text-xs text-[#3b6d11] font-medium">Done</span>
                )}
                {isRunning && (
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map((dot) => (
                      <div
                        key={dot}
                        className="w-1 h-1 rounded-full bg-[#888780] animate-bounce"
                        style={{ animationDelay: `${dot * 0.15}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {status === "running" || status === "pending" ? (
        <p className="mt-3 text-xs text-[#9b9b96] text-center">
          Polling for updates every 5 seconds…
        </p>
      ) : null}

      {status === "failed" && (
        <div className="mt-3 px-3 py-2 bg-[#fdf0eb] border border-[#f5c4b3] rounded-lg">
          <p className="text-xs text-[#993c1d]">
            Research job failed. Check your API keys and try again.
          </p>
        </div>
      )}
    </div>
  );
}
