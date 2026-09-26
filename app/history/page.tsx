import TeammatePlaceholder from "@/components/common/TeammatePlaceholder";
import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <TeammatePlaceholder
      title="Stock Move History"
      section="Complete Ledger of Inventory Transactions"
      assignedTo="Teammate (Deliveries, Transfers, Adjustments)"
      description="Audit trail of receipts, deliveries, internal moves, and adjustments over time"
      icon={History}
      includeFilterBar={true}
    />
  );
}
