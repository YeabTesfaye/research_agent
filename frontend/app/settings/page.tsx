"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Shield, Bell, Trash2,
  Camera, CheckCircle2, Loader2, AlertTriangle,
  Settings2, ChevronRight, Save,
} from "lucide-react";
import { Button }      from "@/components/ui/button";
import { Input }       from "@/components/ui/input";
import { Label }       from "@/components/ui/label";
import { Textarea }    from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator }   from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch }      from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge }       from "@/components/ui/badge";
import { authApi }     from "@/lib/api";
import { clearTokens } from "@/lib/auth";
import { useUserStore, getUserInitials } from "@/lib/store";
import { cn }          from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

/* ─── Password strength UI ─── */
function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { ok: password.length >= 8,         label: "8+ chars" },
    { ok: /[A-Z]/.test(password),        label: "Uppercase" },
    { ok: /[0-9]/.test(password),        label: "Number" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "Symbol" },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["bg-destructive", "bg-destructive", "bg-amber", "bg-amber", "bg-emerald"];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-300",
            i < score ? colors[score] : "bg-secondary")} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map(({ ok, label }) => (
          <span key={label} className={cn("flex items-center gap-1 text-xs transition-colors",
            ok ? "text-emerald" : "text-muted-foreground/50")}>
            <CheckCircle2 className="h-3 w-3" />{label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Profile Tab ─── */
function ProfileTab() {
  const { user, updateUser } = useUserStore();
  const [name, setName]       = useState(user?.full_name ?? "");
  const [bio, setBio]         = useState(user?.bio ?? "");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  async function handleSave() {
    setError(""); setSaving(true);
    try {
      const { data } = await authApi.updateProfile({ full_name: name || undefined, bio: bio || undefined });
      updateUser(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save changes.");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile photo</CardTitle>
          <CardDescription>Your avatar is shown across the app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16 text-lg">
                {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">{user?.full_name || "Your Name"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
              <div className="mt-2 flex gap-2">
                {user?.is_verified
                  ? <Badge variant="completed" className="text-[10px]"><CheckCircle2 className="h-2.5 w-2.5" />Verified</Badge>
                  : <Badge variant="amber" className="text-[10px]">Unverified</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal information</CardTitle>
          <CardDescription>Update your name and bio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {saved && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Profile saved successfully.</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-display">Email address</Label>
              <Input id="email-display" value={user?.email ?? ""} readOnly
                className="bg-secondary/40 cursor-default" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell us a little about yourself…" rows={3} maxLength={500} />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                : saved ? <><CheckCircle2 className="h-3.5 w-3.5" />Saved!</>
                : <><Save className="h-3.5 w-3.5" />Save changes</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            {[
              { label: "Member since", value: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—" },
              { label: "Last sign in",  value: user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Security Tab ─── */
function SecurityTab() {
  const [current,  setCurrent]  = useState("");
  const [newPw,    setNewPw]    = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCurr, setShowCurr] = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  const pwMatch = newPw && confirm && newPw === confirm;
  const pwMismatch = confirm && newPw !== confirm;

  async function handleChange() {
    if (!current || !newPw || !confirm) { setError("Please fill in all fields."); return; }
    if (newPw !== confirm) { setError("Passwords do not match."); return; }
    setError(""); setSaving(true);
    try {
      await authApi.changePassword(current, newPw);
      setSaved(true);
      setCurrent(""); setNewPw(""); setConfirm("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to change password.");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
          <CardDescription>Choose a strong password you don't use elsewhere</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {saved && <Alert variant="success"><CheckCircle2 className="h-4 w-4" /><AlertDescription>Password changed successfully.</AlertDescription></Alert>}

          <div className="space-y-1.5">
            <Label htmlFor="curr-pw">Current password</Label>
            <div className="relative">
              <Input id="curr-pw" type={showCurr ? "text" : "password"}
                value={current} onChange={e => setCurrent(e.target.value)}
                placeholder="••••••••" className="pr-10" autoComplete="current-password" />
              <button type="button" onClick={() => setShowCurr(!showCurr)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showCurr ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-pw">New password</Label>
            <div className="relative">
              <Input id="new-pw" type={showNew ? "text" : "password"}
                value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="Min. 8 characters" className="pr-10" autoComplete="new-password" />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <StrengthBar password={newPw} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="conf-pw">Confirm new password</Label>
            <Input id="conf-pw" type="password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••" autoComplete="new-password"
              className={cn(pwMismatch && "border-destructive focus-visible:ring-destructive/30",
                pwMatch && "border-emerald/40 focus-visible:ring-emerald/20")} />
            {pwMismatch && <p className="text-xs text-destructive">Passwords don't match</p>}
            {pwMatch && <p className="text-xs text-emerald flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Passwords match</p>}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleChange} disabled={saving || !current || !newPw || !!pwMismatch} className="gap-1.5">
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Updating…</> : "Update password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active sessions</CardTitle>
          <CardDescription>Devices currently signed in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Current session</p>
              <p className="text-xs text-muted-foreground mt-0.5">This browser · Active now</p>
            </div>
            <Badge variant="completed" className="text-xs">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Notifications Tab ─── */
function NotificationsTab() {
  const { user, updateUser } = useUserStore();
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  const prefs = {
    email_notifications:  user?.email_notifications  ?? true,
    report_complete_email: user?.report_complete_email ?? true,
    weekly_digest:         user?.weekly_digest         ?? false,
  };

  async function toggle(key: keyof typeof prefs) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setSaving(true); setError("");
    try {
      const { data } = await authApi.updatePreferences({ [key]: !prefs[key] });
      updateUser(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save preferences.");
    } finally { setSaving(false); }
  }

  const ITEMS = [
    { key: "email_notifications"  as const, title: "Email notifications", desc: "Receive emails about your account activity" },
    { key: "report_complete_email" as const, title: "Report complete",    desc: "Get an email when your research report is ready" },
    { key: "weekly_digest"         as const, title: "Weekly digest",       desc: "A summary of your research activity each week" },
  ];

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {saved && <Alert variant="success"><CheckCircle2 className="h-4 w-4" /><AlertDescription>Preferences saved.</AlertDescription></Alert>}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email preferences</CardTitle>
          <CardDescription>Choose which emails you'd like to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border/50">
          {ITEMS.map(({ key, title, desc }) => (
            <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch
                checked={prefs[key]}
                onCheckedChange={() => toggle(key)}
                disabled={saving}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Danger Zone Tab ─── */
function DangerTab() {
  const { user } = useUserStore();
  const router = useRouter();
  const [password, setPassword]   = useState("");
  const [confirm,  setConfirm]    = useState("");
  const [deleting, setDeleting]   = useState(false);
  const [error,    setError]      = useState("");
  const [open,     setOpen]       = useState(false);

  async function handleDelete() {
    if (confirm !== "DELETE") { setError('Please type "DELETE" to confirm.'); return; }
    setError(""); setDeleting(true);
    try {
      await authApi.deleteAccount(password);
      clearTokens();
      router.push("/register?deleted=1");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete account.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Actions in this section are irreversible. Please proceed carefully.
        </AlertDescription>
      </Alert>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Delete account</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated reports. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!open ? (
            <Button variant="destructive" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />Delete my account
            </Button>
          ) : (
            <div className="space-y-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive font-medium">This will permanently delete:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Your account and profile</li>
                <li>All research reports</li>
                <li>All account preferences</li>
              </ul>

              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <div className="space-y-1.5">
                <Label htmlFor="del-pw">Confirm your password</Label>
                <Input id="del-pw" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Your current password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="del-confirm">Type <strong>DELETE</strong> to confirm</Label>
                <Input id="del-confirm" value={confirm}
                  onChange={e => setConfirm(e.target.value)} placeholder="DELETE" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setOpen(false); setError(""); }}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}
                  disabled={deleting || !password || confirm !== "DELETE"} className="gap-1.5">
                  {deleting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Deleting…</> : "Permanently delete account"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Main Settings Page ─── */
const TABS = [
  { value: "profile",       label: "Profile",       icon: User },
  { value: "security",      label: "Security",      icon: Shield },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "danger",        label: "Danger zone",   icon: Trash2 },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">Manage your account, security, and preferences</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto mb-6 overflow-x-auto">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value}>
              <Icon className={cn("h-3.5 w-3.5", value === "danger" && tab === "danger" && "text-destructive")} />
              <span className={cn(value === "danger" && tab === "danger" && "text-destructive")}>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile"><ProfileTab /></TabsContent>
        <TabsContent value="security"><SecurityTab /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        <TabsContent value="danger"><DangerTab /></TabsContent>
      </Tabs>
    </main>
  );
}
