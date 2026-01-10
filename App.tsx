import React, { useState, useEffect, useCallback } from 'react';
import { Zap, LogOut, Box, Plus, DollarSign, WifiOff } from 'lucide-react';
import { AppUser, InventoryItem, ViewState } from './types';
import { inventoryService } from './services/inventoryService';
import { supabase } from './supabaseClient';

// Sub-components
import { LightningLogin } from './components/LightningLogin';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { AddItemView } from './components/AddItemView';
import { SalesView } from './components/SalesView';
import { NavButton } from './components/UIComponents';

export default function MattressHeroApp() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<ViewState>("dashboard");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // --- Auth State Listener ---
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setIsAuthenticated(!!session);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Data Loading Logic ---
  const loadData = useCallback(async () => {
      if (!isAuthenticated) return;
      
      const data = await inventoryService.fetchAll();
      setInventory(data);
      setIsOffline(inventoryService.isOfflineMode());
  }, [isAuthenticated]);

  // --- Initial Load & Subscription ---
  useEffect(() => {
    if (!isAuthenticated) return;

    loadData();

    // Subscribe to changes (both local and remote)
    const unsubscribe = inventoryService.subscribe(() => {
        loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, loadData]);

  // --- Refresh on View Change (Fix for stale data after add) ---
  useEffect(() => {
    if (view === 'inventory') {
        loadData();
    }
  }, [view, loadData]);

  // --- Handlers ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView("dashboard");
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setView('edit');
  };

  if (!isAuthenticated) {
    return <LightningLogin />;
  }

  return (
    <div className="min-h-screen bg-yellow-50 font-sans relative overflow-x-hidden selection:bg-purple-500 selection:text-white pb-24">
      {/* Background Pattern */}
      <div className="fixed inset-0 halftone-pattern pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#6200EA] border-b-4 border-black px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <div className="bg-[#FF6D00] p-1 border-2 border-black rounded rotate-3">
            <Zap className="text-white" size={24} fill="white" />
          </div>
          <h1 className="font-bangers text-3xl text-white tracking-widest drop-shadow-[2px_2px_0_#000]">
            MATTRESS HERO
          </h1>
        </div>
        <button onClick={handleLogout} className="text-white hover:text-red-300">
          <LogOut size={24} strokeWidth={3} />
        </button>
      </header>

      {/* Offline/Demo Banner */}
      {isOffline && (
        <div className="relative z-50 bg-gray-800 text-white p-2 text-center font-bold font-sans border-b-4 border-black flex items-center justify-center gap-2">
            <WifiOff size={20} className="text-[#FF6D00]" />
            <span className="uppercase tracking-wider">Modo Demo / Offline</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 p-4 max-w-md mx-auto">
        {view === 'dashboard' && <DashboardView inventory={inventory} setView={setView} />}
        {view === 'inventory' && <InventoryView inventory={inventory} onEdit={handleEditItem} />}
        {view === 'add' && <AddItemView user={user} setView={setView} />}
        {view === 'edit' && <AddItemView user={user} setView={setView} initialItem={editingItem} />}
        {view === 'sales' && <SalesView inventory={inventory} onEdit={handleEditItem} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t-4 border-black z-50 flex justify-around items-center p-2 pb-safe">
        <NavButton icon={Box} label="Stock" active={view === 'inventory'} onClick={() => setView('inventory')} />
        <NavButton icon={Plus} label="Agregar" active={view === 'add'} onClick={() => { setEditingItem(null); setView('add'); }} isMain />
        <NavButton icon={DollarSign} label="Ventas" active={view === 'sales'} onClick={() => setView('sales')} />
        <NavButton icon={Zap} label="Inicio" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
      </nav>
    </div>
  );
}