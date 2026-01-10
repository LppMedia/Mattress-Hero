import React, { useState, useEffect } from 'react';
import { Camera, Wand2, Trash2, User, Truck, MapPin, Sparkles } from 'lucide-react';
import { AppUser, ViewState, InventoryItem } from '../types';
import { ComicText, ComicButton } from './UIComponents';
import { enhanceMattressImage, generateScenePrompt, analyzeMattressImage } from '../services/geminiService';
import { inventoryService } from '../services/inventoryService';

interface AddItemViewProps {
    user: AppUser | null;
    setView: (view: ViewState) => void;
    initialItem?: InventoryItem | null;
}

export const AddItemView: React.FC<AddItemViewProps> = ({ user, setView, initialItem }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(initialItem ? 2 : 1); // Skip photo step if editing
  const [formData, setFormData] = useState({
    sku: `SKU-${Math.floor(Math.random()*10000)}`,
    size: 'Queen',
    brand: '',
    condition: 'Nuevo',
    price: '',
    storageLocation: '',
    status: 'Available' as 'Available' | 'Sold' | 'Delivered',
    customerName: '',
    deliveryMethod: 'Pickup' as 'Pickup' | 'Delivery',
    deliveryAddress: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
      if (initialItem) {
          setFormData({
              sku: initialItem.sku,
              size: initialItem.size,
              brand: initialItem.brand,
              condition: initialItem.condition,
              price: initialItem.price.toString(),
              storageLocation: initialItem.storageLocation || '',
              status: initialItem.status,
              customerName: initialItem.customerName || '',
              deliveryMethod: initialItem.deliveryMethod || 'Pickup',
              deliveryAddress: initialItem.deliveryAddress || ''
          });
          setImagePreview(initialItem.image || null);
      }
  }, [initialItem]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAIBackground = async () => {
    if (!imagePreview) return;
    setIsEnhancing(true);

    try {
        const base64Data = imagePreview.split(',')[1];
        // Now using async Gemini 3 Flash smart prompt
        const prompt = await generateScenePrompt(base64Data);
        
        const newImageBase64 = await enhanceMattressImage(base64Data, prompt);
        
        if (newImageBase64) {
            setImagePreview(`data:image/jpeg;base64,${newImageBase64}`);
        } else {
            alert("La IA no pudo procesar esta imagen. Intenta con otra foto.");
        }

    } catch (error) {
        console.error("AI Gen Error", error);
        alert("Fallo de conexión con el servidor IA. Verifica tu API KEY.");
    } finally {
        setIsEnhancing(false);
    }
  };
  
  const handleAutoIdentify = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    setStatusMessage("Analizando...");
    
    try {
        const base64Data = imagePreview.split(',')[1];
        const result = await analyzeMattressImage(base64Data);
        
        if (result) {
            setFormData(prev => ({
                ...prev,
                brand: result.brand || prev.brand,
                size: result.size || prev.size,
                condition: (result.condition as any) || prev.condition,
                price: result.price ? result.price.toString() : prev.price
            }));
            alert("¡Datos detectados por Gemini 3 Flash!");
        } else {
            alert("No se pudieron detectar detalles.");
        }
    } catch(e) {
        console.error("Auto detect failed", e);
    } finally {
        setIsAnalyzing(false);
        setStatusMessage(null);
    }
  };

  const usePlaceholder = () => {
      setImagePreview("https://picsum.photos/400/300");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setStatusMessage("Procesando...");

    try {
      const priceValue = formData.price ? parseFloat(formData.price) : 0;
      let finalImageUrl = imagePreview;

      // ATTEMPT UPLOAD TO SUPABASE STORAGE ONLY IF IMAGE CHANGED (starts with data:)
      if (imagePreview && imagePreview.startsWith('data:')) {
          try {
              const res = await fetch(imagePreview);
              const blob = await res.blob();
              
              const uploadedUrl = await inventoryService.uploadImage(blob);
              if (uploadedUrl) {
                  finalImageUrl = uploadedUrl;
              }
          } catch (uploadError) {
              console.warn("Error preparing image upload:", uploadError);
          }
      }
      
      const payload = {
          ...formData,
          image: finalImageUrl || undefined,
          price: priceValue
      };

      if (initialItem) {
          // UPDATE MODE
          const { error } = await inventoryService.update(initialItem.id, payload);
          if (error) throw error;
      } else {
          // CREATE MODE
          const { error } = await inventoryService.add(payload);
          if (error) throw error;
      }
      
      setView('inventory');
    } catch (err: any) {
      console.error('Error saving item:', err.message || JSON.stringify(err));
      alert(`¡Error! ${err.message || 'Desconocido'}`);
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[8px_8px_0px_0px_#6200EA]">
      <div className="flex justify-between items-center mb-6">
        <ComicText>{initialItem ? 'EDITAR BOTÍN' : 'NUEVO INVENTARIO'}</ComicText>
        <div className="font-bangers text-2xl text-gray-300">PASO {step}/2</div>
      </div>

      {step === 1 ? (
        <div className="space-y-6 text-center">
            
          <div className="border-4 border-dashed border-black bg-gray-50 h-64 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
            {isEnhancing ? (
                <div className="absolute inset-0 bg-black bg-opacity-80 z-10 flex flex-col items-center justify-center p-4">
                    <Wand2 className="text-[#00E676] animate-spin mb-4" size={48} />
                    <span className="font-bangers text-[#00E676] text-2xl animate-pulse">GENERANDO ESCENA...</span>
                    <span className="text-white font-bold text-xs mt-2 opacity-80 text-center px-4">
                        "Creando entorno virtual para el colchón..."
                    </span>
                </div>
            ) : imagePreview ? (
              <div className="relative w-full h-full group">
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  {/* Comic Frame Overlay */}
                  <div className="absolute inset-0 border-[8px] border-white pointer-events-none"></div>
                  
                  <button onClick={() => setImagePreview(null)} className="absolute top-2 right-2 bg-red-500 border-2 border-black p-2 text-white hover:scale-110 transition z-20">
                      <Trash2 size={20} />
                  </button>
                  
                  {/* AI Generate Button Overlay */}
                  <div className="absolute bottom-4 left-0 right-0 px-4 flex justify-center">
                     <button 
                        onClick={generateAIBackground}
                        className="bg-purple-600 text-white border-2 border-black px-4 py-2 font-bangers text-lg shadow-[2px_2px_0px_0px_#000] hover:-translate-y-1 active:translate-y-0 transition flex items-center gap-2"
                     >
                        <Wand2 size={18} /> ✨ MAGIC SCENE
                     </button>
                  </div>
              </div>
            ) : (
              <>
                <Camera size={48} className="text-gray-300 mb-2" />
                <p className="font-bold text-gray-500">TOCA PARA FOTO</p>
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </>
            )}
          </div>

          {!imagePreview && (
              <button onClick={usePlaceholder} className="text-sm underline font-bold text-gray-500 hover:text-orange-500">
                  Usar Imagen Demo
              </button>
          )}

          <ComicButton 
            disabled={isEnhancing} 
            onClick={() => setStep(2)} 
            className="w-full"
            variant={!imagePreview ? "secondary" : "primary"}
          >
            {imagePreview ? 'SIGUIENTE: DATOS' : 'OMITIR FOTO / LLENAR MANUALMENTE'}
          </ComicButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* AUTO FILL BUTTON */}
          <button
            type="button"
            onClick={handleAutoIdentify}
            disabled={isAnalyzing || !imagePreview}
            className={`
                w-full border-2 border-black p-2 flex items-center justify-center gap-2 font-bangers text-xl shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-y-1 transition disabled:opacity-50 disabled:cursor-not-allowed
                ${!imagePreview ? 'bg-gray-200 text-gray-500' : 'bg-[#00E676]'}
            `}
          >
              <Sparkles className={isAnalyzing ? "animate-spin" : ""} />
              {isAnalyzing ? "ANALIZANDO IMAGEN..." : (!imagePreview ? "AUTO-DETECT (REQ. FOTO)" : "⚡ AUTO-DETECTAR DATOS")}
          </button>

          <div>
            <label className="font-bangers block mb-1">TAMAÑO</label>
            <div className="grid grid-cols-2 gap-2">
              {['Twin', 'Twin XL', 'Full', 'Queen', 'King', 'Cal King'].map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setFormData({...formData, size: s})}
                  className={`border-2 border-black py-2 font-bold transition-all ${formData.size === s ? 'bg-[#FF6D00] text-white shadow-[2px_2px_0px_0px_#000]' : 'bg-white text-black hover:bg-gray-100'}`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="font-bangers block mb-1">MARCA Y MODELO</label>
             <input 
               required
               value={formData.brand}
               onChange={e => setFormData({...formData, brand: e.target.value})}
               className="w-full bg-white text-black border-2 border-black p-2 font-bold text-xl placeholder-gray-400 focus:ring-2 focus:ring-[#FF6D00] focus:outline-none"
               placeholder="Ej. Sealy Posturepedic"
             />
          </div>

          <div className="flex gap-4">
             <div className="w-1/2">
                <label className="font-bangers block mb-1">PRECIO ($)</label>
                <input 
                  type="number"
                  required
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-white text-black border-2 border-black p-2 font-bold text-xl placeholder-gray-400 focus:ring-2 focus:ring-[#FF6D00] focus:outline-none"
                  placeholder="299"
                />
             </div>
             <div className="w-1/2">
                <label className="font-bangers block mb-1">CONDICIÓN</label>
                <select
                  value={formData.condition}
                  onChange={e => setFormData({...formData, condition: e.target.value})}
                  className="w-full bg-white text-black border-2 border-black p-2 font-bold text-lg h-[48px] focus:ring-2 focus:ring-[#FF6D00] focus:outline-none"
                >
                    <option>Nuevo (Plástico)</option>
                    <option>Como Nuevo</option>
                    <option>Bueno</option>
                    <option>Con Detalles</option>
                </select>
             </div>
          </div>

          <div>
             <label className="font-bangers block mb-1">UBICACIÓN / UNIDAD</label>
             <input 
               value={formData.storageLocation}
               onChange={e => setFormData({...formData, storageLocation: e.target.value})}
               className="w-full bg-yellow-50 text-black border-2 border-black p-2 font-bold text-lg placeholder-gray-400 focus:ring-2 focus:ring-[#FF6D00] focus:outline-none"
               placeholder="Ej. Unit 8, Pasillo B"
             />
          </div>

          {/* Delivery & Customer Info Section */}
          <div className="border-t-4 border-black pt-4 mt-4">
             <div className="flex items-center gap-2 mb-2">
                 <Truck className="text-[#6200EA]" />
                 <label className="font-bangers text-lg text-[#6200EA]">CLIENTE Y ENTREGA (OPCIONAL)</label>
             </div>
             
             <div className="space-y-3 bg-gray-50 p-3 rounded border-2 border-black">
                <div>
                     <label className="font-bold text-xs uppercase text-gray-500 block mb-1">Nombre del Cliente</label>
                     <div className="flex items-center bg-white border-2 border-black p-2">
                         <User size={16} className="text-gray-400 mr-2" />
                         <input 
                           value={formData.customerName}
                           onChange={e => setFormData({...formData, customerName: e.target.value})}
                           className="w-full font-bold outline-none text-black"
                           placeholder="Nombre completo..."
                         />
                     </div>
                </div>

                <div className="flex gap-2">
                    <div className="w-1/2">
                        <label className="font-bold text-xs uppercase text-gray-500 block mb-1">Método</label>
                        <select 
                             value={formData.deliveryMethod}
                             onChange={e => setFormData({...formData, deliveryMethod: e.target.value as any})}
                             className="w-full bg-white text-black border-2 border-black p-2 font-bold h-[42px]"
                        >
                            <option value="Pickup">Retiro en Tienda</option>
                            <option value="Delivery">Envío a Domicilio</option>
                        </select>
                    </div>
                    <div className="w-1/2">
                         <label className="font-bold text-xs uppercase text-gray-500 block mb-1">Estado Actual</label>
                         <select 
                             value={formData.status}
                             onChange={e => setFormData({...formData, status: e.target.value as any})}
                             className="w-full bg-white text-black border-2 border-black p-2 font-bold h-[42px]"
                        >
                            <option value="Available">Disponible</option>
                            <option value="Sold">Vendido</option>
                            <option value="Delivered">Entregado</option>
                        </select>
                    </div>
                </div>

                {formData.deliveryMethod === 'Delivery' && (
                     <div>
                         <label className="font-bold text-xs uppercase text-gray-500 block mb-1">Dirección de Entrega</label>
                         <div className="flex items-start bg-white border-2 border-black p-2">
                             <MapPin size={16} className="text-gray-400 mr-2 mt-1" />
                             <textarea 
                               value={formData.deliveryAddress}
                               onChange={e => setFormData({...formData, deliveryAddress: e.target.value})}
                               className="w-full font-bold outline-none resize-none h-16 text-black"
                               placeholder="Dirección completa..."
                             />
                         </div>
                     </div>
                )}
             </div>
          </div>

          <div className="flex gap-2 pt-4 pb-4">
            <ComicButton type="button" variant="ghost" onClick={() => step === 2 && initialItem ? setView('inventory') : setStep(1)} className="w-1/3">
                {initialItem ? 'CANCELAR' : 'ATRÁS'}
            </ComicButton>
            <ComicButton type="submit" variant="accent" className="w-2/3" disabled={loading}>
                {loading ? (statusMessage || "PROCESANDO...") : (initialItem ? "ACTUALIZAR" : "GUARDAR")}
            </ComicButton>
          </div>
        </form>
      )}
    </div>
  );
};