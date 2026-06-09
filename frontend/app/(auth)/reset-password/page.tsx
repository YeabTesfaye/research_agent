"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

function ResetForm() {
  const router = useRouter();
  const token  = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  if (!token) return (
    <p className="text-sm text-center text-destructive py-4">
      Invalid reset link.{" "}
      <Link href="/forgot-password" className="underline">Request a new one.</Link>
    </p>
  );

  if (success) return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-subtle">
        <CheckCircle2 className="h-7 w-7 text-emerald" />
      </div>
      <div>
        <p className="font-semibold">Password updated</p>
        <p className="text-sm text-muted-foreground mt-1">Redirecting you to sign in…</p>
      </div>
    </div>
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, new_password: password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Link expired. Please request a new one.");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="animate-scale-in rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <div className="relative">
          <Input id="password" type={showPw ? "text" : "password"} placeholder="Min. 8 characters"
            value={password} onChange={e => setPassword(e.target.value)}
            required className="pr-10" autoFocus />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input id="confirm" type="password" placeholder="••••••••"
          value={confirm} onChange={e => setConfirm(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading} size="lg" className="w-full gap-2">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Updating…</> : "Update password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="text-center space-y-1.5">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
          <LockKeyhole className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="font-display text-3xl text-foreground">New password</h1>
        <p className="text-sm text-muted-foreground">Choose a strong password for your account</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Set new password</CardTitle>
          <CardDescription>Must be at least 8 characters long</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>}>
            <ResetForm />
          </Suspense>
        </CardContent>
        <CardFooter className="justify-center pb-6">
          <Link href="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
