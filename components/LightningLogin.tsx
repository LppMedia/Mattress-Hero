import React, { useState } from 'react';
import { Zap, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { ComicButton } from './UIComponents';
import { supabase } from '../supabaseClient';

export const LightningLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden flex flex-col items-center justify-center bg-gray-900">
      
      {/* The Lightning Split Background */}
      <div className="absolute inset-0 z-0">
        {/* Top Half (Orange) */}
        <div 
          className="absolute top-0 left-0 w-full h-[60%] bg-[#FF6D00]"
          style={{ 
            clipPath: "polygon(0 0, 100% 0, 100% 85%, 65% 100%, 0 75%)",
            zIndex: 2
          }}
        >
          <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: "radial-gradient(#000 2px, transparent 2px)", backgroundSize: "15px 15px" }} 
          />
        </div>
        
        {/* Shadow Layer for Split */}
        <div 
          className="absolute top-0 left-0 w-full h-[62%] bg-black"
          style={{ 
            clipPath: "polygon(0 0, 100% 0, 100% 86%, 65% 101%, 0 76%)",
            zIndex: 1
          }}
        />

        {/* Bottom Half (Purple) */}
        <div className="absolute inset-0 bg-[#6200EA] z-0 flex items-end justify-center pb-12">
           <div className="text-white opacity-10 text-9xl font-bangers rotate-12 absolute bottom-[-50px] right-[-50px]">POW!</div>
        </div>
      </div>

      {/* Login Content */}
      <div className="z-10 w-full max-w-xs p-6 relative">
        <div className="mb-8 text-center transform -rotate-2">
          <div className="inline-block bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="font-bangers text-5xl text-[#FF6D00] leading-none drop-shadow-[2px_2px_0px_#000]">
              MATTRESS
            </h1>
            <h1 className="font-bangers text-6xl text-[#6200EA] leading-none drop-shadow-[2px_2px_0px_#000]">
              HERO
            </h1>
          </div>
        </div>

        <form onSubmit={handleAuth} className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_#00E676] rounded-xl relative transition-all duration-300">
          <Zap className="absolute -top-6 -right-6 text-[#00E676] fill-[#00E676] drop-shadow-[2px_2px_0_#000]" size={48} />
          
          <h2 className="block font-bangers text-2xl mb-4 text-center">
            ACCESO PRIVADO
          </h2>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-yellow-50 text-black border-4 border-black p-2 pl-10 font-bold font-sans focus:outline-none focus:ring-2 focus:ring-[#FF6D00] focus:bg-white"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-yellow-50 text-black border-4 border-black p-2 pl-10 font-bold font-sans focus:outline-none focus:ring-2 focus:ring-[#FF6D00] focus:bg-white"
                placeholder="Contraseña"
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-2 bg-red-100 border-2 border-red-500 rounded flex items-center gap-2 text-xs font-bold text-red-600 animate-pulse">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <ComicButton 
            className="w-full mt-6" 
            type="submit" 
            variant="primary"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'ENTRAR A LA BASE'}
          </ComicButton>

          <div className="mt-4 text-center">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Solo Personal Autorizado
             </p>
          </div>
        </form>
      </div>
    </div>
  );
};