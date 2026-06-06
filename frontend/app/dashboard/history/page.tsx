"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import api from "@/lib/api";
import NavBar from "@/components/NavBar";
interface ReportSummary {
  id: number;
  topic: string;
  status: string;
  job_id: string;
  created_at: string;
  completed_at: string | null;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  completed: { label: "Completed", classes: "bg-[#f0f7e8] text-[#3b6d11]" },
  running: { label: "Running", classes: "bg-[#e6f1fb] text-[#185fa5]" },
  pending: { label: "Pending", classes: "bg-[#f9f9f7] text-[#6b6b66]" },
  failed: { label: "Failed", classes: "bg-[#fdf0eb] text-[#993c1d]" },
};

export default function HistoryPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await api.get("/api/reports/");
        setReports(data);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f9f9f7]">
        <NavBar />
        <main className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-semibold text-[#1a1a18]">Research history</h1>
              <p className="text-sm text-[#9b9b96] mt-0.5">
                {reports.length} report{reports.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1a1a18] text-white text-sm font-medium rounded-lg hover:bg-[#2a2a26] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v11M1 6.5h11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              New research
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-[#d0d0c8] border-t-[#1a1a18] rounded-full animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#d0d0c8] rounded-2xl">
              <div className="text-3xl mb-3">📄</div>
              <p className="text-sm font-medium text-[#1a1a18] mb-1">No reports yet</p>
              <p className="text-sm text-[#9b9b96] mb-4">
                Start your first research to see it here
              </p>
              <Link
                href="/dashboard"
                className="text-sm text-[#1a1a18] font-medium underline hover:no-underline"
              >
                Start researching
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => {
                const sc = statusConfig[r.status] || statusConfig.pending;
                return (
                  <div
                    key={r.id}
                    onClick={() =>
                      r.status === "completed"
                        ? router.push(`/reports/${r.id}`)
                        : r.status === "running" || r.status === "pending"
                        ? router.push("/dashboard")
                        : null
                    }
                    className={`flex items-center justify-between p-4 bg-white border border-[#e8e8e3] rounded-xl transition-colors ${
                      r.status === "completed"
                        ? "hover:border-[#c0c0bb] cursor-pointer"
                        : r.status === "running" || r.status === "pending"
                        ? "hover:border-[#c0c0bb] cursor-pointer"
                        : "opacity-75"
                    }`}
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-[#1a1a18] truncate mb-0.5">
                        {r.topic}
                      </p>
                      <p className="text-xs text-[#9b9b96]">
                        {formatDate(r.created_at)}
                        {r.completed_at && ` · ${formatDate(r.completed_at)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sc.classes}`}>
                        {sc.label}
                      </span>
                      {r.status === "completed" && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#c0c0bb]">
                          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
