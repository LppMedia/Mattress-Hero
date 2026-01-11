import { supabase } from '../supabaseClient';
import { InventoryItem } from '../types';

let isOffline = false;
const LOCAL_STORAGE_KEY = 'mattress_hero_inventory';

// Dummy data for demo mode
const DUMMY_DATA: InventoryItem[] = [
  {
    id: 'demo-1',
    sku: 'SKU-8821',
    size: 'Queen',
    brand: 'DreamCloud Luxury',
    condition: 'Como Nuevo',
    price: 450,
    status: 'Available',
    storageLocation: 'Unit 4',
    created_at: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1505693416388-b0346ef3f495?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'demo-2',
    sku: 'SKU-1293',
    size: 'King',
    brand: 'Tempur-Pedic Adapt',
    condition: 'Bueno',
    price: 899,
    status: 'Sold',
    storageLocation: 'Unit 8',
    customerName: 'Tony Stark',
    customerPhone: '555-0199',
    deliveryMethod: 'Delivery',
    deliveryAddress: '10880 Malibu Point, CA',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'demo-3',
    sku: 'SKU-4421',
    size: 'Full',
    brand: 'Casper Original',
    condition: 'Nuevo',
    price: 600,
    status: 'Available',
    storageLocation: 'Unit 1',
    created_at: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1629949009765-413d74917a11?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'demo-4',
    sku: 'SKU-9900',
    size: 'Twin',
    brand: 'IKEA Morgedal',
    condition: 'Con Detalles',
    price: 150,
    status: 'Available',
    storageLocation: 'Pasillo B',
    created_at: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=800'
  }
];

// Helper to get local data
const getLocalData = (): InventoryItem[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
     localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DUMMY_DATA));
     return DUMMY_DATA;
  }
  return JSON.parse(stored);
};

// Helper to set local data
const setLocalData = (data: InventoryItem[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('inventory-change'));
};

export const inventoryService = {
  async fetchAll() {
    // If we already know we are offline, skip network
    if (isOffline) return getLocalData();

    try {
        const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

        if (error) {
            console.warn("Supabase error (switching to offline mode):", error.message);
            isOffline = true;
            return getLocalData();
        }
        
        console.log("Supabase connection successful. Loaded items:", data?.length);
        return data as InventoryItem[];
    } catch (e) {
        console.warn("Network error (switching to offline mode)");
        isOffline = true;
        return getLocalData();
    }
  },

  async seed() {
    if (isOffline) {
        setLocalData(DUMMY_DATA);
        return;
    }
    // Remove IDs to let Supabase generate UUIDs
    const seedData = DUMMY_DATA.map(({ id, created_at, ...item }) => item);
    await supabase.from('inventory').insert(seedData).select();
    window.dispatchEvent(new Event('inventory-change'));
  },

  async uploadImage(imageBlob: Blob): Promise<string | null> {
      if (isOffline) return null;

      try {
          // Generate a unique path: timestamp-random.jpg
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

          // 1. Attempt upload to 'inventory' bucket
          const { data, error } = await supabase.storage
              .from('inventory')
              .upload(fileName, imageBlob, {
                  cacheControl: '3600',
                  upsert: false
              });

          if (error) {
              console.warn("Storage upload failed (bucket might be missing):", error.message);
              return null;
          }

          // 2. Get Public URL
          const { data: publicUrlData } = supabase.storage
              .from('inventory')
              .getPublicUrl(fileName);

          return publicUrlData.publicUrl;
      } catch (e) {
          console.warn("Storage exception:", e);
          return null;
      }
  },

  async add(item: Omit<InventoryItem, 'id' | 'created_at'>) {
    if (isOffline) {
        const newItem: InventoryItem = {
            ...item,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
        };
        const current = getLocalData();
        setLocalData([newItem, ...current]);
        return { error: null };
    }
    
    // Using .select() ensures we get the inserted data back and wait for the commit
    const { data, error } = await supabase.from('inventory').insert([item]).select();
    
    if (error) {
        console.warn("Insert failed, falling back to local storage:", error.message);
        isOffline = true; // Switch app to offline mode
        return this.add(item); // Retry locally
    } else {
        // Trigger manual refresh to be safe (optimistic update helper)
        window.dispatchEvent(new Event('inventory-change'));
    }
    
    return { data, error };
  },

  async update(id: string, updates: Partial<InventoryItem>) {
     if (isOffline) {
        const current = getLocalData();
        const updated = current.map(i => i.id === id ? { ...i, ...updates } : i);
        setLocalData(updated);
        return { error: null };
     }
     const res = await supabase.from('inventory').update(updates).eq('id', id).select();
     if (!res.error) window.dispatchEvent(new Event('inventory-change'));
     return res;
  },

  async bulkUpdate(ids: string[], updates: Partial<InventoryItem>) {
     if (isOffline) {
        const current = getLocalData();
        const updated = current.map(i => ids.includes(i.id) ? { ...i, ...updates } : i);
        setLocalData(updated);
        return { error: null };
     }
     
     const res = await supabase.from('inventory').update(updates).in('id', ids).select();
     if (!res.error) window.dispatchEvent(new Event('inventory-change'));
     return res;
  },

  async delete(id: string) {
      if (isOffline) {
        const current = getLocalData();
        const filtered = current.filter(i => i.id !== id);
        setLocalData(filtered);
        return { error: null };
      }
      
      const res = await supabase.from('inventory').delete().eq('id', id);
      
      if (res.error) {
          // Log explicitly for RLS debugging
          console.error("Supabase DELETE Error:", res.error);
          return res;
      }

      // Explicitly trigger update for the UI subscription
      window.dispatchEvent(new Event('inventory-change'));
      return res;
  },

  isOfflineMode() {
      return isOffline;
  },

  subscribe(onUpdate: () => void) {
      // Local event listener for offline mode updates (and manual triggers)
      const handler = () => onUpdate();
      window.addEventListener('inventory-change', handler);
      
      // Supabase subscription
      let subscription: any = null;
      if (!isOffline) {
          subscription = supabase
            .channel('inventory_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
                onUpdate();
            })
            .subscribe();
      }

      return () => { 
          window.removeEventListener('inventory-change', handler);
          if (subscription) supabase.removeChannel(subscription); 
      };
  }
};