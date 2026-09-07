import React, { useState, useEffect, useRef } from 'react';
import { PanelLeftClose, Plus, Trash2, ClipboardCheck, Sparkles, ChevronDown, LogOut, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Requirement } from '../types';

interface SidebarProps {
  requirements: Requirement[];
  activeId: string;
  onSelect: (id: string) => void;
  filterTab: 'Pendientes' | 'Desarrollo' | 'Completos';
  setFilterTab: (tab: 'Pendientes' | 'Desarrollo' | 'Completos') => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onAddRequirement: () => void;
  onDeleteRequirement: (id: string, e: React.MouseEvent) => void;
  userEmail: string;
  userRole: 'Admin' | 'Solicitante' | 'Desarrollador';
  onLogout?: () => void;
}

export default function Sidebar({
  requirements,
  activeId,
  onSelect,
  filterTab,
  setFilterTab,
  isOpenMobile,
  setIsOpenMobile,
  onAddRequirement,
  onDeleteRequirement,
  userEmail,
  userRole,
  onLogout,
}: SidebarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Smooth scroll into view when activeId changes
  useEffect(() => {
    if (activeId) {
      const element = document.getElementById(`sidebar-req-${activeId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeId]);

  const namePart = (userEmail.split('@')[0] || 'User').split('.')[0] || 'User';
  
  // Calculate counts for badges
  const totalCount = requirements.length;
  const pendingCount = requirements.filter(req => 
    req.checklist.some(item => !item.completed)
  ).length;

  const isInDevelopment = (req: Requirement) => {
    if (!req.panelImages) return false;
    const keyImages = [
      req.panelImages.mobileDark,
      req.panelImages.mobileLight,
      req.panelImages.desktopLight,
      req.panelImages.desktopDark
    ];
    return keyImages.some(img => img && (!!img.antes || !!img.despues));
  };

  const developmentCount = requirements.filter(isInDevelopment).length;

  const completedCount = requirements.filter(req => 
    !req.checklist.some(item => !item.completed)
  ).length;

  // Filter requirements based on the chosen tab
  const filteredRequirements = requirements.filter(req => {
    if (filterTab === 'Pendientes') {
      return req.checklist.some(item => !item.completed);
    }
    if (filterTab === 'Desarrollo') {
      return isInDevelopment(req);
    }
    if (filterTab === 'Completos') {
      return !req.checklist.some(item => !item.completed);
    }
    return true;
  });

  return (
    <>
      {/* Black backdrop overlay for Mobile SideBar */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-[#1c1635]/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Main Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-76 lg:w-80 bg-[#1c1635] flex flex-col border-r border-[#1c1635] shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* SIDEBAR HEADER - Navy blue with Pill switches */}
        <div className="p-5 pb-6 bg-[#1c1635] border-b border-[#2d2454] shrink-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 100 110" className="w-7 h-7 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="110" rx="22" fill="#d4ff00"/>
                <path d="M14.5 25 L34 40 V70 L14.5 85 Z" fill="#1c1635"/>
                <path d="M42.5 15 H85 L55 55 L85 95 H42.5 Z" fill="#1c1635"/>
              </svg>
              <span className="text-sm font-black text-white tracking-wider font-sans">
                REVIEW
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* User Dropdown Profile Button */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2d2454]/60 border border-[#2d2454] text-xs font-bold font-sans text-slate-300 hover:text-white hover:bg-[#392e66]/85 transition-all cursor-pointer shadow-sm select-none"
                >
                  <span className="capitalize">{namePart}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#d4ff00]' : ''}`} />
                </button>

                {/* Dropdown Popup */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-[60] flex flex-col gap-2.5 animate-fade-in text-slate-800">
                    <div className="px-2 py-1.5 border-b border-slate-100/60 font-sans">
                      <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">Usuario</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{userEmail}</p>
                    </div>
                    
                    <div className="px-2 py-0.5 font-sans">
                      <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">Rol Asignado</p>
                      <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                        {userRole}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-rose-600 hover:bg-rose-50 transition-all text-left font-sans mt-1 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>

              {/* Close Mobile Menu Button */}
              <button
                onClick={() => setIsOpenMobile(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-[#d4ff00] hover:bg-[#2d2454]/40 transition-colors"
                title="Cerrar panel"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pill Switches with Horizontal Scroll & Navigation Arrows */}
          <div className="relative flex items-center gap-1.5 bg-[#2d2454]/60 p-1.5 rounded-full border border-[#2d2454] w-full">
            {/* Left Scroll Button */}
            <button
              type="button"
              onClick={scrollLeft}
              className="p-1 rounded-full bg-[#1c1635]/80 hover:bg-[#1c1635] text-slate-300 hover:text-[#d4ff00] transition-colors cursor-pointer flex-shrink-0 flex items-center justify-center select-none shadow-md"
              title="Desplazar a la izquierda"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Scrollable Track */}
            <div 
              ref={scrollRef}
              className="flex-1 flex overflow-x-auto scroll-smooth gap-1 items-center scrollbar-none [&::-webkit-scrollbar]:hidden py-0.5 px-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => setFilterTab('Pendientes')}
                className={`flex-shrink-0 py-1 px-2.5 rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer
                  ${filterTab === 'Pendientes' 
                    ? 'bg-[#d4ff00] text-[#1c1635] shadow-sm' 
                    : 'text-slate-300 hover:text-white'
                  }`}
              >
                Pendientes
                <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold
                  ${filterTab === 'Pendientes' ? 'bg-[#1c1635] text-[#d4ff00]' : 'bg-[#1c1635]/40 text-slate-300'}`}>
                  {pendingCount}
                </span>
              </button>
              
              <button
                onClick={() => setFilterTab('Desarrollo')}
                className={`flex-shrink-0 py-1 px-2.5 rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer
                  ${filterTab === 'Desarrollo' 
                    ? 'bg-[#d4ff00] text-[#1c1635] shadow-sm' 
                    : 'text-slate-300 hover:text-white'
                  }`}
              >
                Desarrollo
                <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold
                  ${filterTab === 'Desarrollo' ? 'bg-[#1c1635] text-[#d4ff00]' : 'bg-[#1c1635]/40 text-slate-300'}`}>
                  {developmentCount}
                </span>
              </button>

              <button
                onClick={() => setFilterTab('Completos')}
                className={`flex-shrink-0 py-1 px-2.5 rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer
                  ${filterTab === 'Completos' 
                    ? 'bg-[#d4ff00] text-[#1c1635] shadow-sm' 
                    : 'text-slate-300 hover:text-white'
                  }`}
              >
                Completos
                <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold
                  ${filterTab === 'Completos' ? 'bg-[#1c1635] text-[#d4ff00]' : 'bg-[#1c1635]/40 text-slate-300'}`}>
                  {completedCount}
                </span>
              </button>
            </div>

            {/* Right Scroll Button */}
            <button
              type="button"
              onClick={scrollRight}
              className="p-1 rounded-full bg-[#1c1635]/80 hover:bg-[#1c1635] text-slate-300 hover:text-[#d4ff00] transition-colors cursor-pointer flex-shrink-0 flex items-center justify-center select-none shadow-md"
              title="Desplazar a la derecha"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SIDEBAR BODY - Light Gray list region */}
        <div className="flex-1 bg-[#eaeaea] overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-gray-300 space-y-4">
          
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase">
              REQUERIMIENTOS
            </span>
            {(userRole === 'Admin' || userRole === 'Solicitante') && (
              <button
                onClick={onAddRequirement}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold tracking-wide uppercase transition-colors shadow-sm cursor-pointer"
                title="Añadir nuevo requerimiento"
              >
                <Plus className="w-3 h-3" />
                <span>Nuevo</span>
              </button>
            )}
          </div>

          {filteredRequirements.length === 0 ? (
            <div className="text-center py-10 px-4">
              <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto opacity-50 mb-2" />
              <p className="text-xs text-slate-500 font-sans font-medium">
                No hay módulos en esta sección.
              </p>
            </div>
          ) : (
            filteredRequirements.map((req) => {
              const isActive = req.id === activeId;
              const hasUncompleted = req.checklist.some(it => !it.completed);
              
              return (
                <div key={req.id} className="relative group">
                  <button
                    id={`sidebar-req-${req.id}`}
                    onClick={() => {
                      onSelect(req.id);
                      setIsOpenMobile(false);
                    }}
                    className={`w-full text-left p-4 pr-10 rounded-2xl transition-all duration-200 outline-none relative shadow-sm flex flex-col justify-between h-28 cursor-pointer
                      ${isActive 
                        ? 'bg-black text-[#d4ff00] ring-2 ring-black font-semibold scale-[1.02]' 
                        : 'bg-white hover:bg-slate-50 border border-gray-100 text-slate-700 font-medium'
                      }`}
                  >
                    {/* Card Index top-left */}
                    <span className={`text-base font-extrabold block leading-none font-sans
                      ${isActive ? 'text-[#d4ff00]' : 'text-slate-400 opacity-60'}`}>
                      {req.number}
                    </span>

                    {/* Card Title centered/bottom */}
                    <div className="mt-auto">
                      <span className={`text-[13px] font-bold block leading-tight font-sans tracking-wide
                        ${isActive ? 'text-[#d4ff00]' : 'text-slate-800'}`}>
                        {req.title}
                      </span>
                      {/* Subtitle status badge */}
                      {!isActive && (
                        <span className={`text-[9px] font-medium block mt-1
                          ${hasUncompleted ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {hasUncompleted ? '● Pendientes' : '✓ Completado'}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Delete button (only show on group hover if user is Admin or Solicitante) */}
                  {(userRole === 'Admin' || userRole === 'Solicitante') && (
                    confirmDeleteId === req.id ? (
                      <div className="absolute top-2.5 right-2 text-white bg-rose-600 rounded-xl py-1 px-2 shadow-lg flex items-center gap-1.5 z-30 animate-fade-in font-sans">
                        <span className="text-[10px] font-black uppercase tracking-wider select-none">¿Seguro?</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRequirement(req.id, e);
                            setConfirmDeleteId(null);
                          }}
                          className="bg-white hover:bg-slate-100 text-rose-700 font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded transition-all cursor-pointer leading-none"
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="bg-rose-950/40 hover:bg-rose-950/60 text-white font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded transition-all cursor-pointer leading-none"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(req.id);
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 cursor-pointer"
                        title="Eliminar requerimiento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                </div>
              );
            })
          )}


        </div>

        {/* Brand signature footnote */}
        <div className="bg-[#1c1635] p-4 text-center border-t border-[#2d2454] text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-[#d4ff00] animate-pulse" />
          <span>keypago • Review</span>
        </div>
      </aside>
    </>
  );
}
