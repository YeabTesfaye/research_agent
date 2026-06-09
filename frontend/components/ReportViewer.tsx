"use client";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, FileText } from "lucide-react";

interface Props { content: string; topic: string; }

export default function ReportViewer({ content, topic }: Props) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.replace(/[^a-z0-9]+/gi, "_").toLowerCase().slice(0, 60)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return (
    <div>
      {/* Report meta bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Research report
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              ≈{wordCount.toLocaleString()} words
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" />
          Download .md
        </Button>
      </div>

      <Separator className="mb-8" />

      {/* Rendered markdown */}
      <div className="prose-report">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
