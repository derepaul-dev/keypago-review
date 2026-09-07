import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Check, 
  HelpCircle, 
  Image as ImageIcon
} from 'lucide-react';
import { Requirement, ChecklistItem, EvidencePhoto } from '../types';
import MockupRenderer from './MockupRenderer';
import { compressImageFile } from '../lib/imageCompressor';

interface ActiveModuleProps {
  requirement: Requirement;
  onUpdateRequirement: (updated: Requirement) => void;
  userRole: 'Admin' | 'Solicitante' | 'Desarrollador';
}

export default function ActiveModule({ requirement, onUpdateRequirement, userRole }: ActiveModuleProps) {
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editTitle, setEditTitle] = useState(requirement.title);
  const [editNumber, setEditNumber] = useState(requirement.number);
  const [newCheckItemText, setNewCheckItemText] = useState('');
  const [zoomedPhotoId, setZoomedPhotoId] = useState<string | null>(null);
  
  // Inline confirmation states
  const [confirmCheckDeleteId, setConfirmCheckDeleteId] = useState<string | null>(null);
  const [photoConfirmDeleteId, setPhotoConfirmDeleteId] = useState<string | null>(null);

  // File uploading and deletion for QA / "Guías adicionales"
  const handleUploadAdditionalGuide = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (userRole === 'Desarrollador') return;
    const file = e.target.files?.[0];
    if (!file) return;

    compressImageFile(file, 1024, 1024, 0.5)
      .then((compressedUrl) => {
        const newPhoto: EvidencePhoto = {
          id: `photo-${Date.now()}`,
          name: file.name,
          dataUrl: compressedUrl
        };
        
        const currentList = requirement.evidencePhotos || [];
        onUpdateRequirement({
          ...requirement,
          evidencePhotos: [...currentList, newPhoto]
        });
      })
      .catch((err) => {
        console.error('Error compressing image:', err);
        alert('Error al procesar la imagen.');
      });
  };

  const handleDeleteAdditionalGuide = (photoId: string) => {
    if (userRole === 'Desarrollador') return;
    const currentList = requirement.evidencePhotos || [];
    const updatedList = currentList.filter(p => p.id !== photoId);
    onUpdateRequirement({
      ...requirement,
      evidencePhotos: updatedList
    });
  };

  // Handle checking/unchecking item (restrcited to Admin and Solicitante)
  const toggleChecklistItem = (itemId: string) => {
    if (userRole === 'Desarrollador') {
      alert('Los Desarrolladores no tienen permisos para marcar requerimientos como completos.');
      return;
    }
    const updatedChecklist = requirement.checklist.map((item) => {
      if (item.id === itemId) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    onUpdateRequirement({ ...requirement, checklist: updatedChecklist });
  };

  // Add new checklist item (restricted to Admin and Solicitante)
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'Desarrollador') {
      alert('Los Desarrolladores no tienen permisos para editar requerimientos.');
      return;
    }
    if (!newCheckItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: `check-${Date.now()}`,
      text: newCheckItemText.trim(),
      completed: false
    };

    onUpdateRequirement({
      ...requirement,
      checklist: [...requirement.checklist, newItem]
    });
    setNewCheckItemText('');
  };

  // Delete checklist item (restricted to Admin and Solicitante)
  const handleDeleteChecklistItem = (itemId: string) => {
    if (userRole === 'Desarrollador') {
      alert('Los Desarrolladores no tienen permisos para editar requerimientos.');
      return;
    }
    const filteredChecklist = requirement.checklist.filter((item) => item.id !== itemId);
    onUpdateRequirement({ ...requirement, checklist: filteredChecklist });
  };

  // Save Meta edits
  const handleSaveMeta = () => {
    if (userRole === 'Desarrollador') {
      alert('Los Desarrolladores no tienen permisos para editar requerimientos.');
      return;
    }
    if (!editTitle.trim()) return;
    onUpdateRequirement({
      ...requirement,
      title: editTitle.trim(),
      number: Number(editNumber) || requirement.number
    });
    setIsEditingMeta(false);
  };

  // Cancel Meta edits
  const handleCancelMeta = () => {
    setEditTitle(requirement.title);
    setEditNumber(requirement.number);
    setIsEditingMeta(false);
  };

  // Check if everything is fully completed
  const isModuleFullyCompleted = requirement.checklist.length > 0 && 
    requirement.checklist.every((item) => item.completed);

  return (
    <div className="space-y-12 pb-32">
      {/* 1. HEADER SECTION (with massive numerical badge) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-gray-100">
        {isEditingMeta ? (
          <div className="flex-1 max-w-xl bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm animate-fade-in">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                  Número
                </label>
                <input
                  type="number"
                  value={editNumber}
                  onChange={(e) => setEditNumber(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-sans focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-900"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                  Nombre del Módulo
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-sans focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelMeta}
                className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
              <button
                onClick={handleSaveMeta}
                className="px-3.5 py-1 text-xs font-bold bg-[#1c1635] text-[#d4ff00] rounded-lg flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Number badge */}
            <div className="relative shrink-0">
              <div className="bg-[#1c1635] text-white flex items-center justify-center w-14 h-14 rounded-full font-black text-2xl font-sans shadow-md border-2 border-indigo-100">
                {requirement.number}
              </div>
              {isModuleFullyCompleted && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow">
                  <Check className="w-4 h-4 font-black" />
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[#1c1635] tracking-tight font-sans">
                  {requirement.title}
                </h1>
                {(userRole === 'Admin' || userRole === 'Solicitante') && (
                  <button
                    onClick={() => {
                      setEditTitle(requirement.title);
                      setEditNumber(requirement.number);
                      setIsEditingMeta(true);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                    title="Editar nombre y número de módulo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isModuleFullyCompleted ? (
                <span className="inline-flex mt-1.5 items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  ✓ Requerimiento aprobado
                </span>
              ) : (
                <span className="inline-flex mt-1.5 items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                  ● En revisión interna
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. REQUERIMIENTO CHECKLIST SECTION */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <h2 className="text-base font-extrabold text-[#1c1635] tracking-wide uppercase font-sans mb-5 flex items-center gap-1.5">
          <span>Requerimiento:</span>
          <span className="text-slate-400 hover:text-indigo-600 cursor-help" title="Completa las tareas para marcar el requerimiento como completado">
            <HelpCircle className="w-4 h-4" />
          </span>
        </h2>

        {/* Requirements checklist items list */}
        {requirement.checklist.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl mb-6">
            <p className="text-sm text-slate-400 font-sans font-medium">
              No hay tareas especificadas para este requerimiento.
            </p>
          </div>
        ) : (
          <ul className="space-y-4 mb-6">
            {requirement.checklist.map((item, index) => (
              <li
                key={item.id}
                className={`group flex items-start gap-4 p-3.5 rounded-2xl border transition-all duration-200
                  ${item.completed 
                    ? 'bg-slate-50 border-slate-200/50 text-slate-400' 
                    : 'bg-white border-slate-200/60 shadow-sm text-slate-700 hover:border-slate-300'
                  }`}
              >
                {/* Custom toggle button */}
                <button
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${item.completed ? 'text-emerald-500' : 'text-slate-500 hover:text-indigo-600'}`}
                >
                  {item.completed ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                {/* Index & Text wrapper */}
                <div className="flex-1 font-sans text-sm leading-relaxed">
                  <span className={`font-mono font-bold mr-1 ${item.completed ? 'text-slate-400/80 line-through' : 'text-indigo-600'}`}>
                    {index + 1}.
                  </span>
                  <span className={item.completed ? 'line-through text-slate-400' : ''}>
                    {item.text}
                  </span>
                </div>

                {/* Delete button */}
                {(userRole === 'Admin' || userRole === 'Solicitante') && (
                  confirmCheckDeleteId === item.id ? (
                    <div className="flex items-center gap-1 bg-rose-600 text-white rounded-lg py-0.5 px-2.5 shadow-sm animate-fade-in text-[10px] font-sans">
                      <span className="font-extrabold uppercase text-[8px] select-none">¿Seguro?</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChecklistItem(item.id);
                          setConfirmCheckDeleteId(null);
                        }}
                        className="bg-white hover:bg-slate-100 text-rose-700 font-bold px-1 py-0.5 rounded text-[8.5px] uppercase transition-all cursor-pointer leading-none"
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmCheckDeleteId(null);
                        }}
                        className="bg-rose-900/40 hover:bg-rose-900/60 text-white font-bold px-1 py-0.5 rounded text-[8.5px] uppercase transition-all cursor-pointer leading-none"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmCheckDeleteId(item.id)}
                      className="p-1 rounded text-red-100 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Input form to append new bullet checklist items */}
        {(userRole === 'Admin' || userRole === 'Solicitante') && (
          <form onSubmit={handleAddChecklistItem} className="flex gap-3">
            <input
              type="text"
              required
              value={newCheckItemText}
              onChange={(e) => setNewCheckItemText(e.target.value)}
              placeholder="Añadir una nueva especificación de cambio..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-sans placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1c1635]/15 focus:border-[#1c1635] transition-all font-medium"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-[#1c1635] text-[#d4ff00] rounded-2xl hover:bg-[#28204d] transition-all flex items-center justify-center gap-1.5 font-bold uppercase text-xs tracking-wider cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir</span>
            </button>
          </form>
        )}
      </div>

      {/* 3. EXPERIMENTAL PANELS / MULTI-DEVICE WRAPPERS */}
      <div className="space-y-6 pt-6">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
          <h2 className="text-xl font-bold tracking-tight text-[#1c1635] font-sans">
            Paneles de Implementación (Vistas de Calidad)
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-12">
          
          {/* IMPLEMENTATION 1: MOBILE LIGHT */}
          {(!requirement.enabledPanels || requirement.enabledPanels.mobileLight) ? (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold tracking-wider text-slate-700 font-sans uppercase flex items-center gap-1.5">
                <span>Implementación Mobile Light:</span>
              </h3>
              <MockupRenderer 
                requirement={requirement} 
                mode="light" 
                device="mobile" 
                resolution="375px" 
                onUpdateRequirement={onUpdateRequirement}
                userRole={userRole}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center h-auto min-h-[360px] py-10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mobile Light</span>
              <p className="text-xs text-slate-500 max-w-[180px]">Este panel fue desactivado en la definición del requerimiento.</p>
            </div>
          )}

          {/* IMPLEMENTATION 2: MOBILE DARK */}
          {(!requirement.enabledPanels || requirement.enabledPanels.mobileDark) ? (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold tracking-wider text-slate-700 font-sans uppercase flex items-center gap-1.5">
                <span>Implementación Mobile Dark:</span>
              </h3>
              <MockupRenderer 
                requirement={requirement} 
                mode="dark" 
                device="mobile" 
                resolution="375px" 
                onUpdateRequirement={onUpdateRequirement}
                userRole={userRole}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center h-auto min-h-[360px] py-10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mobile Dark</span>
              <p className="text-xs text-slate-500 max-w-[180px]">Este panel fue desactivado en la definición del requerimiento.</p>
            </div>
          )}

          {/* IMPLEMENTATION 3: DESKTOP LIGHT */}
          {(!requirement.enabledPanels || requirement.enabledPanels.desktopLight) ? (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold tracking-wider text-slate-700 font-sans uppercase flex items-center gap-1.5">
                <span>Implementación Desktop Light:</span>
              </h3>
              <MockupRenderer 
                requirement={requirement} 
                mode="light" 
                device="desktop" 
                resolution="1921px" 
                onUpdateRequirement={onUpdateRequirement}
                userRole={userRole}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center h-auto min-h-[360px] py-10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Desktop Light</span>
              <p className="text-xs text-slate-500 max-w-[180px]">Este panel fue desactivado en la definición del requerimiento.</p>
            </div>
          )}

          {/* IMPLEMENTATION 4: DESKTOP DARK */}
          {(!requirement.enabledPanels || requirement.enabledPanels.desktopDark) ? (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold tracking-wider text-slate-700 font-sans uppercase flex items-center gap-1.5">
                <span>Implementación Desktop Dark:</span>
              </h3>
              <MockupRenderer 
                requirement={requirement} 
                mode="dark" 
                device="desktop" 
                resolution="1921px" 
                onUpdateRequirement={onUpdateRequirement}
                userRole={userRole}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center h-auto min-h-[360px] py-10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Desktop Dark</span>
              <p className="text-xs text-slate-500 max-w-[180px]">Este panel fue desactivado en la definición del requerimiento.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. GUÍAS ADICIONALES SECTION */}
      <div className="space-y-6 pt-10 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
            <h2 className="text-xl font-bold tracking-tight text-[#1c1635] font-sans">
              Guías adicionales
            </h2>
          </div>
          
          {/* Main Direct Upload input (if user holds authorization and there are already elements) */}
          {userRole !== 'Desarrollador' && requirement.evidencePhotos && requirement.evidencePhotos.length > 0 && (
            <label className="px-4 py-2 bg-slate-100 hover:bg-[#d4ff00] text-[#1c1635] text-xs font-extrabold uppercase tracking-wide flex items-center gap-2 cursor-pointer shadow-sm border border-slate-200/50 transition-all select-none rounded-2xl">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleUploadAdditionalGuide} 
                className="hidden" 
              />
              <Plus className="w-4 h-4" />
              <span>Adjuntar Guía</span>
            </label>
          )}
        </div>

        {requirement.evidencePhotos && requirement.evidencePhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {requirement.evidencePhotos.map((photo) => (
              <div 
                key={photo.id} 
                className="group relative rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative">
                  <img 
                    src={photo.dataUrl} 
                    alt={photo.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer" 
                    onClick={() => setZoomedPhotoId(photo.id)}
                  />
                  <div 
                    onClick={() => setZoomedPhotoId(photo.id)}
                    className="absolute inset-0 bg-[#0f0c1e]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <span className="px-3 py-1.5 rounded-full bg-white text-xs font-bold text-slate-900 shadow">
                      Agrandar foto
                    </span>
                  </div>

                  {/* Delete button from QA guide with inline confirm */}
                  {userRole !== 'Desarrollador' && (
                    <div className="absolute top-2 right-2 z-20">
                      {photoConfirmDeleteId === photo.id ? (
                        <div className="bg-rose-600 text-white rounded-xl py-1 px-1.5 shadow-md flex items-center gap-1.5 animate-fade-in font-sans">
                          <span className="text-[9px] font-black uppercase select-none leading-none">¿Seguro?</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAdditionalGuide(photo.id);
                              setPhotoConfirmDeleteId(null);
                            }}
                            className="bg-white text-rose-700 hover:bg-slate-100 font-extrabold text-[8px] uppercase px-1.5 py-0.5 rounded transition-all cursor-pointer leading-none"
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhotoConfirmDeleteId(null);
                            }}
                            className="bg-rose-900/50 hover:bg-rose-900/40 text-rose-100 font-extrabold text-[8px] uppercase px-1.5 py-0.5 rounded transition-all cursor-pointer leading-none"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoConfirmDeleteId(photo.id);
                          }}
                          className="p-1.5 rounded-lg bg-rose-600/95 hover:bg-rose-700 text-white shadow-md hover:scale-105 transition-all cursor-pointer"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-2.5 px-1 truncate font-sans">
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {photo.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Captura de evidencia</span>
                </div>
              </div>
            ))}

            {/* In-Grid shortcut to upload more guides (restricted from Developers) */}
            {userRole !== 'Desarrollador' && (
              <label className="group relative rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/10 p-4 flex flex-col items-center justify-center text-center min-h-[160px] cursor-pointer transition-all duration-200 bg-slate-50/20">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleUploadAdditionalGuide} 
                  className="hidden" 
                />
                <Plus className="w-6 h-6 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700">Subir guía adicional</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Imágenes (.png, .jpg, .svg)</span>
              </label>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-white rounded-full shadow-xs mb-3 text-slate-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-sans font-medium">
              Esta sección aparecerá vacía
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">
              No se han adjuntado fotos o guías adicionales de QA para este requerimiento.
            </span>
            {userRole !== 'Desarrollador' && (
              <label className="mt-4 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow cursor-pointer select-none">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleUploadAdditionalGuide} 
                  className="hidden" 
                />
                Subir primera guía
              </label>
            )}
          </div>
        )}

        {/* Dynamic Zoom Overlay Modal */}
        {zoomedPhotoId && (() => {
          const photo = requirement.evidencePhotos?.find((p) => p.id === zoomedPhotoId);
          if (!photo) return null;
          return createPortal(
            <div className="fixed inset-0 z-[100100] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-slate-950/90 backdrop-blur" 
                onClick={() => setZoomedPhotoId(null)} 
              />
              <div className="relative max-w-4xl max-h-[85vh] z-[1010] bg-white rounded-3xl p-3 border border-slate-200 overflow-hidden flex flex-col animate-fade-in">
                <button 
                  onClick={() => setZoomedPhotoId(null)}
                  className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-800 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
                >
                  Cerrar [✕]
                </button>
                <img 
                  src={photo.dataUrl} 
                  alt={photo.name} 
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl" 
                />
                <div className="p-3 text-center">
                  <p className="text-xs font-bold text-slate-800 font-sans">{photo.name}</p>
                </div>
              </div>
            </div>,
            document.body
          );
        })()}
      </div>
    </div>
  );
}
