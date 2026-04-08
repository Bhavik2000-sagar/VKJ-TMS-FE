import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMe } from "@/hooks/useAuth";
import { DashboardPage } from "./DashboardPage";

export function HomePage() {
  const { data } = useMe();
  const navigate = useNavigate();

  useEffect(() => {
    if (data?.user.tenantId == null) {
      navigate("/platform/dashboard", { replace: true });
    }
  }, [data, navigate]);

  if (data?.user.tenantId == null) {
    return null;
  }
  return <DashboardPage />;
}
