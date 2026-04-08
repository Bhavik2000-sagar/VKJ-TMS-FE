import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MeetingsPage() {
  const { data } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const { data } = await api.get<{
        meetings: { id: string; title: string; datetime: string }[];
      }>("/api/meetings");
      return data.meetings;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold uppercase tracking-wide text-primary">
          Meetings
        </h1>
        <Link to="/meetings/new">
          <Button>Schedule</Button>
        </Link>
      </div>
      <div className="grid gap-3">
        {(data ?? []).map((m) => (
          <Link key={m.id} to={`/meetings/${m.id}`}>
            <Card className="hover:border-border/80">
              <CardContent>
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(m.datetime).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
