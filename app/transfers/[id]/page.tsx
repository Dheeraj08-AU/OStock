import TeammatePlaceholder from "@/components/common/TeammatePlaceholder";
import { ArrowLeftRight } from "lucide-react";

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <TeammatePlaceholder
      title={`Internal Transfer #${id}`}
      section={`Internal Relocation Plan for ${id}`}
      assignedTo="Teammate (Deliveries, Transfers, Adjustments)"
      description="Validate source location, target location, and confirm physical transfer"
      icon={ArrowLeftRight}
      includeFilterBar={false}
    />
  );
}
