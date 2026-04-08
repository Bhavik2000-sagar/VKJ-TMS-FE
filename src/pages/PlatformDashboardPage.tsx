import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/data-table/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TenantRow = {
  id: string;
  name: string;
  createdAt: string;
  status: "INVITED" | "ACTIVE" | "INACTIVE";
  _count: { users: number };
};

type PlatformDashboard = {
  tenantsTotal: number;
  usersTotal: number;
};

type TenantsApiResponse = {
  tenants: TenantRow[];
  total: number;
  page: number;
  pageSize: number;
};

const PAGE_SIZES = [5, 10, 20, 50] as const;
type SortId = "createdAt" | "name" | "users";

function useDebouncedValue<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export function PlatformDashboardPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-dashboard"],
    queryFn: async () => {
      const { data } = await api.get<PlatformDashboard>(
        "/api/platform/dashboard",
      );
      return data;
    },
  });

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 350);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const sort = sorting[0];
  const sortBy: SortId = (sort?.id as SortId) ?? "createdAt";
  const sortDir: "asc" | "desc" = sort?.desc ? "desc" : "asc";

  const tenantsQuery = useQuery({
    queryKey: [
      "tenants",
      "dashboard",
      pagination.pageIndex,
      pagination.pageSize,
      search,
      sortBy,
      sortDir,
    ],
    queryFn: async () => {
      const { data } = await api.get<TenantsApiResponse>(
        "/api/platform/tenants",
        {
          params: {
            page: pagination.pageIndex + 1,
            pageSize: pagination.pageSize,
            ...(search.trim() ? { search: search.trim() } : {}),
            sortBy,
            sortDir,
          },
        },
      );
      return data;
    },
  });

  const tenants = tenantsQuery.data?.tenants ?? [];
  const total = tenantsQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const [confirm, setConfirm] = useState<null | {
    tenantId: string;
    tenantName: string;
    kind: "activate" | "deactivate" | "reinvite" | "delete";
  }>(null);

  const setStatus = useMutation({
    mutationFn: async (input: {
      tenantId: string;
      status: "INVITED" | "ACTIVE" | "INACTIVE";
    }) => {
      const { data } = await api.patch<{ tenant: TenantRow }>(
        `/api/platform/tenants/${input.tenantId}/status`,
        { status: input.status },
      );
      return data.tenant;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tenants"], exact: false });
      toast.success("Tenant updated");
    },
    onError: (e) => {
      const msg = isAxiosError(e)
        ? (e.response?.data?.error?.message ??
          e.response?.data?.error ??
          e.message)
        : "Could not update tenant";
      toast.error(String(msg));
    },
  });

  const deleteTenant = useMutation({
    mutationFn: async (tenantId: string) => {
      await api.delete(`/api/platform/tenants/${tenantId}`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tenants"], exact: false });
      toast.success("Tenant deleted");
    },
    onError: (e) => {
      const msg = isAxiosError(e)
        ? (e.response?.data?.error?.message ??
          e.response?.data?.error ??
          e.message)
        : "Could not delete tenant";
      toast.error(String(msg));
    },
  });
  function statusPill(s: TenantRow["status"]) {
    const base =
      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";
    if (s === "ACTIVE")
      return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
    if (s === "INVITED")
      return `${base} border-amber-200 bg-amber-50 text-amber-700`;
    return `${base} border-rose-200 bg-rose-50 text-rose-700`;
  }

  const columns = useMemo<ColumnDef<TenantRow>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: "Company",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "status",
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className={statusPill(row.original.status)}>
            {row.original.status === "INVITED"
              ? "Invited"
              : row.original.status === "ACTIVE"
                ? "Active"
                : "Inactive"}
          </span>
        ),
      },
      {
        id: "users",
        accessorFn: (r) => r._count.users,
        header: "Users",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original._count.users}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        id: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => {
          const t = row.original;
          if (t.status === "INVITED") {
            return (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={setStatus.isPending || deleteTenant.isPending}
                  onClick={() =>
                    setConfirm({
                      tenantId: t.id,
                      tenantName: t.name,
                      kind: "reinvite",
                    })
                  }
                >
                  Re-invite
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={setStatus.isPending || deleteTenant.isPending}
                  onClick={() =>
                    setConfirm({
                      tenantId: t.id,
                      tenantName: t.name,
                      kind: "delete",
                    })
                  }
                >
                  Delete
                </Button>
              </div>
            );
          }

          const nextStatus = t.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
          return (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={setStatus.isPending || deleteTenant.isPending}
                onClick={() =>
                  setConfirm({
                    tenantId: t.id,
                    tenantName: t.name,
                    kind: nextStatus === "ACTIVE" ? "activate" : "deactivate",
                  })
                }
              >
                {t.status === "INACTIVE" ? "Activate" : "Deactivate"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={setStatus.isPending || deleteTenant.isPending}
                onClick={() =>
                  setConfirm({
                    tenantId: t.id,
                    tenantName: t.name,
                    kind: "delete",
                  })
                }
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [setStatus.isPending, deleteTenant.isPending],
  );

  const table = useReactTable({
    data: tenants,
    columns,
    state: { sorting, pagination },
    pageCount,
    manualPagination: true,
    manualSorting: true,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-primary">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of platform metrics and tenant activity.
          </p>
        </div>
        <Link to="/platform/tenants/new">
          <Button>Add tenant</Button>
        </Link>
      </div>

      {isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not load dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You may not have permission to view platform metrics.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Total tenants
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {isLoading ? "—" : (data?.tenantsTotal ?? "—")}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Total tenant users
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {isLoading ? "—" : (data?.usersTotal ?? "—")}
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog
        open={confirm != null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "delete"
                ? "Delete tenant?"
                : confirm?.kind === "reinvite"
                  ? "Re-send invitation?"
                  : confirm?.kind === "activate"
                    ? "Activate tenant?"
                    : "Deactivate tenant?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "delete" ? (
                <>
                  This will permanently delete{" "}
                  <strong>{confirm?.tenantName}</strong> and all related data.
                  Users will no longer be able to log in.
                </>
              ) : confirm?.kind === "reinvite" ? (
                <>
                  This will generate a new invite link and email it again to the
                  last invited admin for <strong>{confirm?.tenantName}</strong>.
                </>
              ) : confirm?.kind === "activate" ? (
                <>
                  This will allow users of{" "}
                  <strong>{confirm?.tenantName}</strong> to log in again.
                </>
              ) : (
                <>
                  This will prevent all users of{" "}
                  <strong>{confirm?.tenantName}</strong> from logging in.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirm) return;
                if (confirm.kind === "delete") {
                  deleteTenant.mutate(confirm.tenantId, {
                    onSettled: () => setConfirm(null),
                  });
                  return;
                }
                if (confirm.kind === "reinvite") {
                  try {
                    const { data } = await api.post<{ inviteLink: string }>(
                      `/api/platform/tenants/${confirm.tenantId}/reinvite`,
                    );
                    await qc.invalidateQueries({
                      queryKey: ["tenants"],
                      exact: false,
                    });
                    await navigator.clipboard.writeText(data.inviteLink);
                    toast.success("Invitation re-sent (link copied)");
                  } catch (e) {
                    const msg = isAxiosError(e)
                      ? (e.response?.data?.error?.message ??
                        e.response?.data?.error ??
                        e.message)
                      : "Could not re-invite";
                    toast.error(String(msg));
                  } finally {
                    setConfirm(null);
                  }
                  return;
                }

                const status =
                  confirm.kind === "activate" ? "ACTIVE" : "INACTIVE";
                setStatus.mutate(
                  { tenantId: confirm.tenantId, status },
                  { onSettled: () => setConfirm(null) },
                );
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tenants List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full flex flex-col gap-2 sm:max-w-sm">
              <Label htmlFor="tenant-search">Search</Label>
              <Input
                id="tenant-search"
                placeholder="Search by company name…"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              />
            </div>
            <div className="w-full sm:w-40">
              <Label>Rows</Label>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(v) => {
                  const n = Number(v);
                  setPagination({ pageIndex: 0, pageSize: n });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {tenantsQuery.isError ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Could not load tenant list.
            </p>
          ) : (
            <div className="mt-4 overflow-auto rounded-md border border-border">
              <DataTable
                table={table}
                columnCount={columns.length}
                sort={sorting}
                onChangeSort={setSorting}
                isLoading={tenantsQuery.isLoading}
                emptyMessage="No tenants match your filters."
              />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {total === 0
                ? "0 tenants"
                : `Showing ${pagination.pageIndex * pagination.pageSize + 1}–${Math.min(
                    (pagination.pageIndex + 1) * pagination.pageSize,
                    total,
                  )} of ${total}`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pagination.pageIndex <= 0 || tenantsQuery.isLoading}
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    pageIndex: Math.max(0, p.pageIndex - 1),
                  }))
                }
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.pageIndex + 1} / {pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={
                  pagination.pageIndex >= pageCount - 1 ||
                  tenantsQuery.isLoading
                }
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    pageIndex: Math.min(pageCount - 1, p.pageIndex + 1),
                  }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
