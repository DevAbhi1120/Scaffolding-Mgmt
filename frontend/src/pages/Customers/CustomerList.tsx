import DataTable from "../..//components/DataTable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Button from "../../components/ui/button/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../components/ui/select/Select";

const columns = [
  { header: "Business Name", accessorKey: "business_name" },
  { header: "Address", accessorKey: "address" },
  { header: "Email", accessorKey: "email" },
  { header: "Package", accessorKey: "package" },
  {
    header: "Actions",
    cell: ({ row }) => <UpgradeButton customer={row.original} />,
  },
];

const UpgradeButton = ({ customer }) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (newPackage) =>
      axios.patch(`/api/customers/${customer.id}/package`, {
        package: newPackage,
      }),
    onSuccess: () => queryClient.invalidateQueries(["customers"]),
  });

  return (
    <Select
      onValueChange={(v) => mutation.mutate(v)}
      defaultValue={customer.package}
    >
      <SelectTrigger>
        <span>{customer.package}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PACKAGE_1">Package 1</SelectItem>
        <SelectItem value="PACKAGE_2">Package 2</SelectItem>
        <SelectItem value="PACKAGE_3">Package 3</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default function CustomerList() {
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => axios.get("/api/customers").then((res) => res.data),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Customers</h1>
      <DataTable columns={columns} data={customers} />
    </div>
  );
}
