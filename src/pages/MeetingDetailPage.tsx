import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MeetingDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["meeting", id],
    queryFn: async () => {
      const { data } = await api.get<{ meeting: unknown }>(`/api/meetings/${id}`);
      return data.meeting as {
        id: string;
        title: string;
        agenda: string | null;
        datetime: string;
        outcomes: { id: string; outcomeText: string; task: { id: string; title: string } | null }[];
      };
    },
  });

  const addOutcome = useMutation({
    mutationFn (payload: { outcomeText: string }) {
      return api.post(`/api/meetings/${id}/outcomes`, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting", id] }),
  });

  if (!data) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <Link to="/meetings" className="text-sm text-primary hover:underline">
        ← Meetings
      </Link>
      <h1 className="text-2xl font-semibold">{data.title}</h1>
      <p className="text-muted-foreground">{data.agenda}</p>
      <p className="text-sm text-muted-foreground">
        {new Date(data.datetime).toLocaleString()}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Outcomes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {data.outcomes.map((o) => (
              <li key={o.id} className="border-b border-border/60 pb-2">
                <div>{o.outcomeText}</div>
                {o.task && (
                  <Link className="text-primary hover:underline" to={`/tasks/${o.task.id}`}>
                    Task: {o.task.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const outcomeText = String(fd.get("outcome") ?? "");
              addOutcome.mutate({ outcomeText });
              e.currentTarget.reset();
            }}
          >
            <Input
              name="outcome"
              placeholder="Outcome text — creates linked task"
              required
            />
            <Button type="submit" disabled={addOutcome.isPending}>
              Add outcome & create task
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
