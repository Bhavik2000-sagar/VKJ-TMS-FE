import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { api } from "@/api/client";
import { useMe, useHasPermission } from "@/hooks/useAuth";
import { useTheme, type ThemePreference } from "@/providers/theme-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";

export function SettingsPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canRoles = useHasPermission("role.manage", me);
  const canOrg = useHasPermission("org.manage", me);
  const { preference, setPreference } = useTheme();

  const { data: roles, isError: rolesError } = useQuery({
    queryKey: ["tenant-roles"],
    queryFn: async () => {
      const { data } = await api.get<{ roles: unknown[] }>("/api/tenant/roles");
      return data.roles;
    },
    enabled: Boolean(canRoles),
  });

  type Branch = { id: string; name: string; code: string | null };
  type Department = {
    id: string;
    name: string;
    code: string | null;
    branchId: string | null;
    branch?: { id: string; name: string } | null;
  };

  const { data: branches } = useQuery({
    queryKey: ["org-branches"],
    queryFn: async () => {
      const { data } = await api.get<{ branches: Branch[] }>(
        "/api/org/branches",
      );
      return data.branches;
    },
    enabled: Boolean(canOrg),
  });

  const { data: departments } = useQuery({
    queryKey: ["org-departments"],
    queryFn: async () => {
      const { data } = await api.get<{ departments: Department[] }>(
        "/api/org/departments",
      );
      return data.departments;
    },
    enabled: Boolean(canOrg),
  });

  const branchesById = useMemo(() => {
    const map = new Map<string, Branch>();
    for (const b of branches ?? []) map.set(b.id, b);
    return map;
  }, [branches]);

  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptBranchId, setDeptBranchId] = useState<string | null>(null);

  const createBranch = useMutation({
    mutationFn: async () =>
      api.post("/api/org/branches", {
        name: branchName.trim(),
        code: branchCode.trim() ? branchCode.trim() : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-branches"] });
      setBranchName("");
      setBranchCode("");
      toast.success("Branch created");
    },
    onError: (e) => {
      toast.error(
        isAxiosError(e)
          ? (e.response?.data?.error?.message ?? e.message)
          : "Failed",
      );
    },
  });

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/org/branches/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-branches"] });
      qc.invalidateQueries({ queryKey: ["org-departments"] });
      toast.success("Branch deleted");
    },
    onError: (e) => {
      toast.error(
        isAxiosError(e)
          ? (e.response?.data?.error?.message ?? e.message)
          : "Failed",
      );
    },
  });

  const createDepartment = useMutation({
    mutationFn: async () =>
      api.post("/api/org/departments", {
        name: deptName.trim(),
        code: deptCode.trim() ? deptCode.trim() : null,
        branchId: deptBranchId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-departments"] });
      setDeptName("");
      setDeptCode("");
      setDeptBranchId(null);
      toast.success("Department created");
    },
    onError: (e) => {
      toast.error(
        isAxiosError(e)
          ? (e.response?.data?.error?.message ?? e.message)
          : "Failed",
      );
    },
  });

  const deleteDepartment = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/org/departments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-departments"] });
      toast.success("Department deleted");
    },
    onError: (e) => {
      toast.error(
        isAxiosError(e)
          ? (e.response?.data?.error?.message ?? e.message)
          : "Failed",
      );
    },
  });

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight uppercase text-primary">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Workspace and account preferences
        </p>
      </div>

      <Tabs defaultValue="preferences" className="w-full max-w-3xl">
        <TabsList variant="pills">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          {canRoles ? (
            <TabsTrigger value="roles">Roles & permissions</TabsTrigger>
          ) : null}
          {canOrg ? (
            <TabsTrigger value="org">Branches & departments</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="preferences" className="mt-4 outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Choose how TMS looks on this device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={preference}
                onValueChange={(v) => setPreference(v as ThemePreference)}
              >
                <SelectTrigger id="theme" className="w-full max-w-xs">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System default</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                System follows your OS light or dark mode. Default for new
                visits is dark.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {canRoles ? (
          <TabsContent value="roles" className="mt-4 outline-none">
            <Card>
              <CardHeader>
                <CardTitle>Roles & permissions</CardTitle>
                <CardDescription>
                  Raw role configuration from the API.
                </CardDescription>
              </CardHeader>
              {rolesError ? (
                <CardContent>
                  <p className="text-sm text-destructive">
                    You do not have access to this data.
                  </p>
                </CardContent>
              ) : (
                <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  {JSON.stringify(roles, null, 2)}
                </pre>
              )}
            </Card>
          </TabsContent>
        ) : null}

        {canOrg ? (
          <TabsContent value="org" className="mt-4 space-y-4 outline-none">
            <Card>
              <CardHeader>
                <CardTitle>Branches</CardTitle>
                <CardDescription>
                  Create and manage branches for this tenant.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  className="grid gap-3 sm:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    createBranch.mutate();
                  }}
                >
                  <div className="sm:col-span-2">
                    <Label htmlFor="branch-name">Branch name</Label>
                    <Input
                      id="branch-name"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      required
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <Label htmlFor="branch-code">Code (optional)</Label>
                    <Input
                      id="branch-code"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Button type="submit" disabled={createBranch.isPending}>
                      Create branch
                    </Button>
                  </div>
                </form>

                <div className="space-y-2">
                  {(branches ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No branches yet.
                    </p>
                  ) : (
                    (branches ?? []).map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {b.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {b.code ? `Code: ${b.code}` : "No code"}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteBranch.mutate(b.id)}
                          disabled={deleteBranch.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Departments</CardTitle>
                <CardDescription>
                  Create and manage departments. Optionally link to a branch.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form
                  className="grid gap-3 sm:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    createDepartment.mutate();
                  }}
                >
                  <div className="sm:col-span-2">
                    <Label htmlFor="dept-name">Department name</Label>
                    <Input
                      id="dept-name"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      required
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dept-code">Code (optional)</Label>
                    <Input
                      id="dept-code"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  <div className="sm:col-span-3 max-w-sm">
                    <Label>Branch (optional)</Label>
                    <Select
                      value={deptBranchId ?? "__none__"}
                      onValueChange={(v) =>
                        setDeptBranchId(v === "__none__" ? null : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No branch</SelectItem>
                        {(branches ?? []).map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-3">
                    <Button type="submit" disabled={createDepartment.isPending}>
                      Create department
                    </Button>
                  </div>
                </form>

                <div className="space-y-2">
                  {(departments ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No departments yet.
                    </p>
                  ) : (
                    (departments ?? []).map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {d.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {d.code ? `Code: ${d.code}` : "No code"}
                            {" · "}
                            {d.branchId
                              ? `Branch: ${branchesById.get(d.branchId)?.name ?? "—"}`
                              : "No branch"}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteDepartment.mutate(d.id)}
                          disabled={deleteDepartment.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </motion.div>
  );
}
