import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useMe } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { useTheme } from "@/providers/theme-provider";
import { useEffect } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  Building2,
  Calendar,
  Layers,
  ClipboardList,
} from "lucide-react";

export function AppLayout() {
  const { data, isError } = useMe();
  const navigate = useNavigate();
  const { setPreference } = useTheme();
  const p = data?.permissions ?? [];

  useEffect(() => {
    const pref = data?.user?.themePreference;
    if (pref === "light" || pref === "dark") {
      setPreference(pref);
    }
  }, [data?.user?.themePreference, setPreference]);

  if (isError) {
    navigate("/login");
    return null;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  const tenant = data.user.tenantId != null;
  const isPlatform = !tenant;

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-border bg-sidebar/70 p-4 backdrop-blur supports-backdrop-filter:bg-sidebar/60">
        <div className="mb-6 flex items-center gap-2 px-2">
          <img
            src={"/logo.png"}
            alt="TMS"
            className="h-9 w-auto select-none"
            draggable={false}
          />
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {tenant && (
            <>
              <Nav
                to="/"
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Dashboard"
              />
              <Nav
                to="/tasks"
                icon={<CheckSquare className="h-4 w-4" />}
                label="Tasks"
              />
              <Nav
                to="/eod"
                icon={<ClipboardList className="h-4 w-4" />}
                label="EOD"
              />
              {(p.includes("meeting.view") || p.includes("meeting.manage")) && (
                <Nav
                  to="/meetings"
                  icon={<Calendar className="h-4 w-4" />}
                  label="Meetings"
                />
              )}
              {p.includes("team.view") && (
                <Nav
                  to="/team"
                  icon={<Users className="h-4 w-4" />}
                  label="Team"
                />
              )}
              {p.includes("org.manage") && (
                <Nav
                  to="/departments"
                  icon={<Layers className="h-4 w-4" />}
                  label="Departments"
                />
              )}
              {p.includes("report.view") && (
                <Nav
                  to="/reports"
                  icon={<BarChart3 className="h-4 w-4" />}
                  label="Reports"
                />
              )}
              {(p.includes("user.manage") || p.includes("role.manage")) && (
                <Nav
                  to="/settings"
                  icon={<Settings className="h-4 w-4" />}
                  label="Settings"
                />
              )}
            </>
          )}
          {isPlatform && p.includes("platform.tenant.list") && (
            <>
              <Nav
                to="/platform/dashboard"
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Dashboard"
              />
              <Nav
                to="/platform/tenants"
                icon={<Building2 className="h-4 w-4" />}
                label="Tenants"
              />
            </>
          )}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <motion.header
          className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/40 px-4 backdrop-blur supports-backdrop-filter:bg-background/30 sm:px-6"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="min-w-0 text-sm text-muted-foreground">
            <span className="truncate font-medium text-foreground">
              {data.user.name}
            </span>
            <span className="text-muted-foreground"> · </span>
            <span className="truncate">{data.user.roleCode ?? "—"}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NotificationBell />
            <UserMenu me={data} />
          </div>
        </motion.header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Nav({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ring-1 ring-transparent",
          isActive
            ? "bg-sidebar-accent/70 text-foreground ring-[color-mix(in_oklab,var(--brand),transparent_70%)]"
            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground hover:ring-[color-mix(in_oklab,var(--brand),transparent_80%)]",
        ].join(" ")
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
