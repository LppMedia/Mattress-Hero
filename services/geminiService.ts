import { GoogleGenAI, Type } from "@google/genai";

// SCENES: Luxury penthouses with dramatic lighting and views.
const SCENE_STYLES = [
    "un dormitorio principal ultra-lujo en un ático con vistas panorámicas al skyline de la ciudad durante la puesta de sol",
    "una suite de hotel de cinco estrellas espaciosa con ventanales de suelo a techo bañada en luz dorada del atardecer",
    "un dormitorio moderno y sofisticado de diseño con vistas espectaculares a la ciudad y una iluminación ambiental cálida e integrada",
    "un exclusivo apartamento en las alturas con una arquitectura impresionante y una atmósfera serena y opulenta al anochecer"
];

// FLOORS: Premium, highly reflective or richly textured materials.
const FLOOR_TYPES = [
    "suelo de grandes baldosas de mármol blanco pulido con vetas grises que reflejan la luz",
    "pavimento de madera noble oscura de tablón ancho con un acabado rico y elegante",
    "una gran alfombra de área de textura suave y lujosa en tonos neutros sobre un suelo de madera",
    "suelo de piedra natural pulida que aporta una sensación de grandiosidad"
];

// DECORATIONS: Sophisticated elements that enhance the luxury feel.
const DECORATIONS = [
    "con cortinas fluidas y transparentes que suavizan la luz dramática de la ventana",
    "con una cama tapizada de diseño con un cabecero alto y elegante que enmarca el colchón",
    "con mesitas de noche de mármol o madera oscura y lámparas de mesa esculturales de diseño",
    "con iluminación LED cálida oculta en el techo o bajo la estructura de la cama para un efecto teatral",
    "con obras de arte abstracto enmarcadas y una gran planta de interior escultural para un toque orgánico"
];

// PRODUCT PRESENTATION: The mattress is the centerpiece.
const MATTRESS_PRESENTATION = [
    "el colchón premium es el protagonista absoluto, presentado de forma impecable sobre una base elegante",
    "la luz dramática del atardecer resalta las texturas y el diseño del tejido del colchón",
    "el colchón puede estar desnudo para mostrar su calidad o vestido con ropa de cama minimalista de la más alta gama",
    "la cama está perfectamente hecha, transmitiendo una sensación de confort y lujo inigualable"
];

// Helper to safely get the API key in both Vite (browser) and Node environments
const getApiKey = () => {
    // Check for Vite environment variable
    // @ts-ignore
    const viteKey = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.API_KEY) : undefined;
    if (viteKey) return viteKey;

    // Check for process.env
    if (typeof process !== 'undefined' && process.env) {
        return process.env.API_KEY;
    }
    
    return undefined;
};

// Helper: Compress and Resize Image to avoid 400 Errors (Payload too large / Invalid Argument)
// Returns raw base64 string (without data: prefix) representing a JPEG
const prepareImageForAPI = async (base64Input: string): Promise<string> => {
    if (typeof window === 'undefined') return base64Input; // Server-side guard
    
    // Guard clause to prevent crash if input is undefined/null/empty
    if (!base64Input || typeof base64Input !== 'string') {
        throw new Error("Invalid or empty image data provided to Gemini service.");
    }

    return new Promise((resolve) => {
        const img = new Image();
        // Handle both raw base64 and data URI
        img.src = base64Input.startsWith('data:') ? base64Input : `data:image/jpeg;base64,${base64Input}`;

        img.onload = () => {
            const MAX_DIMENSION = 1024; // Gemini handles 1024x1024 well
            let width = img.width;
            let height = img.height;

            // Resize if too big
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = Math.round((height * MAX_DIMENSION) / width);
                    width = MAX_DIMENSION;
                } else {
                    width = Math.round((width * MAX_DIMENSION) / height);
                    height = MAX_DIMENSION;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                // Fallback to original if canvas fails
                resolve(base64Input.startsWith('data:') ? base64Input.split(',')[1] : base64Input);
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG with 0.8 quality to reduce size
            const newDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(newDataUrl.split(',')[1]);
        };

        img.onerror = () => {
            console.warn("Image compression failed, sending original.");
            resolve(base64Input.startsWith('data:') ? base64Input.split(',')[1] : base64Input);
        };
    });
};

export const generateScenePrompt = async (imageBase64?: string): Promise<string> => {
    const fallback = () => {
        const style = SCENE_STYLES[Math.floor(Math.random() * SCENE_STYLES.length)];
        const floor = FLOOR_TYPES[Math.floor(Math.random() * FLOOR_TYPES.length)];
        const decor = DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)];
        const present = MATTRESS_PRESENTATION[Math.floor(Math.random() * MATTRESS_PRESENTATION.length)];
        
        return `A realistic photo of ${present} placed in ${style} with ${floor}. ${decor}. Photorealistic, 8k product photography, luxury penthouse, golden hour lighting.`;
    };

    const apiKey = getApiKey();
    if (!imageBase64 || !apiKey) return fallback();

    try {
        // Compress image before sending
        const optimizedImage = await prepareImageForAPI(imageBase64);
        
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { text: "Generate a short prompt to place this mattress in a luxurious penthouse bedroom setting. Describe a spacious room with floor-to-ceiling windows offering a spectacular city skyline view during golden hour (sunset/sunrise). Include details about premium flooring, sophisticated decor (curtains, designer lamps, art), and a stylish bed frame or headboard. The lighting should be dramatic and warm. The mattress is the hero." },
                    { inlineData: { mimeType: "image/jpeg", data: optimizedImage } }
                ]
            }
        });
        const text = response.text;
        if (!text) return fallback();
        return `A realistic photo of the mattress placed in ${text}. High-end luxury penthouse, golden hour lighting, dramatic and opulent.`;
    } catch (e) {
        console.warn("Gemini 3 Flash prompt gen failed, using fallback", e);
        return fallback();
    }
};

export const analyzeMattressImage = async (imageBase64: string): Promise<{ brand?: string, size?: string, condition?: string, price?: number } | null> => {
     const apiKey = getApiKey();
     if (!apiKey) return null;
     
     try {
        const optimizedImage = await prepareImageForAPI(imageBase64);

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { text: "Analyze this mattress image. Identify the likely Brand (guess if unsure), Size (Twin, Twin XL, Full, Queen, King, Cal King), Condition (Nuevo (Plástico), Como Nuevo, Bueno, Con Detalles), and estimate a generous resale Price (USD number). Return JSON." },
                    { inlineData: { mimeType: "image/jpeg", data: optimizedImage } }
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
        const apiKey = getApiKey();
        if (!apiKey) {
            console.error("Missing API_KEY for Gemini");
            throw new Error("API Key missing");
        }

        const optimizedImage = await prepareImageForAPI(imageBase64);
        const ai = new GoogleGenAI({ apiKey });
        
        // Using gemini-2.5-flash-image for general image editing tasks
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: prompt },
                    { 
                        inlineData: { 
                            mimeType: "image/jpeg", 
                            data: optimizedImage 
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