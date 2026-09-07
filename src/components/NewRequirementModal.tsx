import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Trash2, 
  ClipboardList, 
  CheckCircle2
} from 'lucide-react';
import { Requirement, ChecklistItem, EvidencePhoto } from '../types';
import { compressImageFile } from '../lib/imageCompressor';

interface NewRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    specs: string[];
    enabledPanels: {
      mobileDark: boolean;
      mobileLight: boolean;
      desktopLight: boolean;
      desktopDark: boolean;
    };
    evidencePhotos: EvidencePhoto[];
  }) => void;
}

export default function NewRequirementModal({ isOpen, onClose, onSubmit }: NewRequirementModalProps) {
  const [title, setTitle] = useState('');
  const [specsText, setSpecsText] = useState('');
  
  // Implementation panels checks state (default to all active)
  const [enabledPanels, setEnabledPanels] = useState({
    mobileDark: true,
    mobileLight: true,
    desktopLight: true,
    desktopDark: true
  });

  // Evidence Photos state
  const [evidencePhotos, setEvidencePhotos] = useState<EvidencePhoto[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form validations based on specifications (excluding empty hyphen placeholders), title, and at least one panel enabled
  const isTitleValid = title.trim().length > 0;
  
  // Strip leading dashes and spaces to check if there is actual value
  const cleanSpecsArray = specsText
    .split('\n')
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(line => line.length > 0);
  const isSpecsValid = cleanSpecsArray.length > 0;

  const isAnyPanelEnabled = enabledPanels.mobileDark || enabledPanels.mobileLight || enabledPanels.desktopLight || enabledPanels.desktopDark;
  const isFormValid = isTitleValid && isSpecsValid && isAnyPanelEnabled;

  // Handle enter key to automatically prepend "- " for list formatting
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      
      // Insert a newline and hyphen list marker
      const newValue = value.substring(0, start) + '\n- ' + value.substring(end);
      setSpecsText(newValue);
      
      // Update cursor position to be right after '- '
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 3;
      }, 0);
    }
  };

  const handleFocus = () => {
    if (!specsText.trim()) {
      setSpecsText('- ');
    }
  };

  if (!isOpen) return null;

  // File handler for optional photo attachments
  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen.');
        return;
      }

      compressImageFile(file, 1024, 1024, 0.5)
        .then((compressedUrl) => {
          const newPhoto: EvidencePhoto = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            dataUrl: compressedUrl
          };
          setEvidencePhotos((prev) => [...prev, newPhoto]);
        })
        .catch((err) => {
          console.error('Error compressing file:', err);
          alert('Error al procesar la imagen.');
        });
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setEvidencePhotos((prev) => prev.filter((photo) => photo.id !== id));
  };

  // Submit and validate the inputs
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }

    // Parse specifications separated by enter, ensuring each has a leading hyphen with space
    const specsArray = specsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Strip hyphen to verify there is actual visual text
        const contentWithoutDash = line.replace(/^-\s*/, '').trim();
        return contentWithoutDash.length > 0;
      })
      .map(line => {
        // Guarantee formatted list item starting with a dash
        const cleanContent = line.replace(/^-\s*/, '').trim();
        return `- ${cleanContent}`;
      });

    if (specsArray.length === 0) {
      return;
    }

    // Submit data up
    onSubmit({
      title: title.trim(),
      specs: specsArray,
      enabledPanels,
      evidencePhotos
    });

    // Reset and exit
    setTitle('');
    setSpecsText('');
    setEnabledPanels({
      mobileDark: true,
      mobileLight: true,
      desktopLight: true,
      desktopDark: true
    });
    setEvidencePhotos([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark backdrop blur */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card content wrapper - Forced Bright Light Mode (White and Gray scales only) */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in text-slate-900">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-slate-100 text-slate-800">
              <ClipboardList className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-sans tracking-tight">
                Crear Nuevo Requerimiento
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Complete el formulario para subir especificaciones y evidencias de QA.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Area with generous vertical spacing */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-12 bg-white">
          
          {/* FIELD 1: "Lista de requerimientos" Input fields */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest bg-slate-100 text-slate-800 uppercase">
                CAMPO OBLIGATORIO 1
              </span>
              <span className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" /> Requerido
              </span>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Nombre o Título del Módulo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Formulario de Registro de Tarjeta"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-sans placeholder-slate-400 text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-medium"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    Especificaciones / Lista de cambios
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Formato de lista (escriba con un guión al principio)
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  placeholder={`Ej:\n- Reemplazar botón primario por gradiente corporativo.\n- Validar que la alerta de fondos insuficientes esté en rojo.\n- Ajustar el padding vertical de las tarjetas.`}
                  value={specsText}
                  onChange={(e) => setSpecsText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-sans placeholder-slate-400 text-slate-955 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* FIELD 2: "Paneles de implementación" checkboxes with increased top padding and separation */}
          <div className="space-y-6 pt-10 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest bg-slate-100 text-slate-800 uppercase">
                CAMPO OBLIGATORIO 2
              </span>
              <span className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" /> Requerido
              </span>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3.5">
                Paneles de implementación a habilitar para visualización
              </label>
              
              <div className="grid grid-cols-2 gap-3.5">
                {/* Mobile Dark */}
                <label 
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer select-none transition-all
                    ${enabledPanels.mobileDark 
                      ? 'bg-slate-50 border-slate-900 text-slate-950 shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={enabledPanels.mobileDark}
                    onChange={(e) => setEnabledPanels(prev => ({ ...prev, mobileDark: e.target.checked }))}
                    className="w-4.5 h-4.5 hover:border-slate-400 border-slate-300 rounded text-slate-900 focus:ring-slate-400 accent-slate-900"
                  />
                  <div>
                    <span className="text-xs font-extrabold block leading-none">Mobile Dark</span>
                    <span className="text-[10px] text-slate-450 mt-1 block font-medium">Ancho: 375px</span>
                  </div>
                </label>

                {/* Mobile Light */}
                <label 
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer select-none transition-all
                    ${enabledPanels.mobileLight 
                      ? 'bg-slate-50 border-slate-900 text-slate-950 shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={enabledPanels.mobileLight}
                    onChange={(e) => setEnabledPanels(prev => ({ ...prev, mobileLight: e.target.checked }))}
                    className="w-4.5 h-4.5 hover:border-slate-400 border-slate-300 rounded text-slate-900 focus:ring-slate-400 accent-slate-900"
                  />
                  <div>
                    <span className="text-xs font-extrabold block leading-none">Mobile Light</span>
                    <span className="text-[10px] text-slate-450 mt-1 block font-medium">Ancho: 375px</span>
                  </div>
                </label>

                {/* Desktop Light */}
                <label 
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer select-none transition-all
                    ${enabledPanels.desktopLight 
                      ? 'bg-slate-50 border-slate-900 text-slate-950 shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={enabledPanels.desktopLight}
                    onChange={(e) => setEnabledPanels(prev => ({ ...prev, desktopLight: e.target.checked }))}
                    className="w-4.5 h-4.5 hover:border-slate-400 border-slate-300 rounded text-slate-900 focus:ring-slate-400 accent-slate-900"
                  />
                  <div>
                    <span className="text-xs font-extrabold block leading-none">Desktop Light</span>
                    <span className="text-[10px] text-slate-450 mt-1 block font-medium">Ancho: 1921px</span>
                  </div>
                </label>

                {/* Desktop Dark */}
                <label 
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer select-none transition-all
                    ${enabledPanels.desktopDark 
                      ? 'bg-slate-50 border-slate-900 text-slate-950 shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={enabledPanels.desktopDark}
                    onChange={(e) => setEnabledPanels(prev => ({ ...prev, desktopDark: e.target.checked }))}
                    className="w-4.5 h-4.5 hover:border-slate-400 border-slate-300 rounded text-slate-900 focus:ring-slate-400 accent-slate-900"
                  />
                  <div>
                    <span className="text-xs font-extrabold block leading-none">Desktop Dark</span>
                    <span className="text-[10px] text-slate-455 mt-1 block font-medium">Ancho: 1921px</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* FIELD 3: "Adjuntar fotos o evidencia" (Optional) with increased top padding and separation */}
          <div className="space-y-6 pt-10 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest bg-slate-100 text-slate-800 uppercase">
                CAMPO OPCIONAL 3
              </span>
              <span className="text-[10px] text-slate-500 font-bold italic">
                Opcional
              </span>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Adjuntar fotos o evidencia visual de QA (Mockups / Capturas)
              </label>

              {/* Drag & drop Box */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 bg-slate-50/50
                  ${dragActive 
                    ? 'border-slate-800 bg-slate-100' 
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-305'
                  }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <UploadCloud className="w-9 h-9 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Suelte sus capturas aquí o <span className="text-slate-950 underline hover:text-black">busque archivos</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Formatos JPG, PNG, WEBP (hasta 5MB por foto)
                  </p>
                </div>
              </div>

              {/* Photo Galleries previews */}
              {evidencePhotos.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-black tracking-wider text-slate-500 block uppercase">
                    Fotos/Evidencias seleccionadas ({evidencePhotos.length}):
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {evidencePhotos.map((photo) => (
                      <div 
                        key={photo.id}
                        className="relative p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img 
                            src={photo.dataUrl} 
                            alt={photo.name} 
                            className="w-8 h-8 object-cover rounded-lg border border-slate-200/50 shrink-0" 
                          />
                          <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[140px]">
                            {photo.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(photo.id);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                          title="Eliminar captura"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </form>

        {/* Footer actions bar */}
        <div className="p-6 border-t border-slate-150 bg-slate-50/50 flex gap-3 justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!isFormValid}
            onClick={handleSubmit}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all
              ${isFormValid 
                ? 'bg-slate-900 hover:bg-black text-white hover:scale-[1.01] active:scale-[0.99] cursor-pointer' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 pointer-events-none'
              }`}
          >
            <span>Crear Requerimiento</span>
          </button>
        </div>

      </div>
    </div>
  );
}
