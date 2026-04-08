import type { ComponentProps } from "react";
import { useCallback } from "react";
import {
  flexRender,
  type Row,
  type SortingState,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SortCycleHeader,
  type SortCycleState,
} from "@/components/data-table/sort-cycle-header";
import { cn } from "@/lib/utils";

export type DataTableProps<TData> = {
  table: TanstackTable<TData>;
  /** Use for loading/empty row colSpan — e.g. `table.getAllColumns().length`. */
  columnCount: number;
  /** Controlled sorting state (TanStack format). Use `[]` for “normal”. */
  sort?: SortingState;
  /** Called with a TanStack-style updater. */
  onChangeSort?: (
    updater: SortingState | ((prev: SortingState) => SortingState),
  ) => void;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  className?: string;
  /** Keep referentially stable (`useCallback`) if you want to avoid extra DataTable renders. */
  getRowProps?: (row: Row<TData>) => ComponentProps<typeof TableRow>;
};

function getSortStateForColumn(
  sort: SortingState,
  columnId: string,
): SortCycleState {
  const s = sort[0];
  if (!s || String(s.id) !== columnId) return false;
  return s.desc ? "desc" : "asc";
}

function DataTableImpl<TData>({
  table,
  columnCount,
  sort = [],
  onChangeSort,
  isLoading = false,
  loadingMessage = "Loading…",
  emptyMessage = "No results.",
  className,
  getRowProps,
}: DataTableProps<TData>) {
  const headerGroups = table.getHeaderGroups();
  const rowModel = table.getRowModel();

  const cycleSort = useCallback(
    (columnId: string) => {
      if (!onChangeSort) return;
      onChangeSort((prev) => {
        const current = prev[0];
        if (!current || String(current.id) !== columnId) {
          return [{ id: columnId, desc: false }];
        }
        if (!current.desc) {
          return [{ id: columnId, desc: true }];
        }
        return [];
      });
    },
    [onChangeSort],
  );

  return (
    <Table className={cn(className)}>
      <TableHeader>
        {headerGroups.map((hg) => (
          <TableRow key={hg.id} className="hover:bg-transparent">
            {hg.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : (() => {
                      const rendered = flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      );
                      const canSort =
                        Boolean(onChangeSort) && header.column.getCanSort();
                      const label =
                        typeof rendered === "string" ||
                        typeof rendered === "number"
                          ? String(rendered)
                          : null;

                      if (!canSort || !label) return rendered;

                      return (
                        <SortCycleHeader
                          label={label}
                          sortState={getSortStateForColumn(
                            sort,
                            header.column.id,
                          )}
                          sortColumnId={header.column.id}
                          onSortColumn={cycleSort}
                        />
                      );
                    })()}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={columnCount}
              className="h-24 text-center text-muted-foreground"
            >
              {loadingMessage}
            </TableCell>
          </TableRow>
        ) : rowModel.rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columnCount}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rowModel.rows.map((row) => {
            const extra = getRowProps?.(row);
            return (
              <TableRow key={row.id} {...extra}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

export const DataTable = DataTableImpl;
