import React, { useState, useMemo } from 'react';
import { Search, Sun } from 'lucide-react';
import { InventoryItem } from '../types';
import { InventoryCard } from './InventoryCard';
import { ComicText } from './UIComponents';

interface SalesViewProps {
    inventory: InventoryItem[];
    onEdit?: (item: InventoryItem) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ inventory, onEdit }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [onlyFleaMarket, setOnlyFleaMarket] = useState(false);

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

    // GROUPING LOGIC (Identical to InventoryView for consistency)
    // REMOVED 'image' from key
    const groupedItems = useMemo(() => {
        const groups: Record<string, InventoryItem[]> = {};
        displayItems.forEach(item => {
            const key = `${item.brand.trim().toLowerCase()}-${item.size}-${item.condition}-${item.price}-${item.status}-${item.storageLocation}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return Object.values(groups);
    }, [displayItems]);

    return (
        <div className="space-y-4">
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
        </div>
    );
}