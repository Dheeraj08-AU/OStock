import TeammatePlaceholder from "@/components/common/TeammatePlaceholder";
import { Sliders } from "lucide-react";

export default function AdjustmentsPage() {
  return (
    <TeammatePlaceholder
      title="Stock Adjustments"
      section="Physical Inventory Count & Reconciliation"
      assignedTo="Teammate (Deliveries, Transfers, Adjustments)"
      description="Record discrepancies between counted physical stock and recorded inventory"
      icon={Sliders}
      includeFilterBar={true}
    />
  );
}
