"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { clearTokens } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, History, Plus, BookMarked } from "lucide-react";

const NAV = [
  { href: "/dashboard",         label: "New research", icon: Plus },
  { href: "/dashboard/history", label: "History",      icon: History },
];

export default function NavBar() {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">

        {/* Brand */}
        <Link
          href="/dashboard"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm transition-transform group-hover:scale-105">
            <BookMarked className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <span className="hidden text-sm font-semibold tracking-tight sm:block">
            Research Agent
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden sm:flex items-center gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all duration-150",
                  active
                    ? "bg-secondary text-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Mobile nav icons */}
          <div className="flex items-center gap-1 sm:hidden">
            {NAV.map(({ href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition-all",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>

          <Separator orientation="vertical" className="h-5 hidden sm:block" />

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => { clearTokens(); router.push("/login"); }}
            aria-label="Sign out"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
