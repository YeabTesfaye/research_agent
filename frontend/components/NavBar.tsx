"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { clearTokens } from "@/lib/auth";
import { useUserStore, getUserInitials } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  History, Plus, BookMarked, User, Settings,
  LogOut, ChevronDown, Sparkles,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",         label: "New research", icon: Plus },
  { href: "/dashboard/history", label: "History",      icon: History },
];

export default function NavBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, clearUser } = useUserStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleLogout() {
    clearTokens();
    clearUser();
    router.push("/login");
  }

  const initials = getUserInitials(user);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">

        {/* Brand */}
        <Link href="/dashboard" className="group flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
            <BookMarked className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <span className="hidden text-sm font-semibold tracking-tight sm:block">Research Agent</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all",
                  active ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={active ? 2.2 : 1.8} />{label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Mobile nav */}
          <div className="flex items-center gap-1 sm:hidden">
            {NAV.map(({ href, icon: Icon }) => (
              <Link key={href} href={href}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-all",
                  pathname === href ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/70"
                )}
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>

          <Separator orientation="vertical" className="h-5 hidden sm:block" />

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg p-1 pr-2 transition-all",
                "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                menuOpen && "bg-secondary"
              )}
              aria-label="User menu"
              aria-expanded={menuOpen}
            >
              <Avatar className="h-7 w-7">
                {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name ?? "Avatar"} />}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform hidden sm:block", menuOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border bg-card shadow-card-hover z-50 overflow-hidden animate-scale-in">
                {/* User info */}
                <div className="px-3.5 py-3 border-b border-border/50">
                  <p className="text-sm font-medium truncate">{user?.full_name || "Your Account"}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                </div>

                {/* Menu items */}
                <div className="p-1">
                  <Link href="/settings/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <User className="h-4 w-4" />Profile
                  </Link>
                  <Link href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />Settings
                  </Link>
                </div>

                <div className="p-1 border-t border-border/50">
                  <button onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/8"
                  >
                    <LogOut className="h-4 w-4" />Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
