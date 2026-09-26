import TeammatePlaceholder from "@/components/common/TeammatePlaceholder";
import { Truck } from "lucide-react";

export default function DeliveriesPage() {
  return (
    <TeammatePlaceholder
      title="Outbound Deliveries"
      section="Customer Orders & Outbound Shipments"
      assignedTo="Teammate (Deliveries, Transfers, Adjustments)"
      description="Pick, pack, ship, and record stock decrease for customer fulfillment"
      icon={Truck}
      includeFilterBar={true}
    />
  );
}
