export type MoveType = 'receipt' | 'delivery' | 'internal' | 'adjustment';
export type MoveStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'canceled';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  uom: string;
  qty_on_hand: number;
  reorder_point: number;
}

export interface StockMove {
  id: string;
  product_id: string;
  move_type: MoveType;
  status: MoveStatus;
  from_location: string | null;
  to_location: string | null;
  quantity: number;
  reference: string | null;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
}

export interface Location {
  id: string;
  warehouse_id: string;
  name: string;
  created_at?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

// Alias used in deliveries/transfers/adjustments pages
export type Category = ProductCategory;

export interface StockByLocation {
  id: string;
  product_id: string;
  location_id: string;
  qty: number;
}
