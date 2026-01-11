import React, { useState } from 'react';
import { Box, DollarSign, Trash2, MapPin, Truck, CheckCircle, Edit, RefreshCw, ArrowRightLeft, Sun, X, AlertCircle, ChevronDown, ChevronUp, Square, CheckSquare, Phone } from 'lucide-react';
import { InventoryItem } from '../types';
import { inventoryService } from '../services/inventoryService';

interface InventoryCardProps {
    item: InventoryItem;
    groupedItems?: InventoryItem[]; // If present, this card represents a stack
    isSalesMode?: boolean;
    onEdit?: (item: InventoryItem) => void;
    isChild?: boolean; // New prop to style inner items differently
    
    // Selection Props
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: (ids: string[]) => void;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({ 
    item, 
    groupedItems = [], 
    isSalesMode, 
    onEdit, 
    isChild = false,
    isSelectionMode = false,
    isSelected = false,
    onToggleSelection
}) => {
    const [isSelling, setIsSelling] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMoving, setIsMoving] = useState(false); 
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const [saleForm, setSaleForm] = useState({
        customerName: '',
        customerPhone: '',
        deliveryMethod: 'Pickup' as 'Pickup' | 'Delivery',
        deliveryAddress: '',
        salePrice: item.price.toString() // Initialize with current price
    });

    const isSold = item.status === 'Sold';
    const isAvailable = item.status === 'Available';
    const stackCount = groupedItems.length > 0 ? groupedItems.length : 1;
    const isStack = stackCount > 1;
    
    // Updated Quick locations
    const QUICK_LOCATIONS = [
        "Flea Market", "Showroom", 
        "Unit 5", "Unit 7", "Unit 8", "Unit 12", "Unit 13", "Unit 15", 
        "Unit 16", "Unit 22", "Unit 28", "Unit 31", "Unit 34", "Unit 36", 
        "Unit 37", "Unit 43", "Unit 45", "Unit 45 2"
    ];

    // Helper: Get the ID to operate on (pop one from stack if multiple, otherwise use item.id)
    const getTargetId = () => {
        // If it's a stack (Parent) and we perform an action, we usually target the first one 
        // OR we rely on the expanded view to target specific IDs. 
        // For the main card quick-actions, we target the first available.
        return groupedItems.length > 0 ? groupedItems[0].id : item.id;
    }

