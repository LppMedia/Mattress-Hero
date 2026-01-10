import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { InventoryCard } from './InventoryCard';
import { MapPin, Ruler } from 'lucide-react';

interface InventoryViewProps {
    inventory: InventoryItem[];
    onEdit?: (item: InventoryItem) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ inventory, onEdit }) => {
    const [sizeFilter, setSizeFilter] = useState('Todos');
    const [locationFilter, setLocationFilter] = useState('Todos');
    
    // Dynamically extract unique locations from current inventory
    const locationOptions = useMemo(() => {
        const locations = new Set(
            inventory
                .filter(i => i.status === 'Available') // Only consider locations of available items
                .map(i => i.storageLocation)
                .filter(l => l && l.trim().length > 0)
        );
        return ['Todos', ...Array.from(locations).sort()];
    }, [inventory]);

    const filtered = inventory.filter(i => {
        // STRICT REQUIREMENT: Remove sold items from this view
        if (i.status !== 'Available') return false;

        const matchSize = sizeFilter === 'Todos' || i.size === sizeFilter;
        const matchLocation = locationFilter === 'Todos' || i.storageLocation === locationFilter;
        return matchSize && matchLocation;
    });

    // GROUPING LOGIC
    // We group items if they share: Brand, Size, Condition, Price, Status, Location.
    // REMOVED 'image' from key so items with different photos but same specs group together.
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

    return (
        <div className="space-y-4">
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
                
                {/* Size Filter Row */}
                <div className="mb-3">
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase mb-2">
                        <Ruler size={12} />
                        <span>Filtrar por Tamaño</span>
                    </div>
                    {/* Changed hide-scrollbar to comic-scroll and increased padding-bottom */}
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

                {/* Location Filter Row - Only shows if we have locations to filter */}
                {locationOptions.length > 1 && (
                    <div className="border-t-2 border-dashed border-gray-300 pt-2">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase mb-2">
                            <MapPin size={12} />
                            <span>Filtrar por Ubicación</span>
                        </div>
                        {/* Changed hide-scrollbar to comic-scroll and increased padding-bottom */}
                        <div className="flex overflow-x-auto pb-4 gap-2 comic-scroll">
                            {locationOptions.map(loc => (
                                <button 
                                    key={loc}
                                    onClick={() => setLocationFilter(loc as string)}
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
                )}
            </div>

            {/* Results List */}
            <div className="space-y-4">
                {groupedInventory.map(group => (
                    <InventoryCard 
                        key={group[0].id} // Use ID of the first item as key for React list
                        item={group[0]}   // Pass the first item as representative
                        groupedItems={group} // Pass the whole group for counting/logic
                        onEdit={onEdit} 
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
        </div>
    )
}