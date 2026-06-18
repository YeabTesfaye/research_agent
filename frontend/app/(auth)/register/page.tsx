"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authApi }  from "@/lib/api";
import { storeTokens } from "@/lib/auth";
import { useUserStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { ok: password.length >= 8,         label: "8+ chars" },
    { ok: /[A-Z]/.test(password),        label: "Uppercase" },
    { ok: /[0-9]/.test(password),        label: "Number" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "Symbol" },
  ];
  const score = checks.filter(c => c.ok).length;
  const barColor = score <= 1 ? "bg-destructive" : score <= 2 ? "bg-amber" : "bg-emerald";
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300",
            i < score ? barColor : "bg-secondary")} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map(({ ok, label }) => (
          <span key={label} className={cn("flex items-center gap-0.5 text-xs transition-colors",
            ok ? "text-emerald" : "text-muted-foreground/40")}>
            <CheckCircle2 className="h-3 w-3" />{label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const params = useSearchParams();
  const wasDeleted = params.get("deleted") === "1";

  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const pwMatch    = password && confirm && password === confirm;
  const pwMismatch = confirm && password !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await authApi.register(email, password, fullName || undefined);
      const { data: tokens } = await authApi.login(email, password);
      storeTokens(tokens.access_token, tokens.refresh_token);
      const { data: user } = await authApi.me();
      setUser(user);
      router.push("/dashboard");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") setError(detail);
      else if (Array.isArray(detail)) setError(detail[0]?.msg || "Validation failed.");
      else setError("Registration failed. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div className="animate-fade-up space-y-6">
      {wasDeleted && (
        <Alert variant="info">
          <AlertDescription>Your account was deleted. Create a new one below.</AlertDescription>
        </Alert>
      )}
      <div className="text-center space-y-1.5">
        <h1 className="font-display text-3xl text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground">Start researching with four AI agents</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Get started</CardTitle>
          <CardDescription>Free to use — no credit card required</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <Alert variant="destructive" className="animate-scale-in">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Full name <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </Label>
              <Input id="name" placeholder="Jane Smith" value={fullName}
                onChange={e => setFullName(e.target.value)} autoComplete="name" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  autoComplete="new-password" className="pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <StrengthBar password={password} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" placeholder="••••••••" value={confirm}
                onChange={e => setConfirm(e.target.value)} required autoComplete="new-password"
                className={cn(pwMismatch && "border-destructive", pwMatch && "border-emerald/40")} />
              {pwMismatch && <p className="text-xs text-destructive">Passwords don't match</p>}
              {pwMatch && <p className="text-xs text-emerald flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Looks good!</p>}
            </div>
            <Button type="submit" disabled={loading || !email || !password || !!pwMismatch} size="lg" className="w-full mt-2 gap-2">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</>
                : <><span>Create account</span><ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center pt-2 pb-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-3 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
