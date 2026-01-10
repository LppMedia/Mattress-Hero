import React from 'react';
import { RefreshCw, LucideIcon } from 'lucide-react';

export const ComicText: React.FC<{ children: React.ReactNode, className?: string, size?: string, style?: React.CSSProperties }> = ({ 
  children, 
  className = "", 
  size = "text-xl",
  style = {}
}) => (
  <h2 className={`font-bangers tracking-wide ${size} ${className}`} style={{ textShadow: '2px 2px 0px #000', ...style }}>
    {children}
  </h2>
);

interface ComicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "danger" | "ghost" | "magic";
  icon?: LucideIcon;
  isLoading?: boolean;
}

export const ComicButton: React.FC<ComicButtonProps> = ({ 
  onClick, 
  children, 
  variant = "primary", 
  className = "", 
  icon: Icon, 
  disabled = false, 
  isLoading = false,
  type = "button"
}) => {
  let bg = "bg-orange-500";
  let text = "text-white";
  
  if (variant === "secondary") bg = "bg-[#6200EA]"; // Purple
  if (variant === "accent") { bg = "bg-[#00E676]"; text = "text-black"; } // Green
  if (variant === "danger") bg = "bg-red-600";
  if (variant === "ghost") { bg = "bg-white"; text = "text-black"; }
  if (variant === "magic") { bg = "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"; text = "text-white"; }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        relative group flex items-center justify-center gap-2 px-6 py-3 
        border-4 border-black rounded-lg
        font-bangers text-xl tracking-wider uppercase
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
        transition-all duration-100
        disabled:opacity-50 disabled:cursor-not-allowed
        ${bg} ${text} ${className}
      `}
    >
      {isLoading ? <RefreshCw className="animate-spin" size={24} /> : Icon && <Icon size={24} strokeWidth={3} />}
      {children}
    </button>
  );
};

export const StatCard: React.FC<{ title: string, value: number, icon: LucideIcon, color: string, onClick?: () => void }> = ({ 
  title, 
  value, 
  icon: Icon, 
  color,
  onClick
}) => (
  <div 
    onClick={onClick}
    className={`
      bg-white border-4 border-black p-4 rounded-xl 
      shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
      flex flex-col items-center justify-center text-center
      transform hover:-rotate-1 transition-transform
      ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
  `}>
    <div className={`p-3 rounded-full border-2 border-black mb-2 ${color}`}>
      <Icon size={28} className="text-white drop-shadow-md" strokeWidth={3} />
    </div>
    <div className="font-bold text-black uppercase text-sm">{title}</div>
    <div className="font-bangers text-4xl text-black">{value}</div>
  </div>
);

export const NavButton: React.FC<{ icon: LucideIcon, label: string, active: boolean, onClick: () => void, isMain?: boolean }> = ({ 
    icon: Icon, 
    label, 
    active, 
    onClick, 
    isMain 
}) => {
    if (isMain) {
        return (
            <button 
                onClick={onClick}
                className="
                    relative -top-6 
                    bg-[#FF6D00] text-white 
                    w-16 h-16 rounded-full 
                    border-4 border-black 
                    flex items-center justify-center 
                    shadow-[4px_4px_0px_0px_#000]
                    active:translate-y-1 active:shadow-none
                    transition-all
                "
            >
                <Icon size={32} strokeWidth={3} />
            </button>
        )
    }
    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-16 ${active ? 'text-[#6200EA]' : 'text-gray-400'}`}
        >
            <Icon size={24} strokeWidth={active ? 3 : 2} className={active ? 'drop-shadow-sm' : ''} />
            <span className="text-[10px] font-bold uppercase mt-1">{label}</span>
        </button>
    );
};