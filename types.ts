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
  customerPhone?: string;
  deliveryMethod?: 'Pickup' | 'Delivery';
  deliveryAddress?: string;
  sold_at?: string; // Tracks when the item was actually sold
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

export const STORAGE_LOCATIONS = [
  "Flea Market", 
  "Showroom", 
  "Unit 5", 
  "Unit 7", 
  "Unit 8", 
  "Unit 12", 
  "Unit 13", 
  "Unit 15", 
  "Unit 16", 
  "Unit 22", 
  "Unit 28", 
  "Unit 31", 
  "Unit 34", 
  "Unit 36", 
  "Unit 37", 
  "Unit 43", 
  "Unit 45", 
  "Unit 45 2"
];