import TeammatePlaceholder from "@/components/common/TeammatePlaceholder";
import { ArrowLeftRight } from "lucide-react";

export default function TransfersPage() {
  return (
    <TeammatePlaceholder
      title="Internal Transfers"
      section="Location-to-Location & Inter-Warehouse Stock Transfers"
      assignedTo="Teammate (Deliveries, Transfers, Adjustments)"
      description="Shift items from receiving docks to racks, or between different warehouses"
      icon={ArrowLeftRight}
      includeFilterBar={true}
    />
  );
}
