"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/navigation/AppShell";
import { createClient } from "@/utils/supabase/client";
import { Warehouse as WarehouseType, Location as LocationType } from "@/types";
import {
  Warehouse as WarehouseIcon,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";

interface WarehouseWithLocations extends WarehouseType {
  locations: LocationType[];
}

export default function WarehousesSettingsPage() {
  const supabase = createClient();

  const [warehouses, setWarehouses] = useState<WarehouseWithLocations[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWarehouseId, setExpandedWarehouseId] = useState<string | null>(
    null
  );

  // Warehouse Modal State
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] =
    useState<WarehouseType | null>(null);
  const [whName, setWhName] = useState("");
  const [whAddress, setWhAddress] = useState("");

  // Location Modal State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationTargetWarehouseId, setLocationTargetWarehouseId] = useState<
    string | null
  >(null);
  const [editingLocation, setEditingLocation] = useState<LocationType | null>(
    null
  );
  const [locName, setLocName] = useState("");

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Live query to warehouses
      const { data: whData, error: whError } = await supabase
        .from("warehouses")
        .select("*")
        .order("name", { ascending: true });

      // Live query to locations
      const { data: locData, error: locError } = await supabase
        .from("locations")
        .select("*")
        .order("name", { ascending: true });

      if (!whError && whData) {
        const combined: WarehouseWithLocations[] = whData.map((wh) => ({
          ...wh,
          locations:
            locData && !locError
              ? locData.filter((l) => l.warehouse_id === wh.id)
              : [],
        }));
        setWarehouses(combined);
        if (combined.length > 0 && !expandedWarehouseId) {
          setExpandedWarehouseId(combined[0].id);
        }
      } else {
        setWarehouses([]);
        if (whError) {
          showToast(whError.message, "error");
        }
      }
    } catch (err: unknown) {
      setWarehouses([]);
      showToast(
        err instanceof Error ? err.message : "Failed to load warehouses",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, expandedWarehouseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // WAREHOUSE CRUD (100% Live Supabase mutations)
  const handleOpenWarehouseModal = (wh?: WarehouseType) => {
    if (wh) {
      setEditingWarehouse(wh);
      setWhName(wh.name);
      setWhAddress(wh.address || "");
    } else {
      setEditingWarehouse(null);
      setWhName("");
      setWhAddress("");
    }
    setIsWarehouseModalOpen(true);
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim()) return;
    setSaving(true);

    try {
      if (editingWarehouse) {
        // Live Update
        const { error } = await supabase
          .from("warehouses")
          .update({ name: whName.trim(), address: whAddress.trim() })
          .eq("id", editingWarehouse.id);

        if (error) {
          showToast(error.message, "error");
          setSaving(false);
          return;
        }

        setWarehouses((prev) =>
          prev.map((w) =>
            w.id === editingWarehouse.id
              ? { ...w, name: whName.trim(), address: whAddress.trim() }
              : w
          )
        );
        showToast("Warehouse updated successfully");
      } else {
        // Live Insert
        const { data, error } = await supabase
          .from("warehouses")
          .insert([{ name: whName.trim(), address: whAddress.trim() }])
          .select()
          .single();

        if (error) {
          showToast(error.message, "error");
          setSaving(false);
          return;
        }

        if (data) {
          setWarehouses((prev) => [...prev, { ...data, locations: [] }]);
          setExpandedWarehouseId(data.id);
          showToast("Warehouse created successfully");
        }
      }
      setIsWarehouseModalOpen(false);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to save warehouse",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWarehouse = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete warehouse "${name}"?`)) return;

    try {
      const { error } = await supabase.from("warehouses").delete().eq("id", id);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      setWarehouses((prev) => prev.filter((w) => w.id !== id));
      showToast(`Warehouse "${name}" deleted`);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete warehouse",
        "error"
      );
    }
  };

  // LOCATION CRUD (100% Live Supabase mutations)
  const handleOpenLocationModal = (
    warehouseId: string,
    loc?: LocationType
  ) => {
    setLocationTargetWarehouseId(warehouseId);
    if (loc) {
      setEditingLocation(loc);
      setLocName(loc.name);
    } else {
      setEditingLocation(null);
      setLocName("");
    }
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim() || !locationTargetWarehouseId) return;
    setSaving(true);

    try {
      if (editingLocation) {
        // Live Update
        const { error } = await supabase
          .from("locations")
          .update({ name: locName.trim() })
          .eq("id", editingLocation.id);

        if (error) {
          showToast(error.message, "error");
          setSaving(false);
          return;
        }

        setWarehouses((prev) =>
          prev.map((wh) =>
            wh.id === locationTargetWarehouseId
              ? {
                  ...wh,
                  locations: wh.locations.map((l) =>
                    l.id === editingLocation.id
                      ? { ...l, name: locName.trim() }
                      : l
                  ),
                }
              : wh
          )
        );
        showToast("Location updated");
      } else {
        // Live Insert
        const { data, error } = await supabase
          .from("locations")
          .insert([
            {
              warehouse_id: locationTargetWarehouseId,
              name: locName.trim(),
            },
          ])
          .select()
          .single();

        if (error) {
          showToast(error.message, "error");
          setSaving(false);
          return;
        }

        if (data) {
          setWarehouses((prev) =>
            prev.map((wh) =>
              wh.id === locationTargetWarehouseId
                ? { ...wh, locations: [...wh.locations, data] }
                : wh
            )
          );
          showToast("Location added under warehouse");
        }
      }
      setIsLocationModalOpen(false);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to save location",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (
    warehouseId: string,
    locationId: string,
    locName: string
  ) => {
    if (!confirm(`Delete location "${locName}"?`)) return;

    try {
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", locationId);

      if (error) {
        showToast(error.message, "error");
        return;
      }

      setWarehouses((prev) =>
        prev.map((wh) =>
          wh.id === warehouseId
            ? {
                ...wh,
                locations: wh.locations.filter((l) => l.id !== locationId),
              }
            : wh
        )
      );
      showToast(`Location "${locName}" removed`);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete location",
        "error"
      );
    }
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Toast Alert */}
        {toastMsg && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-2 ${
              toastMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <WarehouseIcon className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Warehouses & Locations
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure facilities and their storage zones / racks referenced by
              stock movements
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenWarehouseModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Warehouse</span>
          </button>
        </div>

        {/* Warehouses List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading warehouses...</p>
          </div>
        ) : warehouses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <WarehouseIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No warehouses found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
              Get started by creating your primary warehouse or fulfillment center.
            </p>
            <button
              type="button"
              onClick={() => handleOpenWarehouseModal()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Warehouse</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {warehouses.map((wh) => {
              const isExpanded = expandedWarehouseId === wh.id;
              return (
                <div
                  key={wh.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
                >
                  {/* Warehouse Card Header */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0 mt-0.5">
                        <WarehouseIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-base font-bold text-slate-900">
                            {wh.name}
                          </h2>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            <Layers className="w-3 h-3 text-slate-400" />
                            {wh.locations.length}{" "}
                            {wh.locations.length === 1
                              ? "Location"
                              : "Locations"}
                          </span>
                        </div>
                        {wh.address ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{wh.address}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic mt-1">
                            No physical address specified
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenLocationModal(wh.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100/70 text-blue-700 text-xs font-semibold transition cursor-pointer"
                        title="Add Location/Rack to this warehouse"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Location</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenWarehouseModal(wh)}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                        title="Edit Warehouse"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteWarehouse(wh.id, wh.name)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete Warehouse"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedWarehouseId(isExpanded ? null : wh.id)
                        }
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                        title="Toggle locations"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Nested Locations Section */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Nested Locations & Racks ({wh.locations.length})
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenLocationModal(wh.id)}
                          className="text-xs text-blue-600 font-semibold hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Rack / Bin</span>
                        </button>
                      </div>

                      {wh.locations.length === 0 ? (
                        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center">
                          <p className="text-xs text-slate-500 mb-2">
                            No locations or racks configured under {wh.name} yet.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenLocationModal(wh.id)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add first location (e.g. Rack A, Shelf 1)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {wh.locations.map((loc) => (
                            <div
                              key={loc.id}
                              className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex items-center justify-between group hover:border-blue-300 transition"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {loc.name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  ID: {loc.id.slice(0, 8)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenLocationModal(wh.id, loc)
                                  }
                                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                  title="Edit location name"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteLocation(
                                      wh.id,
                                      loc.id,
                                      loc.name
                                    )
                                  }
                                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  title="Delete location"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Warehouse Modal */}
        {isWarehouseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  {editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveWarehouse} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Warehouse Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    placeholder="e.g. West Coast Distribution"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Address / Physical Location
                  </label>
                  <textarea
                    rows={3}
                    value={whAddress}
                    onChange={(e) => setWhAddress(e.target.value)}
                    placeholder="e.g. 100 Port Rd, Oakland, CA"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsWarehouseModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-60"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Warehouse</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Location Modal */}
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  {editingLocation ? "Edit Location / Rack" : "Add Location / Rack"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveLocation} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    placeholder="e.g. Rack A-1, Shelf 3, Bin 04"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    This location will be selectable in stock moves, receipts,
                    deliveries, and internal transfers.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-60"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Location</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
