import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Back control for centered forms: ghost row under card edge, consistent with Task create/edit. */
export function FormBackButton({
  onClick,
  children = "Back",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 inline-flex gap-2 text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      <ArrowLeft className="size-4 shrink-0" />
      {children}
    </Button>
  );
}

export function FormBackLink({
  to,
  children = "Back",
}: {
  to: string;
  children?: ReactNode;
}) {
  return (
    <Link to={to} className="inline-flex">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 inline-flex gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4 shrink-0" />
        {children}
      </Button>
    </Link>
  );
}

/**
 * Centered single-card form shell used across the app (tasks, team, platform, meetings).
 */
export function CenteredFormPage({
  title,
  description,
  back,
  children,
  maxWidthClassName = "max-w-2xl",
  className,
}: {
  title: string;
  description?: string;
  back: ReactNode;
  children: ReactNode;
  maxWidthClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto pb-12", maxWidthClassName, className)}>
      <Card className="p-6">
        <CardHeader className="space-y-0 p-0 pb-4">
          <div className="mb-3">{back}</div>
          <CardTitle className="font-heading text-xl font-semibold uppercase tracking-wide text-primary">
            {title}
          </CardTitle>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </CardHeader>
        {children}
      </Card>
    </div>
  );
}
