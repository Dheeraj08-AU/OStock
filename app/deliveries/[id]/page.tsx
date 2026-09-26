import TeammatePlaceholder from "@/components/common/TeammatePlaceholder";
import { Truck } from "lucide-react";

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <TeammatePlaceholder
      title={`Delivery Order #${id}`}
      section={`Delivery Dispatch & Shipping Slip for ${id}`}
      assignedTo="Teammate (Deliveries, Transfers, Adjustments)"
      description="Inspect lines, shipping destination address, and confirm delivery"
      icon={Truck}
      includeFilterBar={false}
    />
  );
}
