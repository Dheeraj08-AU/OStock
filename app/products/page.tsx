import TeammatePlaceholder from "@/components/common/TeammatePlaceholder";
import { Boxes } from "lucide-react";

export default function ProductsPage() {
  return (
    <TeammatePlaceholder
      title="Product Catalog"
      section="Products Listing & Management"
      assignedTo="Teammate (Products & Receipts)"
      description="View stock on hand, SKU codes, and reorder levels"
      icon={Boxes}
      includeFilterBar={true}
    />
  );
}
