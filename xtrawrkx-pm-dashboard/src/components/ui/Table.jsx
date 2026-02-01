import { clsx } from "clsx";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export function Table({
  columns = [],
  data = [],
  onSort,
  sortField,
  sortDirection,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  className,
  rowPadding = "py-2",
  ...props
}) {
  const handleSort = (field) => {
    if (onSort) {
      onSort(field);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ChevronsUpDown className="w-4 h-4" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 transition-shadow duration-300">
      <table className={clsx("min-w-full rounded-3xl overflow-hidden", className)} {...props}>
        <thead className="bg-white/90 backdrop-blur-lg border-b border-orange-200/50 shadow-sm">
          <tr>
            {selectable && (
              <th className="px-6 py-5 text-left first:rounded-tl-3xl">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  checked={
                    selectedRows.length === data.length && data.length > 0
                  }
                  onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                />
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={clsx(
                  "px-6 py-5 text-left text-xs font-black text-gray-800 uppercase tracking-wider shadow-sm",
                  !selectable && index === 0 && "first:rounded-tl-3xl",
                  index === columns.length - 1 && "last:rounded-tr-3xl",
                  column.sortable && "cursor-pointer hover:bg-gray-100"
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-white/20">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-6 py-12 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              // Check if task is done/completed
              const isDone =
                row.status?.toLowerCase() === "done" ||
                row.status?.toLowerCase() === "completed";
              
              // Check if task is in Client Review status (waiting for client approval)
              const isClientReview =
                row.status?.toUpperCase() === "CLIENT_REVIEW" ||
                row.status?.toUpperCase() === "CLIENT REVIEW" ||
                row.status === "Client Review";
              
              return (
              <tr
                key={row.id || rowIndex}
                className={clsx(
                  "hover:bg-orange-50/50 hover:shadow-lg transition-all duration-300 group shadow-sm hover:shadow-orange-100/50",
                  onRowClick && "cursor-pointer",
                  selectedRows.includes(row.id) &&
                    "bg-blue-50/50 backdrop-blur-sm",
                  isDone
                    ? "bg-gray-100/60 opacity-75"
                    : "bg-white/40",
                  isClientReview &&
                    "border-l-4 border-purple-500 bg-purple-50/30 hover:bg-purple-50/50"
                )}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {selectable && (
                  <td className={clsx("px-6", rowPadding)}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      checked={selectedRows.includes(row.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectRow && onSelectRow(row.id, e.target.checked);
                      }}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={clsx("px-6", rowPadding, "text-sm text-gray-800 group-hover:text-gray-900 transition-colors duration-300")}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
