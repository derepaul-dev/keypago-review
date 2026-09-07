import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Monitor, Smartphone, Sparkles, Check, Hourglass, Plus, X, Upload, Trash2, ArrowRight } from 'lucide-react';
import { Requirement } from '../types';
import { compressImageDataUrl } from '../lib/imageCompressor';

interface MockupRendererProps {
  requirement: Requirement;
  mode: 'light' | 'dark';
  device: 'mobile' | 'desktop';
  resolution: string;
  onUpdateRequirement?: (updated: Requirement) => void;
  userRole: 'Admin' | 'Solicitante' | 'Desarrollador';
}

export default function MockupRenderer({ 
  requirement, 
  mode, 
  device, 
  resolution,
  onUpdateRequirement,
  userRole
}: MockupRendererProps) {
  const [activePane, setActivePane] = useState<'split' | 'antes' | 'despues'>('split');
  const [uploadTarget, setUploadTarget] = useState<'antes' | 'despues' | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [selectedDataUrl, setSelectedDataUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [confirmDeleteType, setConfirmDeleteType] = useState<'antes' | 'despues' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (uploadTarget) {
      setSelectedDataUrl(null);
      setSelectedFileName('');
      setErrorMsg('');
    }
  }, [uploadTarget]);

  // Determine styles depending on dark/light mode
  const isDark = mode === 'dark';
  const themeBg = isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-100 text-[#1c1635]';
  const themeText = isDark ? 'text-slate-300' : 'text-slate-600';
  const themeTextMuted = isDark ? 'text-slate-500' : 'text-slate-400';

  // Construct panel key for storage
  const panelKey = `${device}${mode.charAt(0).toUpperCase()}${mode.slice(1)}` as 'mobileDark' | 'mobileLight' | 'desktopLight' | 'desktopDark';
  const currentImages = requirement.panelImages?.[panelKey] || {};
  const hasAntes = !!currentImages.antes;
  const hasDespues = !!currentImages.despues;

  // Expected resolution width
  const requiredWidth = device === 'mobile' ? 375 : 1921;

  // Trigger upload handling based on authorization
  const handleTriggerUpload = (target: 'antes' | 'despues') => {
    if (userRole === 'Solicitante') {
      alert('Los Solicitantes no tienen permisos para cargar implementaciones (Antes o Después).');
      return;
    }
    setUploadTarget(target);
  };

  // Process selected or dropped file
  const processFile = (file: File) => {
    if (!file) return;
    setIsValidating(true);
    setErrorMsg('');
    setSelectedDataUrl(null);
    setSelectedFileName('');

    // Ensure it's an image
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Error: El archivo seleccionado no es una imagen válida. Intente con PNG, JPG, JPEG o WEBP.');
      setIsValidating(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        if (img.width !== requiredWidth) {
          setErrorMsg(
            `Error: La resolución de ancho solicitada para este panel es ${requiredWidth}px, pero la imagen cargada tiene ${img.width}px.`
          );
          setIsValidating(false);
        } else {
          // Success! Compress and save to draft state
          compressImageDataUrl(dataUrl, undefined, undefined, 0.55)
            .then((compressed) => {
              setSelectedDataUrl(compressed);
              setSelectedFileName(file.name);
              setIsValidating(false);
            })
            .catch((err) => {
              console.error('Error compressing mockup image:', err);
              setSelectedDataUrl(dataUrl);
              setSelectedFileName(file.name);
              setIsValidating(false);
            });
        }
      };
      
      img.onerror = () => {
        setErrorMsg('Error al decodificar la imagen. Por favor asegúrese de cargar un archivo de imagen funcional.');
        setIsValidating(false);
      };
    };

    reader.onerror = () => {
      setErrorMsg('Error al leer el archivo del dispositivo.');
      setIsValidating(false);
    };

    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = () => {
    if (!selectedDataUrl) return;
    if (onUpdateRequirement) {
      const nextPanelImages = {
        ...(requirement.panelImages || {}),
        [panelKey]: {
          ...(requirement.panelImages?.[panelKey] || {}),
          [uploadTarget || 'antes']: selectedDataUrl
        }
      };
      onUpdateRequirement({
        ...requirement,
        panelImages: nextPanelImages
      });
    }
    setUploadTarget(null);
    setSelectedDataUrl(null);
    setSelectedFileName('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearImage = (type: 'antes' | 'despues', e: React.MouseEvent) => {
    e.stopPropagation();
    if (userRole === 'Solicitante') {
      alert('Los Solicitantes no tienen permisos para eliminar implementaciones.');
      return;
    }
    if (!window.confirm(`¿Está seguro de que desea eliminar la vista de ${type === 'antes' ? 'Antes' : 'Después'}?`)) return;
    
    if (onUpdateRequirement) {
      const nextPanelImages = {
        ...(requirement.panelImages || {}),
        [panelKey]: {
          ...(requirement.panelImages?.[panelKey] || {}),
        }
      };
      delete nextPanelImages[panelKey][type];

      onUpdateRequirement({
        ...requirement,
        panelImages: nextPanelImages
      });
    }
  };

  const renderImageWithActions = (type: 'antes' | 'despues', src: string) => {
    return (
      <div className="w-full h-auto group relative overflow-hidden block">
        <img src={src} className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.01]" alt={type === 'antes' ? 'Antes' : 'Después'} />
        
        {/* Floating action header in the upper part of each image */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-35">
          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded leading-none select-none text-white ${type === 'antes' ? 'bg-rose-955/90 text-rose-300' : 'bg-emerald-950/90 text-emerald-300'}`}>
            {type === 'antes' ? 'Antes' : 'Después'}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImageUrl(src);
              }}
              className="bg-slate-950/95 hover:bg-black text-[#d4ff05] p-1.5 px-2 rounded-md text-[8px] font-black uppercase transition-all flex items-center gap-1 border border-[#d4ff05]/20 cursor-pointer shadow-sm pointer-events-auto"
              title="Preview: Ver con mayor claridad y tamaño"
            >
              <Eye className="w-3 h-3 text-[#d4ff05]" />
              <span className="xs:inline">Preview</span>
            </button>
            {userRole !== 'Solicitante' && (
              confirmDeleteType === type ? (
                <div className="flex items-center gap-1 bg-rose-600 text-white rounded-md py-1 px-2.5 shadow-md pointer-events-auto select-none z-10 font-sans">
                  <span className="text-[8px] font-black uppercase leading-none">¿Seguro?</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearImage(type, e);
                      setConfirmDeleteType(null);
                    }}
                    className="bg-white hover:bg-slate-100 text-rose-700 font-extrabold text-[8px] uppercase px-1.5 py-0.5 rounded transition-all cursor-pointer leading-none"
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteType(null);
                    }}
                    className="bg-rose-950/40 hover:bg-rose-950/60 text-white font-extrabold text-[8px] uppercase px-1.5 py-0.5 rounded transition-all cursor-pointer leading-none"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteType(type);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 px-2 rounded-md text-[8px] font-black uppercase transition-all flex items-center gap-1 shadow-sm cursor-pointer pointer-events-auto"
                  title="Eliminar este archivo"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                  <span className="xs:inline">Eliminar</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Hover action cover for alternative upload/replace */}
        {userRole !== 'Solicitante' && (
          <div className="absolute inset-x-0 bottom-0 top-12 bg-gradient-to-t from-black/85 via-black/45 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end items-center pb-4 z-10 font-sans">
            <button 
              type="button"
              onClick={() => handleTriggerUpload(type)} 
              className="px-3.5 py-1.5 rounded-lg bg-[#d4ff00] text-[#1c1635] text-[9px] font-black uppercase tracking-wider shadow hover:bg-white transition-all pointer-events-auto cursor-pointer"
            >
              Reemplazar imagen
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id={`mockup-${requirement.id}-${mode}-${device}`} className={`w-full relative p-5 rounded-3xl border ${themeBg} flex flex-col items-stretch justify-between h-auto min-h-[410px] shadow-sm hover:shadow-md transition-all duration-305`}>
      
      {/* Upper Mode bar / Header */}
      <div className="w-full flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {device === 'mobile' ? (
            <Smartphone className="w-4 h-4 text-slate-500" />
          ) : (
            <Monitor className="w-4 h-4 text-slate-500" />
          )}
          <span className="text-xs font-black font-sans uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <span>{device === 'mobile' ? 'Celular' : 'Escritorio'}</span> 
            <span className="opacity-30">•</span>
            <span className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>{mode === 'dark' ? 'Oscuro' : 'Claro'}</span>
          </span>
        </div>
        
        {/* Split/Antes/Después Segmented Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-xs w-full sm:w-auto">
          <button
            onClick={() => setActivePane('split')}
            className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activePane === 'split' ? 'bg-[#1c1635] text-[#d4ff00] shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Split
          </button>
          <button
            onClick={() => setActivePane('antes')}
            className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activePane === 'antes' ? 'bg-[#1c1635] text-[#d4ff00] shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Antes
          </button>
          <button
            onClick={() => setActivePane('despues')}
            className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activePane === 'despues' ? 'bg-[#1c1635] text-[#d4ff00] shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Después
          </button>
        </div>
      </div>

      {/* Frame Visual Device Wrapper Shell */}
      <div className="relative flex-1 w-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/40 min-h-[300px]">
        {device === 'mobile' ? (
          /* SMARTPHONE SHELL FRAME */
          <div className="w-full max-w-md rounded-[36px] bg-slate-950 border-[6px] border-slate-900 shadow-xl relative overflow-hidden flex flex-col h-auto">
            {/* Notch */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-slate-900 rounded-full z-20 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 mr-2 border border-slate-800"></span>
              <span className="w-5 h-0.5 rounded-full bg-slate-800"></span>
            </div>

            {/* Simulated Frame Screen Content */}
            <div className={`w-full overflow-hidden relative ${isDark ? 'bg-slate-900' : 'bg-slate-50'} mt-3.5 rounded-b-[26px] h-auto min-h-[350px] flex flex-col`}>
              
              {/* SPLIT SCREEN VIEW */}
              {activePane === 'split' && (
                <div className="w-full flex items-stretch h-auto min-h-[350px]">
                  {/* Left Half: Antes */}
                  <div className="w-1/2 bg-[#E5E7EB] dark:bg-slate-800 overflow-hidden relative border-r border-[#9CA3AF]/40 flex flex-col justify-center items-center">
                    {hasAntes ? (
                      renderImageWithActions('antes', currentImages.antes!)
                    ) : (
                      <button
                        onClick={() => handleTriggerUpload('antes')}
                        className="w-full min-h-[350px] flex-1 flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200/80 text-slate-400 hover:text-[#1c1635] transition-all p-3 text-center cursor-pointer"
                        title="Cargar imagen de Antes"
                      >
                        <Plus className="w-6 h-6 text-indigo-500 mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-wide leading-none">Antes</span>
                        <span className="text-[8px] text-slate-400 font-mono mt-0.5">({requiredWidth}px)</span>
                      </button>
                    )}
                  </div>

                  {/* Right Half: Después */}
                  <div className="w-1/2 bg-[#4B5563] dark:bg-slate-700 overflow-hidden relative flex flex-col justify-center items-center">
                    {hasDespues ? (
                      renderImageWithActions('despues', currentImages.despues!)
                    ) : (
                      <button
                        onClick={() => handleTriggerUpload('despues')}
                        className="w-full min-h-[350px] flex-1 flex flex-col items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-400 hover:text-slate-800 transition-all p-3 text-center cursor-pointer"
                        title="Cargar imagen de Después"
                      >
                        <Plus className="w-6 h-6 text-indigo-500 mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-wide leading-none">Después</span>
                        <span className="text-[8px] text-slate-400 font-mono mt-0.5">({requiredWidth}px)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ONLY ANTES SCREEN VIEW */}
              {activePane === 'antes' && (
                <div className="w-full h-auto min-h-[350px] flex flex-col items-center justify-center relative">
                  {hasAntes ? (
                    renderImageWithActions('antes', currentImages.antes!)
                  ) : (
                    <button
                      onClick={() => handleTriggerUpload('antes')}
                      className="w-full min-h-[350px] flex-1 flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-850 transition-all p-3 text-center cursor-pointer"
                    >
                      <Plus className="w-8 h-8 text-indigo-500 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-wide">Cargar Antes</span>
                      <span className="text-[8px] text-slate-400 font-mono mt-0.5">({requiredWidth}px)</span>
                    </button>
                  )}
                </div>
              )}

              {/* ONLY DESPUES SCREEN VIEW */}
              {activePane === 'despues' && (
                <div className="w-full h-auto min-h-[350px] flex flex-col items-center justify-center relative">
                  {hasDespues ? (
                    renderImageWithActions('despues', currentImages.despues!)
                  ) : (
                    <button
                      onClick={() => handleTriggerUpload('despues')}
                      className="w-full min-h-[350px] flex-1 flex flex-col items-center justify-center bg-slate-200 hover:bg-slate-350 text-slate-400 hover:text-slate-850 transition-all p-3 text-center cursor-pointer"
                    >
                      <Plus className="w-8 h-8 text-indigo-500 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-wide">Cargar Después</span>
                      <span className="text-[8px] text-slate-400 font-mono mt-0.5">({requiredWidth}px)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* DESKTOP BROWSER CONTAINER FRAME */
          <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden flex flex-col h-auto">
            {/* Browser top window bar */}
            <div className="h-6 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-3 flex items-center justify-between shrink-0 select-none">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <span className="text-[8px] text-slate-400 font-mono max-w-[220px] truncate leading-none">https://qa.preview.crosscore</span>
              <div className="w-3"></div>
            </div>

            {/* Screen region */}
            <div className="w-full relative overflow-hidden h-auto min-h-[400px] bg-slate-50 flex flex-col">
              
              {/* SPLIT SCREEN VIEW */}
              {activePane === 'split' && (
                <div className="w-full flex items-stretch h-auto min-h-[400px]">
                  {/* Left Half: Antes */}
                  <div className="w-1/2 bg-[#E5E7EB] dark:bg-slate-850 overflow-hidden relative border-r border-[#9CA3AF]/40 flex flex-col justify-center items-center">
                    {hasAntes ? (
                      renderImageWithActions('antes', currentImages.antes!)
                    ) : (
                      <button
                        onClick={() => handleTriggerUpload('antes')}
                        className="w-full min-h-[400px] flex-1 flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-405 hover:text-[#1c1635] transition-all p-4 text-center cursor-pointer"
                        title="Cargar antes"
                      >
                        <Plus className="w-6 h-6 text-indigo-500 mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-wide leading-none">Antes</span>
                        <span className="text-[8px] text-slate-400 font-mono mt-0.5">({requiredWidth}px)</span>
                      </button>
                    )}
                  </div>

                  {/* Right Half: Después */}
                  <div className="w-1/2 bg-[#4B5563] dark:bg-slate-800 overflow-hidden relative flex flex-col justify-center items-center">
                    {hasDespues ? (
                      renderImageWithActions('despues', currentImages.despues!)
                    ) : (
                      <button
                        onClick={() => handleTriggerUpload('despues')}
                        className="w-full min-h-[400px] flex-1 flex flex-col items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-405 hover:text-slate-800 transition-all p-4 text-center cursor-pointer"
                        title="Cargar después"
                      >
                        <Plus className="w-6 h-6 text-indigo-500 mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-wide leading-none">Después</span>
                        <span className="text-[8px] text-slate-400 font-mono mt-0.5">({requiredWidth}px)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ONLY ANTES FULL VIEW */}
              {activePane === 'antes' && (
                <div className="w-full h-auto min-h-[400px] relative bg-slate-200 flex flex-col justify-center items-center">
                  {hasAntes ? (
                    renderImageWithActions('antes', currentImages.antes!)
                  ) : (
                    <button
                      onClick={() => handleTriggerUpload('antes')}
                      className="w-full min-h-[400px] flex-1 flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 p-6 transition-all cursor-pointer"
                    >
                      <Plus className="w-8 h-8 text-indigo-600 mb-1.5" />
                      <span className="text-xs font-black uppercase tracking-wider">Cargar Antes</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-1">({requiredWidth}px de ancho)</span>
                    </button>
                  )}
                </div>
              )}

              {/* ONLY DESPUES FULL VIEW */}
              {activePane === 'despues' && (
                <div className="w-full h-auto min-h-[400px] relative bg-slate-300 flex flex-col justify-center items-center">
                  {hasDespues ? (
                    renderImageWithActions('despues', currentImages.despues!)
                  ) : (
                    <button
                      onClick={() => handleTriggerUpload('despues')}
                      className="w-full min-h-[400px] flex-1 flex flex-col items-center justify-center bg-slate-205 hover:bg-slate-250 text-slate-500 p-6 transition-all cursor-pointer"
                    >
                      <Plus className="w-8 h-8 text-indigo-600 mb-1.5" />
                      <span className="text-xs font-black uppercase tracking-wider">Cargar Después</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-1">({requiredWidth}px de ancho)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Detail bottom metadata bar */}
      <div className="w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-left">
        <div>
          <h4 className="text-[11px] font-extrabold text-[#1c1635] dark:text-slate-300 font-sans tracking-wide">
            DETALLES DEL PANEL:
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans leading-relaxed">
            Resolución recomendada: <span className="font-mono font-bold">{resolution}</span> (requiere {requiredWidth}px de ancho) <br />
            Modo: <span className="capitalize font-bold">{mode}</span> | Dispositivo: <span className="capitalize font-bold">{device === 'mobile' ? 'Celular' : 'Escritorio'}</span>
          </p>
        </div>
      </div>

      {/* CHOOSE FILE/UPLOAD MODAL FOR WIDTH ENFORCEMENT */}
      {uploadTarget && createPortal(
        <div className="fixed inset-0 z-[100050] flex items-center justify-center p-4 bg-[#0f0c1e]/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-150 shadow-2xl p-6 sm:p-8 animate-fade-in text-[#1c1635]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-base font-black font-sans uppercase tracking-wider text-[#1c1635]">
                  Cargar Evidencia {uploadTarget === 'antes' ? 'Antes' : 'Después'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-sans">
                  Panel: <span className="font-bold uppercase text-[10px]">{device} {mode}</span> — Se validará resolución de ancho.
                </p>
              </div>
              <button 
                onClick={() => {
                  setUploadTarget(null);
                  setErrorMsg('');
                }}
                className="p-1 px-2 text-slate-400 hover:text-slate-700 hover:bg-slate-150 rounded-xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Validation constraints banner */}
            <div className="mb-6 p-4 rounded-2xl bg-indigo-50/75 border border-indigo-100 flex items-start gap-3">
              <span className="p-1.5 rounded-xl bg-white text-indigo-600 text-xs font-black shadow-sm">
                QA
              </span>
              <div>
                <p className="text-xs font-bold text-slate-850 font-sans">
                  Regla de Validación Requerida
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
                  Para consistencia de pantallas, su archivo **debe** tener un ancho exacto de <span className="font-bold text-indigo-600 font-mono">{requiredWidth}px</span>. De lo contrario, el sistema rechazará la carga.
                </p>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 overflow-hidden min-h-[180px]
                ${dragOver 
                  ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]' 
                  : selectedDataUrl
                    ? 'border-emerald-500 bg-emerald-50/20 hover:border-emerald-600'
                    : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50/50'
                }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />
              
              {selectedDataUrl ? (
                <div className="flex flex-col items-center gap-2 animate-fade-in w-full">
                  <div className="relative w-24 h-24 rounded-2xl border-2 border-emerald-500/30 overflow-hidden bg-slate-50 shadow-md flex items-center justify-center">
                    <img src={selectedDataUrl} className="w-full h-full object-contain" alt="Selected Preview" />
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-[9px] text-white bg-black/75 px-1.5 py-0.5 rounded font-black uppercase">Cambiar</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center justify-center gap-1 leading-none">
                      <span className="text-sm">✓</span> Archivo Válido Cargado
                    </p>
                    <p className="text-[11px] text-slate-700 font-mono mt-1 max-w-[280px] truncate mx-auto" title={selectedFileName}>
                      {selectedFileName}
                    </p>
                    <p className="text-[9px] text-slate-400 font-sans mt-0.5">
                      (Ancho exacto de {requiredWidth}px verificado)
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3.5 rounded-2xl bg-[#1c1635]/5 text-slate-600">
                    <Upload className="w-7 h-7 text-[#1c1635]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Arrastre la imagen aquí o haga click para buscar
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">
                      Formatos compatibles: PNG, JPG, JPEG, WEBP.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-1 px-3 py-1 rounded-xl border border-slate-300 hover:border-indigo-600 text-[10px] font-black uppercase text-slate-600 hover:text-indigo-600 bg-white transition cursor-pointer select-none"
                  >
                    Examinar Equipo
                  </button>
                </>
              )}
            </div>

            {/* Validating/Status messages */}
            {isValidating && (
              <p className="text-xs font-bold text-indigo-600 mt-4 text-center animate-pulse">
                Validando resolución del archivo cargado...
              </p>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold font-sans">
                {errorMsg}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setUploadTarget(null);
                  setErrorMsg('');
                }}
                className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedDataUrl}
                onClick={handleConfirmUpload}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow transition-all
                  ${selectedDataUrl 
                    ? 'bg-[#1c1635] text-white hover:bg-[#2d2454] cursor-pointer' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                  }`}
              >
                Seleccionar Archivo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FULL VIEW CLARIFICATION PREVIEW IMAGE LIGHTBOX PORTAL */}
      {previewImageUrl && createPortal(
        <div className="fixed inset-0 z-[100100] flex items-center justify-center p-4 bg-[#03001e]/90 backdrop-blur-lg">
          <div className="absolute inset-0" onClick={() => setPreviewImageUrl(null)} />
          <div className="relative max-w-[92vw] max-h-[92vh] z-10 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl animate-fade-in text-[#1c1635] dark:text-slate-100">
            <button 
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-50 px-3.5 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer shadow-lg"
            >
              Cerrar ✕
            </button>
            
            <div className="flex-1 overflow-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center min-h-[50vh] min-w-[50vw]">
              <img 
                src={previewImageUrl} 
                alt="Vista previa de evidencia" 
                className="max-w-full max-h-[75vh] object-contain rounded-xl select-none" 
              />
            </div>
            
            <div className="pt-3 flex items-center justify-between text-left shrink-0 font-sans">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">
                  VISTA DE ALTA CLARIDAD
                </h4>
                <p className="text-[11px] text-slate-850 dark:text-slate-300 mt-1.5 font-medium">
                  Resolución original verificada: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{requiredWidth}px</span> de ancho.
                </p>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Módulo REQ-{requirement.number}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
