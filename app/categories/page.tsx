import TeammatePlaceholder from "@/components/common/TeammatePlaceholder";
import { Tags } from "lucide-react";

export default function CategoriesPage() {
  return (
    <TeammatePlaceholder
      title="Product Categories"
      section="Category Hierarchy & Classification"
      assignedTo="Teammate (Products & Receipts)"
      description="Organize your product catalog by functional groups and tags"
      icon={Tags}
      includeFilterBar={false}
    />
  );
}
