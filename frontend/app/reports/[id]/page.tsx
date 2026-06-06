"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import NavBar from "@/components/NavBar";
import ReportViewer from "@/components/ReportViewer";
import api from "@/lib/api";

interface Report {
  id: number;
  topic: string;
  content: string | null;
  status: string;
  error_message: string | null;
  job_id: string;
  created_at: string;
  completed_at: string | null;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await api.get(`/api/reports/${id}`);
        setReport(data);
      } catch {
        router.push("/dashboard/history");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/api/reports/${id}`);
      router.push("/dashboard/history");
    } catch {
      setDeleting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#f9f9f7]">
          <NavBar />
          <div className="flex items-center justify-center py-24">
            <div className="w-5 h-5 border-2 border-[#d0d0c8] border-t-[#1a1a18] rounded-full animate-spin" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!report) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f9f9f7]">
        <NavBar />
        <main className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href="/dashboard/history"
                  className="text-xs text-[#9b9b96] hover:text-[#1a1a18] transition-colors"
                >
                  History
                </Link>
                <span className="text-[#c0c0bb] text-xs">/</span>
                <span className="text-xs text-[#6b6b66] truncate">{report.topic}</span>
              </div>
              <h1 className="text-xl font-semibold text-[#1a1a18] leading-snug">
                {report.topic}
              </h1>
              {report.completed_at && (
                <p className="text-xs text-[#9b9b96] mt-1">
                  Completed {formatDate(report.completed_at)}
                </p>
              )}
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#993c1d] border border-[#f5c4b3] rounded-lg hover:bg-[#fdf0eb] disabled:opacity-50 transition-colors flex-shrink-0"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 3h9M5 3V2h3v1M4 3v7a1 1 0 001 1h3a1 1 0 001-1V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>

          <div className="bg-white border border-[#e8e8e3] rounded-2xl p-8">
            {report.content ? (
              <ReportViewer content={report.content} topic={report.topic} />
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[#6b6b66]">
                  {report.status === "failed"
                    ? `Report failed: ${report.error_message || "Unknown error"}`
                    : "Report is still being generated…"}
                </p>
                {(report.status === "running" || report.status === "pending") && (
                  <Link
                    href="/dashboard"
                    className="text-sm text-[#1a1a18] font-medium mt-2 inline-block hover:underline"
                  >
                    View progress
                  </Link>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
