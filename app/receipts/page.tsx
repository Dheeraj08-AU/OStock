import TeammatePlaceholder from "@/components/common/TeammatePlaceholder";
import { ArrowDownToLine } from "lucide-react";

export default function ReceiptsPage() {
  return (
    <TeammatePlaceholder
      title="Inbound Receipts"
      section="Vendor & Supplier Inbound Stock Receipts"
      assignedTo="Teammate (Products & Receipts)"
      description="Validate incoming purchase orders and update warehouse quantities"
      icon={ArrowDownToLine}
      includeFilterBar={true}
    />
  );
}
