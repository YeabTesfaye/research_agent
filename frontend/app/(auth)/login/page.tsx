"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowRight, BookMarked } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authApi }  from "@/lib/api";
import { storeTokens } from "@/lib/auth";
import { useUserStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data: tokens } = await authApi.login(email, password);
      storeTokens(tokens.access_token, tokens.refresh_token);
      // Pre-fetch user into store so AuthGuard doesn't re-fetch
      const { data: user } = await authApi.me();
      setUser(user);
      router.push("/dashboard");
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 429) setError("Too many login attempts. Please wait a few minutes.");
      else if (status === 403) setError("Your account has been disabled. Contact support.");
      else setError("Incorrect email or password.");
    } finally { setLoading(false); }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <div className="text-center space-y-1.5">
        <h1 className="font-display text-3xl text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue researching</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your credentials below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <Alert variant="destructive" className="animate-scale-in">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" autoFocus
                disabled={loading} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-3 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPw ? "text" : "password"}
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password" className="pr-10"
                  disabled={loading} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                  aria-label={showPw ? "Hide password" : "Show password"} tabIndex={-1}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading || !email || !password} size="lg" className="w-full gap-2 mt-2">
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
