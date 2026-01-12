import React, { useState } from 'react';
import { Box, DollarSign, Database, X, Calendar, ClipboardList, Trash2, AlertCircle, MapPin, Clock, Phone, Edit } from 'lucide-react';
import { InventoryItem, ViewState } from '../types';
import { ComicText, ComicButton, StatCard } from './UIComponents';
import { inventoryService } from '../services/inventoryService';

interface DashboardViewProps {
  inventory: InventoryItem[];
  setView: (view: ViewState) => void;
  onEdit?: (item: InventoryItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ inventory, setView, onEdit }) => {
  const [seeding, setSeeding] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [salesFilter, setSalesFilter] = useState<'all' | 'week'>('all');
  
  // State for deletion logic
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalItems = inventory.filter(i => i.status === 'Available').length;
  
  // Sold Items Logic
  const allSoldItems = inventory.filter(i => i.status === 'Sold' || i.status === 'Delivered');

  // Filter sold items based on selection
  const filteredSoldItems = allSoldItems.filter(item => {
      if (salesFilter === 'all') return true;
      
      // Weekly Logic: Last 7 Days
      // Use sold_at if available, otherwise fallback to created_at (for demo data or older records)
      const dateStr = item.sold_at || item.created_at; 
      if (!dateStr) return false;
      
      const itemDate = new Date(dateStr);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      return itemDate >= sevenDaysAgo;
  });

  const displayedTotalValue = filteredSoldItems.reduce((sum, item) => sum + item.price, 0);

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

  const handleDeleteSale = async () => {
      if (!saleToDelete) return;
      setIsDeleting(true);
      try {
          await inventoryService.delete(saleToDelete);
          // The subscription in App.tsx will auto-refresh inventory
          setSaleToDelete(null); 
      } catch (e) {
          console.error("Failed to delete sale record", e);
          alert("Error removing record");
      } finally {
          setIsDeleting(false);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* SALES HISTORY MODAL */}
      {showSalesHistory && (
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

                {/* Filter Tabs */}
                <div className="flex border-b-4 border-black bg-gray-100">
                    <button 
                        onClick={() => setSalesFilter('all')}
                        className={`flex-1 py-2 font-bangers tracking-wide text-lg flex justify-center items-center gap-2 transition-colors ${salesFilter === 'all' ? 'bg-white text-black' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                    >
                       <Database size={16} /> TODOS (HISTÓRICO)
                    </button>
                    <button 
                        onClick={() => setSalesFilter('week')}
                        className={`flex-1 py-2 font-bangers tracking-wide text-lg flex justify-center items-center gap-2 border-l-2 border-black transition-colors ${salesFilter === 'week' ? 'bg-white text-black' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                    >
                       <Clock size={16} /> ÚLTIMOS 7 DÍAS
                    </button>
                </div>

                {/* Total Banner */}
                <div className="bg-green-100 p-3 border-b-4 border-black text-center">
                    <span className="font-bold text-gray-600 text-sm uppercase">
                        {salesFilter === 'week' ? 'Generado esta Semana' : 'Total Generado Histórico'}
                    </span>
                    <div className="font-bangers text-4xl text-[#00E676] drop-shadow-[1px_1px_0_#000]">
                        ${displayedTotalValue.toLocaleString()}
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-yellow-50">
                    {filteredSoldItems.length === 0 ? (
                        <div className="text-center opacity-50 mt-10">
                            <div className="font-bangers text-xl">SIN VENTAS</div>
                            <p className="text-sm font-bold">
                                {salesFilter === 'week' 
                                    ? 'No hay ventas en los últimos 7 días.' 
                                    : '¡Empieza a vender para llenar este historial!'
                                }
                            </p>
                        </div>
                    ) : (
                        // Sort by most recent
                        filteredSoldItems.sort((a, b) => new Date(b.sold_at || b.created_at || 0).getTime() - new Date(a.sold_at || a.created_at || 0).getTime()).map(item => (
                            <div key={item.id} className="bg-white border-2 border-black p-3 rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] flex gap-3 items-center">
                                {/* Image Thumbnail */}
                                <div className="w-16 h-16 bg-gray-100 border-2 border-black shrink-0 overflow-hidden">
                                    {item.image ? (
                                        <img src={item.image} alt={item.brand} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Box size={20} />
                                        </div>
                                    )}
                                </div>

                                {/* Text Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-400 mb-1">
                                        <Calendar size={10} />
                                        {/* Show sold date if available, else created date */}
                                        {item.sold_at 
                                            ? new Date(item.sold_at).toLocaleDateString() 
                                            : (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Fecha desc.')
                                        }
                                        {item.sold_at && <span className="bg-green-100 text-green-800 px-1 rounded text-[9px]">VENDIDO</span>}
                                    </div>
                                    <div className="font-bangers text-lg leading-none text-black truncate">{item.brand}</div>
                                    <div className="text-xs font-bold uppercase text-gray-500 mt-1 truncate">
                                        {item.size} • {item.customerName || 'Cliente Anónimo'}
                                    </div>
                                    {/* SHOW PHONE NUMBER FOR VERIFICATION */}
                                    {item.customerPhone && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-1">
                                            <Phone size={10} /> {item.customerPhone}
                                        </div>
                                    )}

                                    {/* Address Display for Delivery items */}
                                    {item.deliveryMethod === 'Delivery' && item.deliveryAddress && (
                                        <div className="text-[10px] font-bold text-gray-600 mt-1 flex items-start gap-1 bg-gray-50 p-1 rounded border border-gray-200">
                                            <MapPin size={10} className="mt-0.5 shrink-0 text-red-500" />
                                            <span className="leading-tight line-clamp-2">{item.deliveryAddress}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Price & Actions */}
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className="font-bangers text-2xl text-[#FF6D00]">${item.price}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold bg-gray-200 px-1 rounded border border-black">
                                            {item.deliveryMethod === 'Delivery' ? 'ENVÍO' : 'RETIRO'}
                                        </span>
                                        
                                        {/* EDIT BUTTON (New) */}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit?.(item);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200 transition-all"
                                            title="Editar / Corregir Venta"
                                        >
                                            <Edit size={16} />
                                        </button>

                                        {/* DELETE BUTTON */}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSaleToDelete(item.id);
                                            }}
                                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-all"
                                            title="Eliminar registro permanentemente"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {/* RETRO DELETE MODAL */}
      {saleToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[1px]" onClick={(e) => e.stopPropagation()}>
            <div className="w-[320px] bg-[#C0C0C0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black shadow-2xl p-1 font-sans select-none" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-[#000080] px-2 py-1 flex justify-between items-center mb-4 cursor-default">
                    <span className="text-white font-bold text-sm tracking-wide">Confirmación</span>
                    <button 
                        onClick={() => setSaleToDelete(null)} 
                        className="bg-[#C0C0C0] w-5 h-5 flex items-center justify-center border-t border-l border-t-white border-l-white border-b border-r border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white focus:outline-none"
                    >
                        <X size={14} className="text-black" strokeWidth={3} />
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex items-center gap-4 px-4 py-2 mb-6">
                    <div className="relative">
                        <AlertCircle size={42} className="text-red-600" strokeWidth={2.5} />
                    </div>
                    <p className="text-black text-sm font-medium leading-tight">
                        ¿Eliminar este registro de venta permanentemente?
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex justify-center gap-6 mb-4">
                    <button 
                        onClick={handleDeleteSale}
                        disabled={isDeleting}
                        className="w-20 py-1 bg-[#C0C0C0] text-black text-sm border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white focus:outline-black focus:outline-dashed focus:outline-1 disabled:opacity-50"
                    >
                        {isDeleting ? '...' : 'Sí'}
                    </button>
                    <button 
                        onClick={() => setSaleToDelete(null)}
                        disabled={isDeleting}
                        className="w-20 py-1 bg-[#C0C0C0] text-black text-sm border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white focus:outline-black focus:outline-dashed focus:outline-1"
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Stock" value={totalItems} icon={Box} color="bg-[#FF6D00]" />
        {/* Made clickable to show history */}
        <StatCard 
            title="Ventas Totales" 
            value={allSoldItems.length} 
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