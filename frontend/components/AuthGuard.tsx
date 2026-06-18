"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useUserStore } from "@/lib/store";
import { authApi } from "@/lib/api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    // Fetch user if not cached
    if (!user) {
      authApi.me()
        .then(({ data }) => { setUser(data); setReady(true); })
        .catch(() => { router.replace("/login"); });
    } else {
      setReady(true);
    }
  }, [router, user, setUser]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 rounded-full border-2 border-border border-t-accent animate-spin" />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
