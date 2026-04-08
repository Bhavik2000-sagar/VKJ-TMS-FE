import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

type UserDetail = {
  id: string;
  email: string;
  name: string;
  managerId: string | null;
  departmentId: string | null;
  employeeCode: string | null;
  phone: string | null;
  birthDate: string | null;
  role: { id: string; code: string; name: string };
};

export function TeamUserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const me = useMe();
  const perms = new Set(me.data?.permissions ?? []);
  const canManageUsers = perms.has("user.manage");

  const userQuery = useQuery({
    enabled: canManageUsers && Boolean(id),
    queryKey: ["tenant-user", id],
    queryFn: async () => {
      const { data } = await api.get<{ user: UserDetail }>(
        `/api/tenant/users/${id}`,
      );
      return data.user;
    },
  });

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
        items: { id: string; name: string; email: string }[];
      }>("/api/team/members", {
        params: { page: 1, pageSize: 100, sortBy: "name", sortDir: "asc" },
      });
      return data.items as ManagerOption[];
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

  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [managerId, setManagerId] = useState<string>("__none__");
  const [departmentId, setDepartmentId] = useState<string>("__none__");

  useEffect(() => {
    const u = userQuery.data;
    if (!u) return;
    setName(u.name);
    setEmployeeCode(u.employeeCode ?? "");
    setPhone(u.phone ?? "");
    setRoleId(u.role.id);
    setManagerId(u.managerId ?? "__none__");
    setDepartmentId(u.departmentId ?? "__none__");
    if (u.birthDate) {
      try {
        setBirthDate(new Date(u.birthDate).toISOString().slice(0, 10));
      } catch {
        setBirthDate("");
      }
    } else {
      setBirthDate("");
    }
  }, [userQuery.data]);

  const resolvedRoleId = useMemo(() => {
    if (!assignableRoles.length) return roleId;
    if (roleId && assignableRoles.some((r) => r.id === roleId)) return roleId;
    return assignableRoles[0]!.id;
  }, [assignableRoles, roleId]);

  const update = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        roleId: resolvedRoleId,
        managerId: managerId === "__none__" ? null : managerId,
        departmentId: departmentId === "__none__" ? null : departmentId,
        employeeCode: employeeCode.trim() ? employeeCode.trim() : null,
        phone: phone.trim() ? phone.trim() : null,
        birthDate: birthDate ? new Date(birthDate) : null,
      };
      const { data } = await api.patch<{ user: UserDetail }>(
        `/api/tenant/users/${id}`,
        payload,
      );
      return data.user;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["team-members"], exact: false });
      await qc.invalidateQueries({
        queryKey: ["tenant-user", id],
        exact: false,
      });
      toast.success("User updated");
      navigate("/team");
    },
    onError: (e) => {
      const msg = isAxiosError(e)
        ? (e.response?.data?.error?.message ??
          e.response?.data?.error ??
          e.message)
        : "Could not update user";
      toast.error(String(msg));
    },
  });

  if (!canManageUsers) {
    return (
      <CenteredFormPage
        title="Edit user"
        description="You don’t have permission to manage users."
        back={<FormBackLink to="/team">Back to team</FormBackLink>}
      >
        <p className="text-sm text-muted-foreground">
          Contact a company admin if you need access.
        </p>
      </CenteredFormPage>
    );
  }

  if (userQuery.isLoading) {
    return (
      <CenteredFormPage
        title="Edit user"
        description="Loading user…"
        back={<FormBackLink to="/team">Back to team</FormBackLink>}
      >
        <div className="text-sm text-muted-foreground">Loading…</div>
      </CenteredFormPage>
    );
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <CenteredFormPage
        title="Edit user"
        description="Could not load this user."
        back={<FormBackLink to="/team">Back to team</FormBackLink>}
      >
        <div className="text-sm text-muted-foreground">Not found.</div>
      </CenteredFormPage>
    );
  }

  const user = userQuery.data;

  return (
    <CenteredFormPage
      title="Edit user"
      description="Update user details. Email cannot be changed."
      back={<FormBackLink to="/team">Back to team</FormBackLink>}
    >
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate();
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Patel"
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
                  return selected ? (
                    <span className="truncate">{selected.name}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      Select department
                    </span>
                  );
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
                  if (managerId === "__none__")
                    return (
                      <span className="text-muted-foreground">No manager</span>
                    );
                  const selected = managerOptions.find(
                    (m) => m.id === managerId,
                  );
                  return selected ? (
                    <span className="truncate">
                      {selected.name} ({selected.email})
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Select manager
                    </span>
                  );
                })()}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No manager</SelectItem>
                {managerOptions
                  .filter((m) => m.id !== user.id)
                  .map((m) => (
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
            >
              <SelectTrigger
                id="roleId"
                className="w-full min-w-0 justify-between"
              >
                {(() => {
                  const selected = assignableRoles.find(
                    (r) => r.id === resolvedRoleId,
                  );
                  return selected ? (
                    <span className="truncate">{selected.name}</span>
                  ) : (
                    <span className="text-muted-foreground">Select role</span>
                  );
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
        </div>

        <div className="mt-8 flex flex-wrap justify-end border-t border-border pt-6 gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={update.isPending || !name.trim() || !resolvedRoleId}
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </CenteredFormPage>
  );
}
