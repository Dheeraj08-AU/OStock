'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Product, Location } from '@/types';
import { X, Info } from 'lucide-react';

interface Props { onClose: () => void; onCreated: () => void; }

export default function NewTransferModal({ onClose, onCreated }: Props) {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [productId, setProductId] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fromQty, setFromQty] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('products').select('*').then(({ data }) => data && setProducts(data));
    supabase.from('locations').select('*').then(({ data }) => data && setLocations(data));
  }, []);

  useEffect(() => {
    if (!productId || !fromLocation) { setFromQty(null); return; }
    supabase.from('stock_by_location').select('qty').eq('product_id', productId).eq('location_id', fromLocation).maybeSingle()
      .then(({ data }) => setFromQty(data?.qty ?? 0));
  }, [productId, fromLocation]);

  const handleSubmit = async () => {
    setError('');
    if (!productId) { setError('Select a product.'); return; }
    if (!fromLocation) { setError('Select a source location.'); return; }
    if (!toLocation) { setError('Select a destination location.'); return; }
    // CRITICAL: from and to must be different
    if (fromLocation === toLocation) { setError('Source and destination locations must be different.'); return; }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) { setError('Enter a valid positive quantity.'); return; }
    const available = fromQty ?? 0;
    if (qty > available) {
      setError(`Insufficient stock at source: only ${available} available, ${qty} requested.`);
      return;
    }
    setSubmitting(true);

    // CRITICAL INVARIANT: products.qty_on_hand MUST NOT CHANGE for internal transfers.
    // Only stock_by_location changes: decrement source, increment destination.
    // Verify after: SELECT SUM(qty) FROM stock_by_location WHERE product_id='<id>'
    //               should equal SELECT qty_on_hand FROM products WHERE id='<id>'
    const { error: moveErr } = await supabase.from('stock_moves').insert({
      product_id: productId, move_type: 'internal', status: 'done',
      from_location: fromLocation, to_location: toLocation,
      quantity: qty, reference: note.trim() || null,
    });
    if (moveErr) { setError(`Failed: ${moveErr.message}`); setSubmitting(false); return; }

    await supabase.from('stock_by_location').upsert(
      { product_id: productId, location_id: fromLocation, qty: Math.max(0, available - qty) },
      { onConflict: 'product_id,location_id' }
    );

    const { data: toStock } = await supabase.from('stock_by_location').select('qty').eq('product_id', productId).eq('location_id', toLocation).maybeSingle();
    await supabase.from('stock_by_location').upsert(
      { product_id: productId, location_id: toLocation, qty: (toStock?.qty ?? 0) + qty },
      { onConflict: 'product_id,location_id' }
    );
    // NOTE: products.qty_on_hand intentionally NOT updated here — total stock unchanged.

    setSubmitting(false);
    onCreated();
  };

  const selectedProduct = products.find(p => p.id === productId);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">New Internal Transfer</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">⚠ {error}</div>}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Internal transfers do not change the total on-hand quantity — only the per-location distribution changes.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Product *</label>
            <select id="transfer-product" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 cursor-pointer" value={productId} onChange={e => setProductId(e.target.value)}>
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} — On-Hand: {p.qty_on_hand} {p.uom}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">From Location *</label>
              <select id="transfer-from" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 cursor-pointer" value={fromLocation} onChange={e => setFromLocation(e.target.value)}>
                <option value="">Select source…</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              {fromQty !== null && <p className={`text-xs mt-1 font-medium ${fromQty === 0 ? 'text-red-500' : 'text-emerald-600'}`}>Stock here: {fromQty} {selectedProduct?.uom}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To Location *</label>
              <select id="transfer-to" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 cursor-pointer" value={toLocation} onChange={e => setToLocation(e.target.value)}>
                <option value="">Select destination…</option>
                {locations.filter(l => l.id !== fromLocation).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Quantity *</label>
            <input id="transfer-qty" type="number" min="0.01" step="any" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
            <input id="transfer-note" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" placeholder="e.g. Moving to production floor…" value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer">Cancel</button>
          <button id="btn-submit-transfer" onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer shadow-sm shadow-blue-200">
            {submitting ? '⏳ Processing…' : '🔄 Execute Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
}
