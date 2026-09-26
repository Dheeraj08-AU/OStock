import AppShell from "@/components/navigation/AppShell";
import FilterBar from "@/components/filters/FilterBar";
import { LucideIcon, Clock, Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TeammatePlaceholderProps {
  title: string;
  section: string;
  assignedTo: string;
  description: string;
  icon: LucideIcon;
  includeFilterBar?: boolean;
}

export default function TeammatePlaceholder({
  title,
  section,
  assignedTo,
  description,
  icon: Icon,
  includeFilterBar = true,
}: TeammatePlaceholderProps) {
  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-2xl tracking-tight">
            <Icon className="w-6 h-6 text-blue-600" />
            <h1>{title}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>

        {includeFilterBar && <FilterBar syncUrl={true} />}

        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
            <Construction className="w-7 h-7" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>Teammate Section • {assignedTo}</span>
          </span>
          <h2 className="text-lg font-bold text-slate-900 mb-1">{section}</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            This route is reserved for your teammate. Shared types and database
            helpers are ready in <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">@/types</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">@/utils/supabase</code>.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
