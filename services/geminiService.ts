import { GoogleGenAI, Type } from "@google/genai";

const SCENE_STYLES = [
    "una tienda de colchones de lujo moderna",
    "un dormitorio minimalista estilo japonés",
    "un loft industrial con paredes de ladrillo",
    "una habitación infantil colorida estilo cómic",
    "un showroom elegante con iluminación de neón",
    "una habitación rústica con vigas de madera",
    "un espacio futurista de alta tecnología",
    "una habitación de hotel de 5 estrellas",
    "un estudio de fotografía profesional",
    "una habitación acogedora con luz de atardecer"
];

const FLOOR_TYPES = [
    "suelo de madera noble pulida",
    "alfombra blanca mullida",
    "suelo de mármol brillante",
    "piso de concreto pulido moderno",
    "suelo de baldosas estilo ajedrez"
];

const DECORATIONS = [
    "con una planta verde grande al lado",
    "con un póster de arte pop en la pared",
    "con una lámpara de pie moderna encendida",
    "con una ventana grande mostrando la ciudad",
    "con carteles de 'OFERTA' estilo cómic al fondo"
];

export const generateScenePrompt = async (imageBase64?: string): Promise<string> => {
    const fallback = () => {
        const style = SCENE_STYLES[Math.floor(Math.random() * SCENE_STYLES.length)];
        const floor = FLOOR_TYPES[Math.floor(Math.random() * FLOOR_TYPES.length)];
        const decor = DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)];
        
        return `Show this mattress placed on a ${floor} in ${style}, ${decor}. Photorealistic, bright lighting, wide angle, high quality. Keep the mattress looking exactly the same as the input image.`;
    };

    if (!imageBase64 || !process.env.API_KEY) return fallback();

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { text: "Generate a creative, short prompt to place this mattress in a stunning, stylized environment (like a comic book backroom, luxury penthouse, or neon warehouse). Describe the flooring, lighting, and decor. Keep it concise." },
                    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
                ]
            }
        });
        const text = response.text;
        if (!text) return fallback();
        return `Show this mattress placed in ${text}. Photorealistic, high quality. Keep the mattress exactly as is.`;
    } catch (e) {
        console.warn("Gemini 3 Flash prompt gen failed, using fallback", e);
        return fallback();
    }
};

export const analyzeMattressImage = async (imageBase64: string): Promise<{ brand?: string, size?: string, condition?: string, price?: number } | null> => {
     if (!process.env.API_KEY) return null;
     try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { text: "Analyze this mattress image. Identify the likely Brand (guess if unsure), Size (Twin, Twin XL, Full, Queen, King, Cal King), Condition (Nuevo (Plástico), Como Nuevo, Bueno, Con Detalles), and estimate a generous resale Price (USD number). Return JSON." },
                    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        brand: { type: Type.STRING },
                        size: { type: Type.STRING, enum: ['Twin', 'Twin XL', 'Full', 'Queen', 'King', 'Cal King'] },
                        condition: { type: Type.STRING, enum: ['Nuevo (Plástico)', 'Como Nuevo', 'Bueno', 'Con Detalles'] },
                        price: { type: Type.NUMBER }
                    }
                }
            }
        });
        if (response.text) return JSON.parse(response.text);
        return null;
     } catch(e) {
         console.error("Gemini Analysis Failed", e);
         return null;
     }
}

export const enhanceMattressImage = async (imageBase64: string, prompt: string): Promise<string | null> => {
    try {
        if (!process.env.API_KEY) {
            console.error("Missing API_KEY for Gemini");
            throw new Error("API Key missing");
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Using gemini-2.5-flash-image for general image editing tasks as per guidance
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: prompt },
                    { 
                        inlineData: { 
                            mimeType: "image/jpeg", 
                            data: imageBase64 
                        } 
                    }
                ]
            }
        });

        // The response for image generation usually contains inlineData in the parts
        const parts = response.candidates?.[0]?.content?.parts;
        if (!parts) return null;

        // Iterate to find the image part
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data; // Return base64 string
            }
        }
        
        return null;

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};