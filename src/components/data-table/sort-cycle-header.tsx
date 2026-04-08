import { memo, useCallback } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SortCycleState = false | "asc" | "desc";

export type SortCycleHeaderProps = {
  label: string;
  /** From `column.getIsSorted()` — false means “normal” (default server sort, no column highlight). */
  sortState: SortCycleState;
  sortColumnId: string;
  /** Stable callback, e.g. `useCallback` — receives `sortColumnId` when the header is clicked. */
  onSortColumn: (columnId: string) => void;
};

export const SortCycleHeader = memo(function SortCycleHeader({
  label,
  sortState,
  sortColumnId,
  onSortColumn,
}: SortCycleHeaderProps) {
  const onClick = useCallback(() => {
    onSortColumn(sortColumnId);
  }, [onSortColumn, sortColumnId]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 data-[state=open]:bg-accent"
      onClick={onClick}
    >
      {label}
      {sortState === "asc" ? (
        <ArrowUp className="ml-1 size-3.5 opacity-70" />
      ) : sortState === "desc" ? (
        <ArrowDown className="ml-1 size-3.5 opacity-70" />
      ) : (
        <ArrowUpDown className="ml-1 size-3.5 opacity-50" />
      )}
    </Button>
  );
});
