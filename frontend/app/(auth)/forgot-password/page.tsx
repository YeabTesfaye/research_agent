"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { await api.post("/api/auth/forgot-password", { email }); } catch {}
    setLoading(false); setSubmitted(true);
  }

  return (
    <div className="animate-fade-up space-y-6">
      <div className="text-center space-y-1.5">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
          <Mail className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="font-display text-3xl text-foreground">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          {submitted ? "Check your inbox for the reset link." : "Enter your email to receive a reset link."}
        </p>
      </div>

      <Card>
        {submitted ? (
          <>
            <CardContent className="pt-6 pb-2">
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-subtle">
                  <CheckCircle2 className="h-7 w-7 text-emerald" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Email sent</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If <strong>{email}</strong> has an account, you'll get a reset link shortly.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    Check your spam folder if it doesn't arrive within a few minutes.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-center pb-6">
              <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline underline-offset-3">
                <ArrowLeft className="h-3.5 w-3.5" />Back to sign in
              </Link>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="pb-4">
              <CardTitle>Forgot password?</CardTitle>
              <CardDescription>Enter your email and we'll send a reset link.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    required autoFocus />
                </div>
                <Button type="submit" disabled={loading} size="lg" className="w-full gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : "Send reset link"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center pb-6">
              <Link href="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />Back to sign in
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
