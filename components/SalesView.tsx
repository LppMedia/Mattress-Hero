import React, { useState, useMemo, useEffect } from 'react';
import { Search, Sun, CheckSquare, X, DollarSign, Box, Truck, AlertCircle, Phone } from 'lucide-react';
import { InventoryItem } from '../types';
import { InventoryCard } from './InventoryCard';
import { ComicText } from './UIComponents';
import { inventoryService } from '../services/inventoryService';

interface SalesViewProps {
    inventory: InventoryItem[];
    onEdit?: (item: InventoryItem) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ inventory, onEdit }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [onlyFleaMarket, setOnlyFleaMarket] = useState(false);
    
    // Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkSellModal, setShowBulkSellModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Bulk Form State
    const [bulkForm, setBulkForm] = useState({
        customerName: '',
        customerPhone: '',
        deliveryMethod: 'Pickup' as 'Pickup' | 'Delivery',
        deliveryAddress: '',
        totalPrice: ''
    });

    // Reset selection when leaving selection mode
    useEffect(() => {
        if (!isSelectionMode) {
            setSelectedIds(new Set());
        }
    }, [isSelectionMode]);

    // Update estimated total price when selection changes
    useEffect(() => {
        if (selectedIds.size > 0) {
            const selectedItems = inventory.filter(i => selectedIds.has(i.id));
            const total = selectedItems.reduce((sum, i) => sum + i.price, 0);
            setBulkForm(prev => ({ ...prev, totalPrice: total.toString() }));
        }
    }, [selectedIds, inventory]);

    // First filter by availability
    let availableItems = inventory.filter(i => i.status === 'Available');

    // Filter by Flea Market if toggled
    if (onlyFleaMarket) {
        availableItems = availableItems.filter(i => i.storageLocation === 'Flea Market');
    }
    
    // Filter by search term
    const displayItems = searchTerm 
        ? availableItems.filter(i => 
            i.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
            i.size.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : availableItems;

    // GROUPING LOGIC
    const groupedItems = useMemo(() => {
        const groups: Record<string, InventoryItem[]> = {};
        displayItems.forEach(item => {
            const key = `${item.brand.trim().toLowerCase()}-${item.size}-${item.condition}-${item.price}-${item.status}-${item.storageLocation}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return Object.values(groups);
    }, [displayItems]);

    // HANDLERS
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
    };

    const handleToggleSelection = (ids: string[]) => {
        const newSet = new Set(selectedIds);
        const firstId = ids[0];
        if (newSet.has(firstId)) {
            ids.forEach(id => newSet.delete(id));
        } else {
            ids.forEach(id => newSet.add(id));
        }
        setSelectedIds(newSet);
    };

    const handleBulkSellConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const selectedItems = inventory.filter(i => selectedIds.has(i.id));
            const totalSoldPrice = parseFloat(bulkForm.totalPrice);
            const originalTotal = selectedItems.reduce((sum, i) => sum + i.price, 0);
            
            // If total price is modified, we distribute the ratio across items
            // If originalTotal is 0 (unlikely but possible), avoid division by zero
            const ratio = originalTotal > 0 ? totalSoldPrice / originalTotal : 1;
            const hasPriceChange = Math.abs(totalSoldPrice - originalTotal) > 0.5; // Tolerance for float math

            if (hasPriceChange) {
                // Update items individually with adjusted prices
                const promises = selectedItems.map(item => {
                    const newPrice = Math.round(item.price * ratio);
                    return inventoryService.update(item.id, {
                        status: 'Sold',
                        sold_at: new Date().toISOString(),
                        customerName: bulkForm.customerName,
                        customerPhone: bulkForm.customerPhone,
                        deliveryMethod: bulkForm.deliveryMethod,
                        deliveryAddress: bulkForm.deliveryAddress,
                        price: newPrice
                    });
                });
                await Promise.all(promises);
            } else {
                // Bulk update with original prices (unchanged)
                await inventoryService.bulkUpdate(Array.from(selectedIds), {
                    status: 'Sold',
                    sold_at: new Date().toISOString(),
                    customerName: bulkForm.customerName,
                    customerPhone: bulkForm.customerPhone,
                    deliveryMethod: bulkForm.deliveryMethod,
                    deliveryAddress: bulkForm.deliveryAddress,
                });
            }

            setShowBulkSellModal(false);
            setIsSelectionMode(false);
            setSelectedIds(new Set());
            setBulkForm({ customerName: '', customerPhone: '', deliveryMethod: 'Pickup', deliveryAddress: '', totalPrice: '' });
        } catch (e) {
            console.error(e);
            alert("Error al procesar venta masiva");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4 pb-24">
            <style>{`
                .comic-scroll::-webkit-scrollbar {
                    height: 12px;
                }
                .comic-scroll::-webkit-scrollbar-track {
                    background: #fff;
                    border-top: 2px solid #000;
                    border-bottom: 2px solid #000;
                }
                .comic-scroll::-webkit-scrollbar-thumb {
                    background: #FF6D00;
                    border: 2px solid #000;
                    border-radius: 6px;
                }
                .comic-scroll::-webkit-scrollbar-thumb:hover {
                    background: #e65100;
                }
            `}</style>

            <div className="flex gap-2">
                <div className="flex-1 bg-white border-2 border-black p-2 flex items-center gap-2 shadow-[4px_4px_0px_0px_#000]">
                    <Search className="text-gray-400" />
                    <input 
                        placeholder="Buscar inventario..." 
                        className="w-full font-bold outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Flea Market Filter Toggle */}
                <button
                    onClick={() => setOnlyFleaMarket(!onlyFleaMarket)}
                    className={`
                        border-2 border-black px-3 rounded shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center
                        ${onlyFleaMarket ? 'bg-[#FF6D00] text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}
                    `}
                    title="Filtrar Flea Market"
                >
                    <Sun size={20} className={onlyFleaMarket ? 'animate-spin-slow' : ''} />
                    <span className="text-[9px] font-bold leading-none mt-1">FLEA MKT</span>
                </button>

                {/* Selection Mode Toggle */}
                <button
                    onClick={toggleSelectionMode}
                    className={`
                        border-2 border-black px-3 rounded shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center
                        ${isSelectionMode ? 'bg-red-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}
                    `}
                    title="Selección Múltiple"
                >
                    {isSelectionMode ? <X size={20} strokeWidth={3} /> : <CheckSquare size={20} />}
                    <span className="text-[9px] font-bold leading-none mt-1">{isSelectionMode ? 'CANCEL' : 'SELECT'}</span>
                </button>
            </div>

            <ComicText className={onlyFleaMarket ? "text-[#FF6D00]" : "text-[#6200EA]"}>
                {onlyFleaMarket ? 'ITEMS EN LA CALLE (FLEA MARKET)' : `LISTOS PARA VENDER (${displayItems.length})`}
            </ComicText>

            <div className="grid gap-4">
                {groupedItems.map(group => (
                    <InventoryCard 
                        key={group[0].id} 
                        item={group[0]} 
                        groupedItems={group}
                        isSalesMode 
                        onEdit={onEdit}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedIds.has(group[0].id)}
                        onToggleSelection={handleToggleSelection} 
                    />
                ))}
                
                {groupedItems.length === 0 && (
                    <div className="text-center py-8 opacity-50">
                        <div className="font-bangers text-xl">NO SE ENCONTRÓ NADA</div>
                        <p className="text-sm font-bold">
                            {onlyFleaMarket ? 'No hay nada marcado como "Flea Market".' : 'Intenta otra búsqueda.'}
                        </p>
                    </div>
                )}
            </div>

            {/* FLOATING ACTION BAR FOR BULK SELL */}
            {isSelectionMode && selectedIds.size > 0 && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-11/12 max-w-md z-40 animate-fade-in">
                    <div className="bg-black text-white p-3 rounded-xl border-4 border-white shadow-xl flex justify-between items-center">
                        <div>
                            <span className="font-bangers text-2xl text-[#00E676]">{selectedIds.size}</span>
                            <span className="font-bold text-xs uppercase ml-2">Seleccionados</span>
                        </div>
                        <button 
                            onClick={() => setShowBulkSellModal(true)}
                            className="bg-[#00E676] text-black font-bangers px-4 py-2 rounded border-2 border-black hover:bg-green-400 active:scale-95 transition-transform flex items-center gap-2 shadow-[2px_2px_0px_0px_#fff]"
                        >
                            <DollarSign size={20} strokeWidth={3} /> VENDER PACK
                        </button>
                    </div>
                </div>
            )}

            {/* BULK SELL MODAL */}
            {showBulkSellModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowBulkSellModal(false)}>
                    <div className="bg-white border-4 border-black rounded-xl p-4 shadow-[8px_8px_0px_0px_#00E676] w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bangers text-xl text-[#00E676] flex items-center gap-2">
                                <DollarSign size={24} /> VENTA MASIVA ({selectedIds.size})
                            </h3>
                            <button onClick={() => setShowBulkSellModal(false)} className="text-gray-400 font-bold hover:text-black">X</button>
                        </div>

                        <form onSubmit={handleBulkSellConfirm} className="space-y-3">
                            <input 
                                required
                                placeholder="Nombre del Cliente"
                                className="w-full border-2 border-black p-2 font-bold focus:ring-[#00E676] outline-none"
                                value={bulkForm.customerName}
                                onChange={e => setBulkForm({...bulkForm, customerName: e.target.value})}
                            />
                            
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input 
                                    type="tel"
                                    placeholder="Teléfono (Opcional)"
                                    className="w-full border-2 border-black p-2 pl-9 font-bold focus:ring-[#00E676] outline-none"
                                    value={bulkForm.customerPhone}
                                    onChange={e => setBulkForm({...bulkForm, customerPhone: e.target.value})}
                                />
                            </div>

                            <div className="flex gap-2">
                                {['Pickup', 'Delivery'].map(method => (
                                    <button
                                        type="button"
                                        key={method}
                                        onClick={() => setBulkForm({...bulkForm, deliveryMethod: method as any})}
                                        className={`flex-1 border-2 border-black py-1 font-bold text-sm flex flex-col items-center justify-center gap-1 ${bulkForm.deliveryMethod === method ? 'bg-[#6200EA] text-white' : 'bg-gray-100 text-gray-500'}`}
                                    >
                                        {method === 'Pickup' ? <Box size={16}/> : <Truck size={16}/>}
                                        {method === 'Pickup' ? 'RETIRO' : 'ENVÍO'}
                                    </button>
                                ))}
                            </div>

                            {bulkForm.deliveryMethod === 'Delivery' && (
                                <textarea 
                                    required
                                    placeholder="Dirección de entrega..."
                                    className="w-full border-2 border-black p-2 font-bold text-sm h-20 resize-none outline-none focus:ring-[#00E676]"
                                    value={bulkForm.deliveryAddress}
                                    onChange={e => setBulkForm({...bulkForm, deliveryAddress: e.target.value})}
                                />
                            )}

                            <div className="bg-yellow-50 p-3 border-2 border-black border-dashed">
                                <label className="font-bangers block mb-1 text-sm text-gray-500">PRECIO TOTAL DEL PACK ($)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full bg-white border-2 border-black p-2 font-bangers text-3xl focus:ring-[#00E676] outline-none text-right"
                                    value={bulkForm.totalPrice}
                                    onChange={e => setBulkForm({...bulkForm, totalPrice: e.target.value})}
                                />
                                <p className="text-[10px] text-gray-400 mt-1 text-right font-bold">
                                    *Se distribuirá proporcionalmente entre los items.
                                </p>
                            </div>

                            <button 
                                type="submit"
                                disabled={isProcessing}
                                className="w-full bg-[#00E676] text-black border-2 border-black py-3 font-bangers text-xl hover:bg-[#00c853] shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? "PROCESANDO..." : "CONFIRMAR VENTA"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}