import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { api } from "@/api/client";
import { useMe } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  CenteredFormPage,
  FormBackLink,
} from "@/components/layout/CenteredFormPage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type Role = { id: string; code: string; name: string };
type ManagerOption = { id: string; name: string; email: string };
type DepartmentOption = { id: string; name: string; code: string | null };

export function TeamUserCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useMe();
  const perms = new Set(me.data?.permissions ?? []);
  const canManageUsers = perms.has("user.manage");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [managerId, setManagerId] = useState<string>("__none__");
  const [departmentId, setDepartmentId] = useState<string>("__none__");

  const rolesQuery = useQuery({
    queryKey: ["tenant-roles", "assignment"],
    enabled: canManageUsers,
    queryFn: async () => {
      const { data } = await api.get<{ roles: Role[] }>("/api/tenant/roles", {
        params: { for: "assignment" },
      });
      return data.roles;
    },
  });

  const managersQuery = useQuery({
    queryKey: ["team-managers-options"],
    enabled: canManageUsers,
    queryFn: async () => {
      const { data } = await api.get<{
        items: {
          id: string;
          name: string;
          email: string;
          role: { code: string; name: string };
        }[];
      }>("/api/team/members", {
        params: { page: 1, pageSize: 100, sortBy: "name", sortDir: "asc" },
      });
      return data.items.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      })) as ManagerOption[];
    },
  });

  const departmentsQuery = useQuery({
    queryKey: ["org-departments", "options"],
    enabled: canManageUsers,
    queryFn: async () => {
      const { data } = await api.get<{ departments: DepartmentOption[] }>(
        "/api/org/departments",
      );
      return data.departments;
    },
  });

  const assignableRoles = rolesQuery.data ?? [];
  const managerOptions = managersQuery.data ?? [];
  const departmentOptions = departmentsQuery.data ?? [];

  useEffect(() => {
    if (!departmentsQuery.isSuccess) return;
    if (departmentId === "__none__") return;
    if (!departmentOptions.some((d) => d.id === departmentId)) {
      setDepartmentId("__none__");
    }
  }, [departmentsQuery.isSuccess, departmentOptions, departmentId]);

  const resolvedRoleId = useMemo(() => {
    if (!assignableRoles.length) return "";
    if (roleId && assignableRoles.some((r) => r.id === roleId)) return roleId;
    return assignableRoles[0]!.id;
  }, [assignableRoles, roleId]);

  useEffect(() => {
    if (!managersQuery.isSuccess) return;
    if (managerId === "__none__") return;
    if (!managerOptions.some((m) => m.id === managerId)) {
      setManagerId("__none__");
    }
  }, [managersQuery.isSuccess, managerOptions, managerId]);

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        roleId: resolvedRoleId,
        managerId: managerId === "__none__" ? null : managerId,
        departmentId: departmentId === "__none__" ? null : departmentId,
        employeeCode: employeeCode.trim() ? employeeCode.trim() : null,
        phone: phone.trim() ? phone.trim() : null,
        birthDate: birthDate ? new Date(birthDate) : null,
      };
      const { data } = await api.post<{ user: { id: string } }>(
        "/api/tenant/users",
        payload,
      );
      return data.user;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["team-members"], exact: false });
      toast.success("User created");
      navigate("/team");
    },
    onError: (e) => {
      const msg = isAxiosError(e)
        ? (e.response?.data?.error?.message ??
          e.response?.data?.error ??
          e.message)
        : "Could not create user";
      toast.error(String(msg));
    },
  });

  if (!canManageUsers) {
    return (
      <CenteredFormPage
        title="Add user"
        description="You don’t have permission to manage users."
        back={<FormBackLink to="/team">Back to team</FormBackLink>}
      >
        <p className="text-sm text-muted-foreground">
          Contact a company admin if you need access.
        </p>
      </CenteredFormPage>
    );
  }

  return (
    <CenteredFormPage
      title="Add user"
      description="Create a new team member and assign a role."
      back={<FormBackLink to="/team">Back to team</FormBackLink>}
    >
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Patel"
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. priya@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="employeeCode">Employee code</Label>
            <Input
              id="employeeCode"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="e.g. EMP-1024"
            />
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              autoComplete="tel"
            />
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="birthDate">Birthdate</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="departmentId">Department (optional)</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger
                id="departmentId"
                className="w-full min-w-0 justify-between"
              >
                {(() => {
                  if (departmentId === "__none__") {
                    return (
                      <span className="text-muted-foreground">
                        No department
                      </span>
                    );
                  }
                  const selected = departmentOptions.find(
                    (d) => d.id === departmentId,
                  );
                  if (!selected) {
                    return (
                      <span className="text-muted-foreground">
                        Select department
                      </span>
                    );
                  }
                  return <span className="truncate">{selected.name}</span>;
                })()}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No department</SelectItem>
                {departmentOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="managerId">Reports to</Label>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger
                id="managerId"
                className="w-full min-w-0 justify-between"
              >
                {(() => {
                  if (managerId === "__none__") {
                    return (
                      <span className="text-muted-foreground">No manager</span>
                    );
                  }
                  const selected = managerOptions.find(
                    (m) => m.id === managerId,
                  );
                  if (!selected) {
                    return (
                      <span className="text-muted-foreground">
                        Select manager
                      </span>
                    );
                  }
                  return (
                    <span className="truncate">
                      {selected.name} ({selected.email})
                    </span>
                  );
                })()}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No manager</SelectItem>
                {managerOptions.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="roleId">Role</Label>
            <Select
              value={resolvedRoleId || undefined}
              onValueChange={(v) => setRoleId(v)}
              disabled={rolesQuery.isLoading || !assignableRoles.length}
            >
              <SelectTrigger
                id="roleId"
                className="w-full min-w-0 justify-between"
              >
                {(() => {
                  const selected = assignableRoles.find(
                    (r) => r.id === resolvedRoleId,
                  );
                  if (!selected) {
                    return (
                      <span className="text-muted-foreground">Select role</span>
                    );
                  }
                  return <span className="truncate">{selected.name}</span>;
                })()}
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="password">Temporary password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-end border-t border-border pt-6 gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              create.isPending ||
              !resolvedRoleId ||
              !email ||
              !name ||
              rolesQuery.isLoading
            }
          >
            {create.isPending ? "Creating…" : "Create user"}
          </Button>
        </div>
      </form>
    </CenteredFormPage>
  );
}
