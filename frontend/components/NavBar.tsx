"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { clearTokens } from "@/lib/auth";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    clearTokens();
    router.push("/login");
  };

  return (
    <header className="border-b border-[#e8e8e3] bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#1a1a18] rounded-md flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5"/>
              <path d="M4 7h6M7 4v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#1a1a18]">
            Research Agent
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              pathname === "/dashboard"
                ? "bg-[#f0f0eb] text-[#1a1a18] font-medium"
                : "text-[#6b6b66] hover:text-[#1a1a18] hover:bg-[#f5f5f2]"
            }`}
          >
            New research
          </Link>
          <Link
            href="/dashboard/history"
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              pathname === "/dashboard/history"
                ? "bg-[#f0f0eb] text-[#1a1a18] font-medium"
                : "text-[#6b6b66] hover:text-[#1a1a18] hover:bg-[#f5f5f2]"
            }`}
          >
            History
          </Link>
          <div className="w-px h-4 bg-[#e8e8e3] mx-1" />
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-md text-sm text-[#6b6b66] hover:text-[#1a1a18] hover:bg-[#f5f5f2] transition-colors"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
