"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { storeTokens } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      storeTokens(data.access_token, data.refresh_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Incorrect email or password.");
    } finally { setLoading(false); }
  }

  return (
    <div className="animate-fade-up space-y-6">
      {/* Heading */}
      <div className="text-center space-y-1.5">
        <h1 className="font-display text-3xl text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your Research Agent account</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your email and password below</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="animate-scale-in rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" autoFocus
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-3 hover:text-foreground hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password" className="pr-10"
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full mt-2 gap-2">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</>
                : <><span>Sign in</span><ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pt-2 pb-6">
          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="font-medium text-foreground underline-offset-3 hover:underline">
              Create one free
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
