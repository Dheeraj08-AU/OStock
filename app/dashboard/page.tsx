"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import AppShell from "@/components/navigation/AppShell";
import FilterBar, { FilterValues } from "@/components/filters/FilterBar";
import {
  Boxes,
  AlertTriangle,
  ArrowDownToLine,
  Truck,
  ArrowLeftRight,
  ArrowUpRight,
  RefreshCw,
  Warehouse,
  Activity,
  Layers,
} from "lucide-react";

interface DashboardMetrics {
  totalInStock: number;
  lowStock: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  internalTransfersScheduled: number;
}

interface StockMoveRow {
  id: string;
  reference: string | null;
  move_type: string;
  status: string;
  quantity: number;
  created_at: string;
  from_location: string | null;
  to_location: string | null;
  products?: {
    id: string;
    name: string;
    sku: string;
  } | null;
  from_loc?: {
    id: string;
    name: string;
  } | null;
  to_loc?: {
    id: string;
    name: string;
  } | null;
}

export default function DashboardPage() {
  const supabase = createClient();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalInStock: 0,
    lowStock: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    internalTransfersScheduled: 0,
  });

  const [recentMoves, setRecentMoves] = useState<StockMoveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setActiveFilters] = useState<FilterValues>({});

  const loadDashboardData = useCallback(async () => {
    try {
      // 1. Live Products Query: qty_on_hand > 0 and qty_on_hand <= reorder_point
      const { data: productsData, error: prodErr } = await supabase
        .from("products")
        .select("id, qty_on_hand, reorder_point");

      let totalInStockCount = 0;
      let lowStockCount = 0;

      if (!prodErr && productsData) {
        totalInStockCount = productsData.filter(
          (p) => Number(p.qty_on_hand) > 0
        ).length;
        lowStockCount = productsData.filter(
          (p) => Number(p.qty_on_hand) <= Number(p.reorder_point)
        ).length;
      }

      // 2. Pending Receipts: move_type = 'receipt' and status != 'done'
      const { data: pendingReceiptsData } = await supabase
        .from("stock_moves")
        .select("id")
        .eq("move_type", "receipt")
        .neq("status", "done");

      const pendingReceiptsCount = pendingReceiptsData?.length ?? 0;

      // 3. Pending Deliveries: move_type = 'delivery' and status != 'done'
      const { data: pendingDeliveriesData } = await supabase
        .from("stock_moves")
        .select("id")
        .eq("move_type", "delivery")
        .neq("status", "done");

      const pendingDeliveriesCount = pendingDeliveriesData?.length ?? 0;

      // 4. Internal Transfers Scheduled: move_type = 'internal' and status in ('draft', 'waiting')
      const { data: internalTransfersData } = await supabase
        .from("stock_moves")
        .select("id")
        .eq("move_type", "internal")
        .in("status", ["draft", "waiting"]);

      const internalTransfersCount = internalTransfersData?.length ?? 0;

      setMetrics({
        totalInStock: totalInStockCount,
        lowStock: lowStockCount,
        pendingReceipts: pendingReceiptsCount,
        pendingDeliveries: pendingDeliveriesCount,
        internalTransfersScheduled: internalTransfersCount,
      });

      // 5. Recent Stock Operations: live query ordered by created_at desc joined with products & locations
      // Try full relation join first; if foreign key differs, fall back to simple select
      let moves: StockMoveRow[] = [];
      const { data: joinedMovesData, error: joinErr } = await supabase
        .from("stock_moves")
        .select(
          `
          id,
          reference,
          move_type,
          status,
          quantity,
          created_at,
          from_location,
          to_location,
          products (
            id,
            name,
            sku
          ),
          from_loc:locations!from_location (
            id,
            name
          ),
          to_loc:locations!to_location (
            id,
            name
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (!joinErr && joinedMovesData) {
        // PostgREST may return joined objects or arrays depending on relationship definition
        moves = (joinedMovesData as unknown[]).map((m: any) => ({
          ...m,
          products: Array.isArray(m.products) ? m.products[0] : m.products,
          from_loc: Array.isArray(m.from_loc) ? m.from_loc[0] : m.from_loc,
          to_loc: Array.isArray(m.to_loc) ? m.to_loc[0] : m.to_loc,
        }));
      } else {
        // Fallback without named joins if foreign key aliases differ
        const { data: rawMoves } = await supabase
          .from("stock_moves")
          .select(
            "id, reference, move_type, status, quantity, created_at, from_location, to_location, product_id"
          )
          .order("created_at", { ascending: false })
          .limit(10);

        if (rawMoves) {
          moves = rawMoves as StockMoveRow[];
        }
      }

      setRecentMoves(moves);
    } catch {
      setMetrics({
        totalInStock: 0,
        lowStock: 0,
        pendingReceipts: 0,
        pendingDeliveries: 0,
        internalTransfersScheduled: 0,
      });
      setRecentMoves([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const kpis = [
    {
      title: "Total In Stock",
      subtitle: "Products with qty > 0",
      value: metrics.totalInStock,
      href: "/products",
      color: "from-blue-600 to-blue-700",
      accentBg: "bg-blue-50",
      accentText: "text-blue-600",
      icon: Boxes,
      badge: metrics.totalInStock > 0 ? "Healthy" : "0 Units",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    {
      title: "Low / Out of Stock",
      subtitle: "Qty ≤ Reorder point",
      value: metrics.lowStock,
      href: "/products?status=low_stock",
      color: "from-amber-500 to-red-500",
      accentBg: "bg-red-50",
      accentText: "text-red-600",
      icon: AlertTriangle,
      badge: metrics.lowStock > 0 ? "Attention Needed" : "Optimal",
      badgeColor:
        metrics.lowStock > 0
          ? "bg-red-100 text-red-800"
          : "bg-emerald-100 text-emerald-800",
    },
    {
      title: "Pending Receipts",
      subtitle: "Inbound not done",
      value: metrics.pendingReceipts,
      href: "/receipts?status=waiting",
      color: "from-indigo-600 to-indigo-700",
      accentBg: "bg-indigo-50",
      accentText: "text-indigo-600",
      icon: ArrowDownToLine,
      badge: "Inbound",
      badgeColor: "bg-indigo-100 text-indigo-800",
    },
    {
      title: "Pending Deliveries",
      subtitle: "Outbound not done",
      value: metrics.pendingDeliveries,
      href: "/deliveries?status=waiting",
      color: "from-violet-600 to-purple-700",
      accentBg: "bg-purple-50",
      accentText: "text-purple-600",
      icon: Truck,
      badge: "Outbound",
      badgeColor: "bg-purple-100 text-purple-800",
    },
    {
      title: "Internal Transfers",
      subtitle: "Draft & Waiting transfers",
      value: metrics.internalTransfersScheduled,
      href: "/transfers?status=waiting",
      color: "from-cyan-600 to-teal-700",
      accentBg: "bg-teal-50",
      accentText: "text-teal-600",
      icon: ArrowLeftRight,
      badge: "Scheduled",
      badgeColor: "bg-teal-100 text-teal-800",
    },
  ];

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time inventory metrics and stock flow tracking
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>

            <Link
              href="/settings/warehouses"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/30 transition"
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Manage Warehouses</span>
            </Link>
          </div>
        </div>

        {/* Reusable Filter Bar at the top of Dashboard (Live Supabase Data) */}
        <FilterBar onChange={(f) => setActiveFilters(f)} syncUrl={true} />

        {/* 5 KPI Cards in a responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={idx}
                href={kpi.href}
                className="group relative bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-blue-300 transition duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Accent top bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${kpi.color} opacity-80 group-hover:opacity-100 transition`}
                />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={`p-2.5 rounded-xl ${kpi.accentBg} ${kpi.accentText}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${kpi.badgeColor}`}
                    >
                      {kpi.badge}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {kpi.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {kpi.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {loading ? "..." : kpi.value}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition">
                    <span>View</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Operations & Quick Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Operations List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Recent Stock Operations
                </h2>
              </div>
              <Link
                href="/history"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View all &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading live operations...
              </div>
            ) : recentMoves.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">
                  No stock operations yet.
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Receipts, deliveries, and internal transfers logged in
                  Supabase will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3 font-medium">Reference</th>
                      <th className="pb-3 font-medium">Product</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">From / To</th>
                      <th className="pb-3 font-medium">Qty</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentMoves.map((move) => {
                      const productName =
                        move.products?.name || "Unspecified Product";
                      const productSku = move.products?.sku;
                      const fromDisplay =
                        move.from_loc?.name || move.from_location || "—";
                      const toDisplay =
                        move.to_loc?.name || move.to_location || "—";

                      return (
                        <tr
                          key={move.id}
                          className="hover:bg-slate-50/70 transition"
                        >
                          <td className="py-3 font-semibold text-slate-800">
                            {move.reference || move.id.slice(0, 8)}
                          </td>
                          <td className="py-3 text-slate-700">
                            <span className="font-semibold block truncate max-w-[150px]">
                              {productName}
                            </span>
                            {productSku && (
                              <span className="text-[10px] text-slate-400">
                                SKU: {productSku}
                              </span>
                            )}
                          </td>
                          <td className="py-3 capitalize text-slate-600">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium text-[11px] bg-slate-100 text-slate-700">
                              {move.move_type}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">
                            {fromDisplay} &rarr; {toDisplay}
                          </td>
                          <td className="py-3 font-bold text-slate-900">
                            {move.quantity}
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                move.status === "done"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : move.status === "waiting"
                                  ? "bg-amber-100 text-amber-800"
                                  : move.status === "ready"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {move.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Operations Portal */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                Quick Action Shortcuts
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Jump directly into standard inventory workflows
              </p>

              <div className="space-y-2.5">
                <Link
                  href="/receipts"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                      <ArrowDownToLine className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                        Receive Goods
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Inbound shipments from suppliers
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                </Link>

                <Link
                  href="/deliveries"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
                        Deliver Orders
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Pick, pack, and validate customer shipments
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
                </Link>

                <Link
                  href="/transfers"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-teal-700">
                        Internal Transfer
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Move between locations or racks
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
                </Link>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-2xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Warehouses configured
                </span>
                <Link
                  href="/settings/warehouses"
                  className="text-blue-600 font-bold hover:underline"
                >
                  Configure &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
