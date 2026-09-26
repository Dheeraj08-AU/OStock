import TeammatePlaceholder from "@/components/common/TeammatePlaceholder";
import { ArrowDownToLine } from "lucide-react";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <TeammatePlaceholder
      title={`Receipt Order #${id}`}
      section={`Receipt Processing & Validation View for ${id}`}
      assignedTo="Teammate (Products & Receipts)"
      description="Inspect lines, quantity received vs ordered, and mark as done"
      icon={ArrowDownToLine}
      includeFilterBar={false}
    />
  );
}
