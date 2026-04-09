import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  CenteredFormPage,
  FormBackLink,
} from "@/components/layout/CenteredFormPage";

export function PlatformTenantCreatePage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  function slugify(value: string) {
    const s = value
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    return s || "tenant";
  }

  const create = useMutation({
    mutationFn: () =>
      api.post<{ tenant: { id: string }; inviteLink?: string }>(
        "/api/platform/tenants",
        { name, slug: slugify(name), adminEmail },
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tenants"], exact: false });
      setName("");
      setAdminEmail("");
      toast.success("Tenant created");
    },
    onError: (e) => {
      const msg = isAxiosError(e)
        ? (e.response?.data?.error?.message ??
          e.response?.data?.error ??
          e.message)
        : "Could not create tenant";
      toast.error(String(msg));
    },
  });

  return (
    <CenteredFormPage
      title="Create Company"
      description="Provision a new company and generate an invitation link for its admin."
      back={
        <FormBackLink to="/platform/tenants">
          Back to companies list
        </FormBackLink>
      }
    >
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">Company name</Label>
            <Input
              id="tenant-name"
              value={name}
              placeholder="e.g. Acme Corporation"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-admin-email">Admin email (invitation)</Label>
            <Input
              id="tenant-admin-email"
              type="email"
              value={adminEmail}
              placeholder="e.g. admin@acme.com"
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-end border-t border-border pt-6">
          <Button type="submit" disabled={create.isPending}>
            Create & send invite
          </Button>
        </div>
      </form>
    </CenteredFormPage>
  );
}
