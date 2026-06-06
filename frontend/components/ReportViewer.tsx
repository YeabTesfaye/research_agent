"use client";
import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
  topic: string;
}

export default function ReportViewer({ content, topic }: Props) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-medium text-[#6b6b66]">Research report</h2>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#1a1a18] border border-[#d0d0c8] rounded-md hover:bg-[#f0f0eb] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Download .md
        </button>
      </div>

      <div className="prose-report">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
