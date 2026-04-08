import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api, ensureCsrf } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/layout/AuthShell";

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await ensureCsrf();
      await api.post("/api/auth/accept-invite", { token, password, name });
      await qc.invalidateQueries({ queryKey: ["me"] });
      navigate("/");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err && err.response
        ? (err.response as { data?: { error?: string } }).data?.error
        : null;
      setError(msg ?? "Failed to accept invite");
    }
  }

  if (!token) {
    return (
      <AuthShell
        title="Invalid invitation"
        description="This invitation link is missing a token. Open the link from your email or request a new invite."
      >
        <div className="text-center text-sm text-muted-foreground">
          Missing invitation token.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Accept invitation"
      description="Create your account to join the workspace."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Johnson"
            autoComplete="name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
