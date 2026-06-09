import Link from "next/link";
import { BookMarked } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal auth header */}
      <header className="flex h-14 items-center px-6 border-b border-border/40">
        <Link href="/login" className="flex items-center gap-2.5 transition-opacity hover:opacity-75">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm">
            <BookMarked className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-semibold tracking-tight">Research Agent</span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground/50">
        Powered by CrewAI · OpenAI · Tavily
      </footer>
    </div>
  );
}
