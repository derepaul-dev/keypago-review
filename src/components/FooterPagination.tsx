import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Requirement } from '../types';

interface FooterPaginationProps {
  previousRequirement: Requirement | null;
  nextRequirement: Requirement | null;
  onNavigate: (id: string) => void;
}

export default function FooterPagination({
  previousRequirement,
  nextRequirement,
  onNavigate,
}: FooterPaginationProps) {
  
  // Truncate helper for button titles
  const truncateTitle = (title: string, maxLength: number) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <footer className="fixed bottom-0 right-0 left-0 lg:left-80 h-20 bg-white/95 backdrop-blur border-t border-slate-200/80 z-40 flex items-center justify-between px-6 sm:px-10 shadow-lg">
      {/* 1. PREVIOUS COMPONENT BUTTON */}
      {previousRequirement ? (
        <button
          onClick={() => onNavigate(previousRequirement.id)}
          className="group flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-slate-700 hover:bg-slate-50 text-slate-800 transition-all text-xs font-semibold font-sans outline-none active:scale-[0.98]"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>
            {previousRequirement.number} {truncateTitle(previousRequirement.title, 12)}
          </span>
        </button>
      ) : (
        <div className="w-10" /> /* Placeholder */
      )}

      {/* Decorative center info */}
      <div className="hidden md:flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#1c1635] opacity-25"></span>
        <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
          REVISIÓN DE REQUERIMIENTOS
        </span>
        <span className="w-2 h-2 rounded-full bg-[#1c1635] opacity-25"></span>
      </div>

      {/* 2. NEXT COMPONENT BUTTON */}
      {nextRequirement ? (
        <button
          onClick={() => onNavigate(nextRequirement.id)}
          className="group flex items-center justify-between gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-slate-950 hover:bg-slate-900 border border-slate-950 text-white transition-all text-xs font-bold font-sans outline-none active:scale-[0.98] shadow-md"
        >
          <span>
            {nextRequirement.number}. {truncateTitle(nextRequirement.title, 14)}
          </span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#d4ff00]" />
        </button>
      ) : (
        <div className="w-10" /> /* Placeholder */
      )}
    </footer>
  );
}
