import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import { TrashBinIcon, PencilIcon } from "../../icons";

interface Column {
  key: string;
  label: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  renderCell?: (item: any, key: string) => React.ReactNode;
}

export default function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  renderCell,
}: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  {col.label}
                </TableCell>
              ))}
              <TableCell className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {data.map((item) => (
              <TableRow key={item.id}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90"
                  >
                    {renderCell
                      ? renderCell(item, col.key)
                      : (item[col.key] ?? "-")}
                  </TableCell>
                ))}
                <TableCell className="px-5 py-4 text-start text-sm text-gray-800 dark:text-white/90">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onEdit(item.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <TrashBinIcon className="w-5 h-5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
