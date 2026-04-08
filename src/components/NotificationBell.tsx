import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { api } from "@/api/client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  taskId?: string | null;
};

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get<{ notifications: Notif[]; unreadCount: number }>(
        "/api/notifications",
      );
      return data;
    },
  });

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || undefined, {
      withCredentials: true,
    });
    socket.on("NOTIFICATION_NEW", () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });
    return () => {
      socket.disconnect();
    };
  }, [qc]);

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/api/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-md p-2 hover:bg-white/10"
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className={cn(
            "absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-auto rounded-md border border-white/10 bg-[#141414] py-1 shadow-xl",
          )}
        >
          {(data?.notifications ?? []).length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-white/50">No notifications</div>
          ) : (
            <ul>
              {data?.notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-white/5",
                      !n.isRead && "bg-amber-500/10",
                    )}
                    onClick={() => {
                      if (!n.isRead) markRead.mutate(n.id);
                    }}
                  >
                    <div className="text-xs text-amber-500/90">{n.type}</div>
                    <div className="text-white/90">{n.message}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
