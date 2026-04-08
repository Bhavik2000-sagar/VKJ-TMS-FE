import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "tms-theme-preference";

export type ThemePreference = "light" | "dark" | "system";

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (t: ThemePreference) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "dark";
}

function resolvePreference(p: ThemePreference): "light" | "dark" {
  if (p === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return p;
}

function applyToDocument(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    typeof window !== "undefined" ? readPreference() : "dark",
  );
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    typeof window !== "undefined"
      ? resolvePreference(readPreference())
      : "dark",
  );

  const setPreference = useCallback((t: ThemePreference) => {
    setPreferenceState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const r = resolvePreference(preference);
    setResolvedTheme(r);
    applyToDocument(r);
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const r = resolvePreference("system");
      setResolvedTheme(r);
      applyToDocument(r);
    };
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [preference]);

  const value = useMemo(
    () => ({ preference, setPreference, resolvedTheme }),
    [preference, setPreference, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
