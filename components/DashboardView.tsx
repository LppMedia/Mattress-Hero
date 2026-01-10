import React, { useState } from 'react';
import { Box, DollarSign, Database, X, Calendar, ClipboardList } from 'lucide-react';
import { InventoryItem, ViewState } from '../types';
import { ComicText, ComicButton, StatCard } from './UIComponents';
import { inventoryService } from '../services/inventoryService';

interface DashboardViewProps {
  inventory: InventoryItem[];
  setView: (view: ViewState) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ inventory, setView }) => {
  const [seeding, setSeeding] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);

  const totalItems = inventory.filter(i => i.status === 'Available').length;
  
  // Sold Items Logic
  const soldItems = inventory.filter(i => i.status === 'Sold' || i.status === 'Delivered');
  const totalSoldValue = soldItems.reduce((sum, item) => sum + item.price, 0);

  // Stock Calculation Logic
  const sizes = ['Twin', 'Twin XL', 'Full', 'Queen', 'King', 'Cal King'];
  
  const getStockCount = (size: string) => {
    return inventory.filter(i => i.size === size && i.status === 'Available').length;
  };

  const handleSeedData = async () => {
    setSeeding(true);
    await inventoryService.seed();
    setSeeding(false);
  };

  // --- SALES HISTORY MODAL ---
  const SalesHistoryModal = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowSalesHistory(false)}>
          <div className="bg-white border-4 border-black rounded-xl w-full max-w-lg h-[80vh] flex flex-col shadow-[8px_8px_0px_0px_#FF6D00]" onClick={e => e.stopPropagation()}>
              
              {/* Header */}
              <div className="bg-[#6200EA] p-4 flex justify-between items-center border-b-4 border-black">
                  <div className="flex items-center gap-2 text-white">
                      <DollarSign size={28} strokeWidth={3} />
                      <span className="font-bangers text-2xl tracking-wide">HISTORIAL DE VENTAS</span>
                  </div>
                  <button onClick={() => setShowSalesHistory(false)} className="text-white hover:text-red-300">
                      <X size={28} strokeWidth={3} />
                  </button>
              </div>

              {/* Total Banner */}
              <div className="bg-green-100 p-3 border-b-4 border-black text-center">
                  <span className="font-bold text-gray-600 text-sm uppercase">Total Generado</span>
                  <div className="font-bangers text-4xl text-[#00E676] drop-shadow-[1px_1px_0_#000]">
                      ${totalSoldValue.toLocaleString()}
                  </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-yellow-50">
                  {soldItems.length === 0 ? (
                      <div className="text-center opacity-50 mt-10">
                          <div className="font-bangers text-xl">SIN VENTAS AÚN</div>
                          <p className="text-sm font-bold">¡Empieza a vender para llenar este historial!</p>
                      </div>
                  ) : (
                      // Sort by most recent (assuming created_at is the proxy for now)
                      soldItems.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).map(item => (
                          <div key={item.id} className="bg-white border-2 border-black p-3 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] flex justify-between items-center">
                              <div>
                                  <div className="flex items-center gap-1 text-xs font-bold text-gray-400 mb-1">
                                      <Calendar size={10} />
                                      {/* Using created_at as date placeholder. In a real app, use sold_at */}
                                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Fecha desc.'}
                                  </div>
                                  <div className="font-bangers text-lg leading-none text-black">{item.brand}</div>
                                  <div className="text-xs font-bold uppercase text-gray-500 mt-1">
                                      {item.size} • {item.customerName || 'Cliente Anónimo'}
                                  </div>
                              </div>
                              <div className="flex flex-col items-end">
                                  <span className="font-bangers text-2xl text-[#FF6D00]">${item.price}</span>
                                  <span className="text-[10px] font-bold bg-gray-200 px-1 rounded border border-black">
                                      {item.deliveryMethod === 'Delivery' ? 'ENVÍO' : 'RETIRO'}
                                  </span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      {showSalesHistory && <SalesHistoryModal />}

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Stock" value={totalItems} icon={Box} color="bg-[#FF6D00]" />
        {/* Made clickable to show history */}
        <StatCard 
            title="Ventas Totales" 
            value={soldItems.length} 
            icon={DollarSign} 
            color="bg-[#00E676]" 
            onClick={() => setShowSalesHistory(true)}
        />
      </div>

      {/* NEW STOCK LEVELS GRID */}
      <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[5px_5px_0px_0px_#000]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-black" />
            <ComicText className="text-black" style={{ textShadow: 'none' }}>NIVEL DE STOCK</ComicText>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
            {sizes.map(size => {
                const count = getStockCount(size);
                const isLow = count < 3;
                return (
                    <div 
                        key={size} 
                        className={`
                            border-2 border-black p-2 flex justify-between items-center rounded
                            ${isLow ? 'bg-red-50' : 'bg-green-50'}
                        `}
                    >
                        <span className="font-bold text-sm uppercase text-gray-700">{size}</span>
                        <div className={`
                            font-bangers text-xl px-2 border-2 border-black rounded 
                            ${isLow ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-black'}
                        `}>
                            {count}
                        </div>
                    </div>
                )
            })}
        </div>
        
        {/* Summary Footer */}
        <div className="mt-4 pt-2 border-t-2 border-dashed border-gray-300 text-center">
            <p className="text-xs font-bold text-gray-400">
                Los ítems en rojo tienen menos de 3 unidades.
            </p>
        </div>
      </div>

      <ComicButton className="w-full" variant="accent" onClick={() => setView('add')}>
        AGREGAR NUEVO BOTÍN
      </ComicButton>

      {/* Seed Data Button - Only shows if inventory is completely empty */}
      {inventory.length === 0 && (
          <div className="mt-8 p-6 bg-gray-100 border-4 border-dashed border-gray-400 rounded-xl text-center space-y-4">
              <h3 className="font-bangers text-2xl text-gray-500">¿BÚNKER VACÍO?</h3>
              <ComicButton 
                className="w-full" 
                variant="magic" 
                icon={Database} 
                onClick={handleSeedData}
                isLoading={seeding}
              >
                GENERAR DATOS DEMO
              </ComicButton>
          </div>
      )}
    </div>
  );
};