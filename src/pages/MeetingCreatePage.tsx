import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CenteredFormPage,
  FormBackButton,
} from "@/components/layout/CenteredFormPage";

export function MeetingCreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["meeting-attendees"],
    queryFn: async () => {
      const { data } = await api.get<{
        users: { id: string; name: string; email: string }[];
      }>("/api/meetings/eligible-attendees");
      return data.users;
    },
  });

  const create = useMutation({
    mutationFn: (payload: {
      title: string;
      agenda?: string;
      datetime: string;
      attendeeIds: string[];
    }) => api.post("/api/meetings", payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      const mid = (res.data as { meeting: { id: string } }).meeting?.id;
      if (mid) navigate(`/meetings/${mid}`);
      else navigate("/meetings");
    },
  });

  return (
    <CenteredFormPage
      title="New meeting"
      description="Schedule a meeting and capture agenda, time, and attendees."
      back={<FormBackButton onClick={() => navigate("/meetings")} />}
    >
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const attendeeIds = fd.getAll("attendees") as string[];
          create.mutate({
            title: String(fd.get("title")),
            agenda: String(fd.get("agenda") ?? ""),
            datetime: new Date(String(fd.get("datetime"))).toISOString(),
            attendeeIds,
          });
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Q4 planning sync"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agenda">Agenda</Label>
            <Textarea
              id="agenda"
              name="agenda"
              placeholder="What should this meeting cover?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="datetime">When</Label>
            <Input
              id="datetime"
              name="datetime"
              type="datetime-local"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Attendees</Label>
            <div className="max-h-32 space-y-1 overflow-auto rounded-lg border border-border bg-background/30 p-2">
              {(users ?? []).map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="attendees" value={u.id} />
                  <span>
                    {u.name}
                    <span className="text-muted-foreground"> · {u.email}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-end border-t border-border pt-6">
          <Button type="submit" disabled={create.isPending}>
            Create meeting
          </Button>
        </div>
      </form>
    </CenteredFormPage>
  );
}