    const toggleExpand = (e: React.MouseEvent) => {
        if (isSelectionMode) return; // Disable expand when selecting
        if (!isStack) return;
        // Don't toggle if clicking buttons
        if ((e.target as HTMLElement).closest('button')) return;
        
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleSelectionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleSelection) {
            // Select all items in this group
            const ids = groupedItems.length > 0 ? groupedItems.map(i => i.id) : [item.id];
            onToggleSelection(ids);
        }
    };

    const handleConfirmSale = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsProcessing(true);

        try {
             // We only sell ONE item from the stack
             const targetId = getTargetId();
             
             const finalPrice = parseFloat(saleForm.salePrice);

             const { error } = await inventoryService.update(targetId, { 
                 status: 'Sold',
                 customerName: saleForm.customerName,
                 customerPhone: saleForm.customerPhone,
                 deliveryMethod: saleForm.deliveryMethod,
                 deliveryAddress: saleForm.deliveryAddress,
                 price: isNaN(finalPrice) ? item.price : finalPrice, // Update the price to the negotiated amount
                 sold_at: new Date().toISOString() // Track exact sale time
             });
             
             if (error) throw error;
             
             setIsSelling(false);
             // Success - component will unmount/update via parent list refresh
        } catch(e) {
            console.error(e);
            alert("Error al registrar venta. Intenta nuevamente.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMarkDelivered = async () => {
        if(window.confirm("¿Marcar como ENTREGADO al cliente?")) {
            const targetId = getTargetId();
            await inventoryService.update(targetId, { status: 'Delivered' });
        }
    }

    // Opens the retro modal instead of window.confirm
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDeleting) return;
        setShowDeleteModal(true);
    }

    // The actual deletion logic called by the modal
    const confirmDelete = async () => {
         setShowDeleteModal(false);
         setIsDeleting(true);
         try {
            // We only delete ONE item from the stack
            const targetId = getTargetId();
            const { error } = await inventoryService.delete(targetId);
            if (error) {
                console.error("Delete operation failed:", error);
                alert("Error: Could not delete item. Check console for details.");
                setIsDeleting(false);
            }
         } catch(e: any) {
            console.error("Unexpected delete error:", e);
            setIsDeleting(false);
            alert(`Error: ${e.message || 'Unknown error'}`);
         }
    }

    const handleMoveLocation = async (newLocation: string) => {
        try {
            // We only move ONE item from the stack
            const targetId = getTargetId();
            await inventoryService.update(targetId, { storageLocation: newLocation });
            setIsMoving(false);
        } catch (e) {
            alert("Error al mover el ítem");
        }
    }

    // --- RETRO DELETE MODAL ---
    const DeleteModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]" onClick={(e) => e.stopPropagation()}>
            <div className="w-[320px] bg-[#C0C0C0] border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black shadow-2xl p-1 font-sans select-none" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-[#000080] px-2 py-1 flex justify-between items-center mb-4 cursor-default">
                    <span className="text-white font-bold text-sm tracking-wide">Confirmación</span>
                    <button 
                        onClick={() => setShowDeleteModal(false)} 
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
                        {isStack 
                            ? `¿Eliminar 1 unidad de ${stackCount}? (Solo se borra una)`
                            : "¿Quieres Remover esto de tu inventario?"
                        }
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex justify-center gap-6 mb-4">
                    <button 
                        onClick={confirmDelete}
                        className="w-20 py-1 bg-[#C0C0C0] text-black text-sm border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white focus:outline-black focus:outline-dashed focus:outline-1"
                    >
                        Sí
                    </button>
                    <button 
                        onClick={() => setShowDeleteModal(false)}
                        className="w-20 py-1 bg-[#C0C0C0] text-black text-sm border-t-2 border-l-2 border-t-white border-l-white border-b-2 border-r-2 border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white focus:outline-black focus:outline-dashed focus:outline-1"
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    );

    // --- MOVE MODAL OVERLAY ---
    if (isMoving) {
        return (
            <div className="bg-yellow-50 border-4 border-black rounded-xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative z-20">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bangers text-xl flex items-center gap-2 text-black">
                        <MapPin className="text-[#6200EA]" /> 
                        {isStack ? "MOVER 1 UNIDAD A:" : "MOVER ÍTEM A:"}
                    </h3>
                    <button onClick={() => setIsMoving(false)} className="text-gray-400 font-bold hover:text-black">X</button>
                </div>
                
                {isStack && (
                    <div className="mb-2 text-xs font-bold text-gray-500 bg-white border border-black p-1">
                        📦 Moviendo 1 de {stackCount} ítems idénticos.
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto comic-scroll pr-1">
                    {QUICK_LOCATIONS.map(loc => (
                        <button
                            key={loc}
                            onClick={() => handleMoveLocation(loc)}
                            className={`
                                py-2 px-1 border-2 border-black font-bold text-sm uppercase shadow-sm active:translate-y-1 active:shadow-none transition-all
                                ${loc === 'Flea Market' ? 'bg-[#FF6D00] text-white col-span-2' : 'bg-white text-black hover:bg-gray-100'}
                                ${loc === item.storageLocation ? 'opacity-50 cursor-default' : ''}
                            `}
                        >
                            {loc === 'Flea Market' && <Sun size={14} className="inline mr-1 mb-1"/>}
                            {loc}
                        </button>
                    ))}
                </div>
                
                <div className="mt-4 pt-2 border-t-2 border-dashed border-gray-400">
                    <p className="text-xs font-bold text-gray-500 mb-1">OTRA UBICACIÓN:</p>
                    <input 
                        placeholder="Escribe ubicación..." 
                        className="w-full border-2 border-black p-1 text-sm font-bold text-black"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleMoveLocation((e.target as HTMLInputElement).value);
                            }
                        }}
                    />
                </div>
            </div>
        )
    }

    // --- SALE FORM OVERLAY ---
    if (isSelling) {
        return (
            <div className="bg-white border-4 border-black rounded-xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative z-20">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bangers text-xl text-[#FF6D00]">
                        {isStack ? "VENDER 1 UNIDAD" : "DATOS DE VENTA"}
                    </h3>
                    <button onClick={() => setIsSelling(false)} className="text-gray-400 font-bold hover:text-black">X</button>
                </div>
                <form onSubmit={handleConfirmSale} className="space-y-3">
                    <input 
                        required
                        placeholder="Nombre del Cliente"
                        className="w-full border-2 border-black p-2 font-bold focus:ring-[#FF6D00] outline-none"
                        value={saleForm.customerName}
                        onChange={e => setSaleForm({...saleForm, customerName: e.target.value})}
                    />

                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                            type="tel"
                            placeholder="Teléfono (Opcional)"
                            className="w-full border-2 border-black p-2 pl-9 font-bold focus:ring-[#FF6D00] outline-none"
                            value={saleForm.customerPhone}
                            onChange={e => setSaleForm({...saleForm, customerPhone: e.target.value})}
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        {['Pickup', 'Delivery'].map(method => (
                            <button
                                type="button"
                                key={method}
                                onClick={() => setSaleForm({...saleForm, deliveryMethod: method as any})}
                                className={`flex-1 border-2 border-black py-1 font-bold text-sm flex flex-col items-center justify-center gap-1 ${saleForm.deliveryMethod === method ? 'bg-[#6200EA] text-white' : 'bg-gray-100 text-gray-500'}`}
                            >
                                {method === 'Pickup' ? <Box size={16}/> : <Truck size={16}/>}
                                {method === 'Pickup' ? 'RETIRO' : 'ENVÍO'}
                            </button>
                        ))}
                    </div>

                    {saleForm.deliveryMethod === 'Delivery' && (
                        <textarea 
                            required
                            placeholder="Dirección de entrega..."
                            className="w-full border-2 border-black p-2 font-bold text-sm h-20 resize-none outline-none focus:ring-[#FF6D00]"
                            value={saleForm.deliveryAddress}
                            onChange={e => setSaleForm({...saleForm, deliveryAddress: e.target.value})}
                        />
                    )}

                    {/* NEW PRICE INPUT */}
                    <div>
                        <label className="font-bangers block mb-1 text-sm text-[#FF6D00]">PRECIO FINAL ($)</label>
                        <input
                            type="number"
                            required
                            className="w-full border-2 border-black p-2 font-bold text-2xl focus:ring-[#FF6D00] outline-none"
                            value={saleForm.salePrice}
                            onChange={e => setSaleForm({...saleForm, salePrice: e.target.value})}
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={isProcessing}
                        className="w-full bg-[#00E676] text-black border-2 border-black py-2 font-bangers text-xl hover:bg-[#00c853] shadow-[2px_2px_0px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? "PROCESANDO..." : "CONFIRMAR VENTA"}
                    </button>
                </form>
            </div>
        )
    }

    // --- NORMAL CARD ---
    return (
        <div className={`relative ${isChild ? 'ml-6 mb-2' : ''} ${isSelectionMode ? 'pl-8' : ''}`}>
            
            {/* SELECTION CHECKBOX - Appears on left if selection mode is active */}
            {isSelectionMode && !isChild && (
                <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-8 w-8 h-full flex items-center justify-center cursor-pointer z-30"
                    onClick={handleSelectionClick}
                >
                    {isSelected ? (
                        <CheckSquare size={28} className="text-[#6200EA] fill-white" strokeWidth={3} />
                    ) : (
                        <Square size={28} className="text-gray-400" strokeWidth={3} />
                    )}
                </div>
            )}

            {showDeleteModal && <DeleteModal />}
            
            {/* Visual connector line for child items */}
            {isChild && (
                <div className="absolute -left-4 top-1/2 w-4 h-[2px] bg-black border-b-2 border-black"></div>
            )}
            {isChild && (
                <div className="absolute -left-4 -top-6 bottom-1/2 w-[2px] bg-black"></div>
            )}

            {/* STACK EFFECT BACKGROUND (Only for Top Level Stacks when collapsed) */}
            {isStack && !isExpanded && !isChild && (
                 <div className="mx-2 -mb-28 h-32 bg-gray-800 border-4 border-black rounded-xl translate-y-2 relative z-0"></div>
            )}

            <div 
                onClick={isSelectionMode ? handleSelectionClick : toggleExpand}
                className={`
                    relative bg-white border-4 border-black rounded-xl overflow-hidden
                    ${isChild ? 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-2 scale-[0.98]' : 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}
                    transition-all duration-300 z-10
                    ${!isAvailable ? 'bg-gray-50' : (isStack || isSelectionMode) ? 'cursor-pointer hover:-translate-y-1' : ''}
                    ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
                    ${isExpanded ? 'mb-4' : ''}
                    ${isSelected ? 'ring-4 ring-[#6200EA] ring-offset-2' : ''}
                `}
            >
                {/* Status Badge */}
                <div className={`
                    absolute top-3 right-3 z-10 px-3 py-1 border-2 border-black font-bangers rotate-3 shadow-md
                    ${isAvailable ? 'bg-[#00E676] text-black' : isSold ? 'bg-[#FF6D00] text-white' : 'bg-gray-800 text-white'}
                `}>
                    {isAvailable ? 'DISPONIBLE' : isSold ? 'VENDIDO' : 'ENTREGADO'}
                </div>

                <div className="flex h-32">
                    {/* Image Section */}
                    <div className="w-1/3 border-r-4 border-black relative bg-gray-100 overflow-hidden group">
                        {item.image ? (
                            <img src={item.image} className={`w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}`} alt="Mattress" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Box className="text-gray-300" />
                            </div>
                        )}
                        
                        {/* Stack Count Badge on Image */}
                        {isStack && !isChild && !isSelectionMode && (
                             <div className="absolute top-1 right-1 bg-[#6200EA] text-white border-2 border-black px-1.5 font-bangers text-lg shadow-sm z-20 flex items-center gap-1">
                                 {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                 x{stackCount}
                             </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="w-2/3 p-3 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start pr-20">
                                <h3 
                                    className="font-bangers text-xl leading-none truncate text-[#00c853] tracking-wide"
                                    style={{ textShadow: '1px 1px 0 #000' }}
                                >
                                    {item.brand}
                                </h3>
                            </div>
                            
                            {/* Quantity Indicator in Details */}
                             {isStack && !isChild && (
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs font-bold text-gray-500">CANTIDAD:</span>
                                    <span className={`bg-black text-white px-2 rounded font-bangers text-sm flex items-center gap-1 ${isExpanded ? 'bg-[#6200EA]' : ''}`}>
                                        {stackCount} UNIDADES
                                        {isExpanded && <span className="text-[10px] font-sans opacity-80">(Abierto)</span>}
                                    </span>
                                </div>
                            )}

                            {/* Show specific SKU if it is a child or single item */}
                            {(isChild || !isStack) && (
                                <div className="text-[10px] font-bold bg-gray-100 inline-block px-1 border border-gray-300 mt-1 text-gray-500">
                                    ID: {item.sku || 'N/A'}
                                </div>
                            )}

                            <p className="font-bold text-gray-500 text-sm uppercase mt-1">{item.size} • {item.condition}</p>
                            
                        </div>
                        
                        {/* Combined Location & Price Row */}
                        <div className="flex items-end justify-between mt-1">
                             <div>
                                {item.storageLocation && (
                                    <div className={`inline-flex items-center gap-1 border border-black px-1.5 rounded ${item.storageLocation === 'Flea Market' ? 'bg-[#FF6D00] text-white animate-pulse' : 'bg-yellow-200 text-black'}`}>
                                        <MapPin size={10} />
                                        <span className="font-bold text-[10px] uppercase">{item.storageLocation}</span>
                                    </div>
                                )}
                             </div>

                            <span className={`font-bangers text-3xl drop-shadow-[1px_1px_0_#000] leading-none ${isAvailable ? 'text-[#FF6D00]' : 'text-gray-500'}`}>
                                ${item.price}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sold Details Section (Visible only if Sold/Delivered) */}
                {!isAvailable && (
                    <div className="bg-blue-50 border-t-4 border-black p-2 text-xs font-bold font-sans">
                        <div className="flex items-center gap-1 text-blue-800">
                            <span className="font-bangers text-sm">CLIENTE:</span> {item.customerName || 'N/A'}
                            {item.customerPhone && <span className="text-[10px] text-gray-500 font-normal ml-1">({item.customerPhone})</span>}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                            {item.deliveryMethod === 'Delivery' ? <Truck size={12}/> : <CheckCircle size={12}/>}
                            {item.deliveryMethod === 'Delivery' ? `ENVÍO: ${item.deliveryAddress}` : 'RETIRO EN TIENDA'}
                        </div>
                    </div>
                )}

                {/* Actions Footer - Hidden in Selection Mode to avoid misclicks */}
                {!isSelectionMode && (
                <div className="bg-gray-50 border-t-4 border-black p-2 flex gap-2">
                    {isAvailable ? (
                        isSalesMode ? (
                            <button 
                                type="button"
                                onClick={() => setIsSelling(true)}
                                className="flex-1 bg-[#6200EA] text-white border-2 border-black py-2 font-bangers tracking-wide flex items-center justify-center gap-2 hover:bg-[#5000ca] active:bg-[#6200EA]"
                            >
                                <DollarSign size={18} /> {isStack && !isChild ? "VENDER (1)" : "VENDER"}
                            </button>
                        ) : (
                            <>
                                {/* Move Button */}
                                <button 
                                    type="button"
                                    onClick={() => setIsMoving(true)}
                                    className="bg-yellow-100 border-2 border-black w-10 text-yellow-700 hover:bg-yellow-200 flex items-center justify-center"
                                    title="Mover Ubicación"
                                >
                                    <ArrowRightLeft size={16} />
                                </button>

                                <button 
                                    type="button"
                                    onClick={() => onEdit?.(item)}
                                    className="flex-1 bg-white border-2 border-black py-1 font-bold text-sm text-black hover:bg-gray-100"
                                >
                                    EDITAR
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleDeleteClick}
                                    disabled={isDeleting}
                                    className="bg-red-100 border-2 border-black w-10 text-red-600 hover:bg-red-200 flex items-center justify-center disabled:opacity-50"
                                    title="Eliminar Ítem"
                                >
                                    {isDeleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                </button>
                            </>
                        )
                    ) : (
                        <>
                            {isSold && (
                                <button 
                                    type="button"
                                    onClick={handleMarkDelivered}
                                    className="flex-1 bg-white border-2 border-black py-1 font-bold text-sm text-[#FF6D00] hover:bg-orange-50 flex items-center justify-center gap-2"
                                >
                                    <Truck size={16} /> ENTREGADO?
                                </button>
                            )}
                            
                            <button 
                                type="button"
                                onClick={() => onEdit?.(item)}
                                className="px-4 bg-blue-100 border-2 border-black text-blue-700 hover:bg-blue-200 flex items-center"
                                title="Editar detalles"
                            >
                                <Edit size={16} />
                            </button>

                            <button 
                                type="button"
                                onClick={handleDeleteClick}
                                disabled={isDeleting}
                                className="px-4 bg-red-100 border-2 border-black text-red-600 hover:bg-red-200 flex items-center justify-center disabled:opacity-50"
                                title="Eliminar Registro"
                            >
                                {isDeleting ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            </button>
                        </>
                    )}
                </div>
                )}
            </div>

            {/* EXPANDED CHILDREN LIST */}
            {isExpanded && isStack && (
                <div className="pl-4 pr-1 mt-2 space-y-3 animate-fade-in relative z-0">
                    {/* Dashed connector line */}
                    <div className="absolute left-0 top-0 bottom-6 w-0.5 bg-black border-l-2 border-dashed border-gray-400"></div>

                    {groupedItems.map((subItem) => (
                        <InventoryCard
                            key={subItem.id}
                            item={subItem}
                            groupedItems={[]} // IMPORTANT: Pass empty array so children act as single items
                            isSalesMode={isSalesMode}
                            onEdit={onEdit}
                            isChild={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};