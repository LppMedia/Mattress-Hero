import React, { useState, useMemo } from 'react';
import { InventoryItem, STORAGE_LOCATIONS } from '../types';
import { InventoryCard } from './InventoryCard';
import { MapPin, Ruler, CheckSquare, X, ArrowRightLeft, Sun } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

interface InventoryViewProps {
    inventory: InventoryItem[];
    onEdit?: (item: InventoryItem) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ inventory, onEdit }) => {
    const [sizeFilter, setSizeFilter] = useState('Todos');
    const [locationFilter, setLocationFilter] = useState('Todos');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
    
    // Use the standardized list + 'Todos'
    const locationOptions = ['Todos', ...STORAGE_LOCATIONS];

    const filtered = inventory.filter(i => {
        // STRICT REQUIREMENT: Remove sold items from this view
        if (i.status !== 'Available') return false;

        const matchSize = sizeFilter === 'Todos' || i.size === sizeFilter;
        
        // Normalize comparison to handle whitespace or casing issues in legacy data
        const itemLoc = i.storageLocation ? i.storageLocation.trim() : '';
        const matchLocation = locationFilter === 'Todos' || itemLoc === locationFilter;
        
        return matchSize && matchLocation;
    });

    // GROUPING LOGIC
    // We group items if they share: Brand, Size, Condition, Price, Status, Location.
    const groupedInventory = useMemo(() => {
        const groups: Record<string, InventoryItem[]> = {};

        filtered.forEach(item => {
            const key = `${item.brand.trim().toLowerCase()}-${item.size}-${item.condition}-${item.price}-${item.status}-${item.storageLocation}`;
            
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        });

        // Convert back to array of arrays
        return Object.values(groups);
    }, [filtered]);

    // HANDLERS
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds(new Set()); // Clear selection when toggling
    };

    const handleToggleSelection = (ids: string[]) => {
        const newSet = new Set(selectedIds);
        // Check if the first ID is already selected. If so, deselect all. Otherwise, select all.
        const firstId = ids[0];
        
        if (newSet.has(firstId)) {
            // Deselect
            ids.forEach(id => newSet.delete(id));
        } else {
            // Select
            ids.forEach(id => newSet.add(id));
        }
        setSelectedIds(newSet);
    };

    const handleBulkMove = async (newLocation: string) => {
        if (selectedIds.size === 0) return;
        
        try {
            const idsArray: string[] = Array.from(selectedIds);
            await inventoryService.bulkUpdate(idsArray, { storageLocation: newLocation });
            
            // Reset UI
            setShowBulkMoveModal(false);
            setIsSelectionMode(false);
            setSelectedIds(new Set());
            alert(`¡${idsArray.length} items movidos a ${newLocation}!`);
        } catch (e) {
            console.error(e);
            alert("Error al mover items.");
        }
    };

    return (
        <div className="space-y-4 pb-20">
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

            {/* Filter Control Panel */}
            <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                
                {/* Header with Selection Toggle */}
                <div className="flex justify-between items-center mb-3">
                     <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase">
                        <Ruler size={12} />
                        <span>Filtros</span>
                    </div>
                    
                    <button 
                        onClick={toggleSelectionMode}
                        className={`
                            px-2 py-1 border-2 border-black rounded text-xs font-bangers flex items-center gap-1 transition-all
                            ${isSelectionMode ? 'bg-red-500 text-white' : 'bg-gray-100 text-black hover:bg-gray-200'}
                        `}
                    >
                        {isSelectionMode ? <X size={14}/> : <CheckSquare size={14}/>}
                        {isSelectionMode ? 'CANCELAR' : 'SELECCIONAR'}
                    </button>
                </div>
                
                {/* Size Filter Row */}
                <div className="mb-3">
                    <div className="flex overflow-x-auto pb-4 gap-2 comic-scroll">
                        {['Todos', 'Twin', 'Twin XL', 'Full', 'Queen', 'King', 'Cal King'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setSizeFilter(f)}
                                className={`
                                    px-3 py-1 border-2 border-black rounded-md font-bangers text-sm whitespace-nowrap transition-all flex-shrink-0
                                    ${sizeFilter === f ? 'bg-[#6200EA] text-white shadow-[2px_2px_0px_0px_#000]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                `}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Location Filter Row - Using Standardized List */}
                <div className="border-t-2 border-dashed border-gray-300 pt-2">
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase mb-2">
                        <MapPin size={12} />
                        <span>Filtrar por Ubicación</span>
                    </div>
                    <div className="flex overflow-x-auto pb-4 gap-2 comic-scroll">
                        {locationOptions.map(loc => (
                            <button 
                                key={loc}
                                onClick={() => setLocationFilter(loc)}
                                className={`
                                    px-3 py-1 border-2 border-black rounded-md font-bangers text-sm whitespace-nowrap transition-all flex-shrink-0
                                    ${locationFilter === loc ? 'bg-[#FF6D00] text-white shadow-[2px_2px_0px_0px_#000]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                `}
                            >
                                {loc}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results List */}
            <div className="space-y-4">
                {groupedInventory.map(group => (
                    <InventoryCard 
                        key={group[0].id} // Use ID of the first item as key for React list
                        item={group[0]}   // Pass the first item as representative
                        groupedItems={group} // Pass the whole group for counting/logic
                        onEdit={onEdit} 
                        // Selection Props
                        isSelectionMode={isSelectionMode}
                        // We consider the group selected if the first item ID is in the set
                        isSelected={selectedIds.has(group[0].id)} 
                        onToggleSelection={handleToggleSelection}
                    />
                ))}
                
                {groupedInventory.length === 0 && (
                    <div className="text-center py-10 opacity-50 flex flex-col items-center">
                        <div className="font-bangers text-2xl mb-2">NO HAY ÍTEMS AQUÍ</div>
                        <p className="text-sm font-bold">
                            {sizeFilter !== 'Todos' || locationFilter !== 'Todos' 
                             ? 'Intenta cambiar los filtros.' 
                             : 'El inventario está vacío (o todo vendido).'}
                        </p>
                    </div>
                )}
            </div>

            {/* FLOATING ACTION BAR FOR SELECTION */}
            {isSelectionMode && selectedIds.size > 0 && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-11/12 max-w-md z-40 animate-fade-in">
                    <div className="bg-black text-white p-3 rounded-xl border-4 border-white shadow-xl flex justify-between items-center">
                        <div>
                            <span className="font-bangers text-2xl text-[#00E676]">{selectedIds.size}</span>
                            <span className="font-bold text-xs uppercase ml-2">Seleccionados</span>
                        </div>
                        <button 
                            onClick={() => setShowBulkMoveModal(true)}
                            className="bg-white text-black font-bangers px-4 py-2 rounded border-2 border-gray-400 hover:bg-gray-100 active:scale-95 transition-transform flex items-center gap-2"
                        >
                            <ArrowRightLeft size={18} /> MOVER TODO
                        </button>
                    </div>
                </div>
            )}

            {/* BULK MOVE MODAL */}
            {showBulkMoveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowBulkMoveModal(false)}>
                    <div className="bg-yellow-50 border-4 border-black rounded-xl p-4 shadow-[8px_8px_0px_0px_#6200EA] w-full max-w-sm flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="font-bangers text-2xl flex items-center gap-2 text-black">
                                <MapPin className="text-[#6200EA]" /> 
                                MOVER {selectedIds.size} ITEMS A:
                            </h3>
                            <button onClick={() => setShowBulkMoveModal(false)} className="text-gray-400 font-bold hover:text-black">X</button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 overflow-y-auto comic-scroll pr-1">
                            {STORAGE_LOCATIONS.map(loc => (
                                <button
                                    key={loc}
                                    onClick={() => handleBulkMove(loc)}
                                    className={`
                                        py-3 px-2 border-2 border-black font-bold text-sm uppercase shadow-sm active:translate-y-1 active:shadow-none transition-all
                                        ${loc === 'Flea Market' ? 'bg-[#FF6D00] text-white col-span-2' : 'bg-white text-black hover:bg-gray-100'}
                                    `}
                                >
                                    {loc === 'Flea Market' && <Sun size={14} className="inline mr-1 mb-1"/>}
                                    {loc}
                                </button>
                            ))}
                        </div>
                        
                        <div className="mt-4 pt-2 border-t-2 border-dashed border-gray-400 shrink-0">
                            <p className="text-xs font-bold text-gray-500 mb-1">OTRA UBICACIÓN:</p>
                            <input 
                                placeholder="Escribe ubicación manual..." 
                                className="w-full border-2 border-black p-2 text-sm font-bold bg-white text-black"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleBulkMove((e.target as HTMLInputElement).value);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}