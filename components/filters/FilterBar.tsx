"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Filter, X } from "lucide-react";

export interface FilterValues {
  type?: string;
  status?: string;
  warehouse?: string;
  category?: string;
}

export interface FilterOption {
  id: string;
  name: string;
}

export interface FilterBarProps {
  values?: FilterValues;
  onChange?: (values: FilterValues) => void;
  warehouses?: FilterOption[];
  categories?: FilterOption[];
  syncUrl?: boolean;
  className?: string;
}

function FilterBarInner({
  values: controlledValues,
  onChange,
  warehouses: propWarehouses,
  categories: propCategories,
  syncUrl = true,
  className = "",
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Local state for warehouses and categories (strictly live, zero mock data)
  const [warehouses, setWarehouses] = useState<FilterOption[]>(
    propWarehouses || []
  );
  const [categories, setCategories] = useState<FilterOption[]>(
    propCategories || []
  );

  // Read initial from URL if syncUrl is enabled, otherwise controlled or blank
  const currentType =
    controlledValues?.type !== undefined
      ? controlledValues.type
      : syncUrl
      ? searchParams.get("type") || ""
      : "";

  const currentStatus =
    controlledValues?.status !== undefined
      ? controlledValues.status
      : syncUrl
      ? searchParams.get("status") || ""
      : "";

  const currentWarehouse =
    controlledValues?.warehouse !== undefined
      ? controlledValues.warehouse
      : syncUrl
      ? searchParams.get("warehouse") || ""
      : "";

  const currentCategory =
    controlledValues?.category !== undefined
      ? controlledValues.category
      : syncUrl
      ? searchParams.get("category") || ""
      : "";

  // Fetch live warehouses and categories from Supabase
  useEffect(() => {
    if (propWarehouses !== undefined) {
      setWarehouses(propWarehouses);
    } else {
      const supabase = createClient();
      supabase
        .from("warehouses")
        .select("id, name")
        .order("name", { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            setWarehouses(data);
          } else {
            setWarehouses([]);
          }
        });
    }

    if (propCategories !== undefined) {
      setCategories(propCategories);
    } else {
      const supabase = createClient();
      supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            setCategories(data);
          } else {
            setCategories([]);
          }
        });
    }
  }, [propWarehouses, propCategories]);

  // Update a single filter field
  const handleFilterChange = (key: keyof FilterValues, val: string) => {
    const updatedValues: FilterValues = {
      type: currentType,
      status: currentStatus,
      warehouse: currentWarehouse,
      category: currentCategory,
      [key]: val,
    };

    if (onChange) {
      onChange(updatedValues);
    }

    if (syncUrl) {
      const params = new URLSearchParams(searchParams.toString());
      if (val) {
        params.set(key, val);
      } else {
        params.delete(key);
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }
  };

  const handleClearFilters = () => {
    const emptyValues: FilterValues = {
      type: "",
      status: "",
      warehouse: "",
      category: "",
    };

    if (onChange) {
      onChange(emptyValues);
    }

    if (syncUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("type");
      params.delete("status");
      params.delete("warehouse");
      params.delete("category");

      startTransition(() => {
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    }
  };

  const hasActiveFilters = Boolean(
    currentType || currentStatus || currentWarehouse || currentCategory
  );

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              Active
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 font-medium transition cursor-pointer self-start md:self-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Document Type Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Document Type
          </label>
          <select
            value={currentType}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="w-full text-xs font-medium px-3 py-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
          >
            <option value="">All Document Types</option>
            <option value="receipt">Receipts</option>
            <option value="delivery">Deliveries</option>
            <option value="internal">Internal Transfers</option>
            <option value="adjustment">Adjustments</option>
          </select>
        </div>

        {/* 2. Status Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={currentStatus}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full text-xs font-medium px-3 py-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="waiting">Waiting</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {/* 3. Warehouse Dropdown (Live from Supabase) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Warehouse
          </label>
          <select
            value={currentWarehouse}
            onChange={(e) => handleFilterChange("warehouse", e.target.value)}
            className="w-full text-xs font-medium px-3 py-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Product Category Dropdown (Live from Supabase) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Product Category
          </label>
          <select
            value={currentCategory}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="w-full text-xs font-medium px-3 py-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function FilterBar(props: FilterBarProps) {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-28 mb-3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="h-9 bg-slate-100 rounded-lg"></div>
            <div className="h-9 bg-slate-100 rounded-lg"></div>
            <div className="h-9 bg-slate-100 rounded-lg"></div>
            <div className="h-9 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      }
    >
      <FilterBarInner {...props} />
    </Suspense>
  );
}
