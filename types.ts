export interface InventoryItem {
  id: string; // Supabase usually uses int or uuid, string handles uuid fine
  sku: string;
  size: string;
  brand: string;
  condition: string;
  price: number;
  status: 'Available' | 'Sold' | 'Delivered';
  image?: string;
  created_at?: string; // Postgres timestamp
  
  // New Fields
  storageLocation?: string;
  customerName?: string;
  deliveryMethod?: 'Pickup' | 'Delivery';
  deliveryAddress?: string;
}

export type ViewState = 'dashboard' | 'inventory' | 'add' | 'sales' | 'edit';

export interface AppUser {
  id: string;
  email?: string;
}

export interface NavProps {
  view: ViewState;
  setView: (view: ViewState) => void;
}