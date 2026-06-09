"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { storeTokens } from "@/lib/auth";
import { cn } from "@/lib/utils";

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { label: "8+ characters",  pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number",          pass: /\d/.test(password) },
  ];
  return (
    <div className="flex gap-2 mt-1.5">
      {checks.map(({ label, pass }) => (
        <div key={label} className="flex items-center gap-1">
          <CheckCircle2 className={cn("h-3 w-3 transition-colors", pass ? "text-emerald" : "text-muted-foreground/30")} />
          <span className={cn("text-xs transition-colors", pass ? "text-emerald" : "text-muted-foreground/50")}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName]           = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirm]     = useState("");
  const [showPw, setShowPw]               = useState(false);
  const [error, setError]                 = useState("");
  const [loading, setLoading]             = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/register", { email, password, full_name: fullName || undefined });
      const { data } = await api.post("/api/auth/login", { email, password });
      storeTokens(data.access_token, data.refresh_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <div className="text-center space-y-1.5">
        <h1 className="font-display text-3xl text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground">Start researching with four AI agents</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Get started</CardTitle>
          <CardDescription>Fill in your details to create a free account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="animate-scale-in rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Full name <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </Label>
              <Input id="name" type="text" placeholder="Jane Smith"
                value={fullName} onChange={e => setFullName(e.target.value)}
                autoComplete="name" autoFocus />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password" type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="new-password" className="pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                  aria-label={showPw ? "Hide" : "Show"}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" placeholder="••••••••"
                value={confirmPassword} onChange={e => setConfirm(e.target.value)}
                required autoComplete="new-password" />
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full mt-2 gap-2">
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
