import TeammatePlaceholder from "@/components/common/TeammatePlaceholder";
import { Box } from "lucide-react";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <TeammatePlaceholder
      title={`Product Details (#${id})`}
      section={`Product Detail & Edit View for ID: ${id}`}
      assignedTo="Teammate (Products & Receipts)"
      description="View stock level history, SKU details, and locations for this item"
      icon={Box}
      includeFilterBar={false}
    />
  );
}
