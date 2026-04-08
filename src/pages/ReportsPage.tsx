import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ReportsPage() {
  const { data: dash } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await api.get<{
        totalTasks: number;
        byStatus: Record<string, number>;
        overdue: number;
      }>("/api/reports/dashboard");
      return data;
    },
  });

  const { data: byUser } = useQuery({
    queryKey: ["reports-by-user"],
    queryFn: async () => {
      const { data } = await api.get<{
        rows: { user: { name: string; email: string }; count: number }[];
      }>("/api/reports/by-assignee");
      return data.rows;
    },
  });

  const chartData = dash
    ? Object.entries(dash.byStatus).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold uppercase tracking-wide text-primary">
        Reports
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="h-72">
          <CardHeader>
            <CardTitle>By status</CardTitle>
          </CardHeader>
          <div className="h-52 px-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tasks by assignee</CardTitle>
          </CardHeader>
          <div className="px-4 pb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(byUser ?? []).map((r) => (
                  <TableRow key={r.user.email}>
                    <TableCell>{r.user.name}</TableCell>
                    <TableCell>{r.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
