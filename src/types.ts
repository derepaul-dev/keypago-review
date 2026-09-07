export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface MockupValue {
  title?: string;
  description?: string;
  otpLength?: number;
  otpValues?: string[];
  helperText?: string;
  hasTimer?: boolean;
  timerSeconds?: number;
  showError?: boolean;
  theme?: 'light' | 'dark';
}

export interface EvidencePhoto {
  id: string;
  name: string;
  dataUrl: string;
}

export interface PanelImage {
  antes?: string; // dataUrl / base64 of uploaded image
  despues?: string; // dataUrl / base64 of uploaded image
}

export interface Requirement {
  id: string;
  number: number;
  title: string;
  type: 'Requerimientos' | 'Pendientes';
  checklist: ChecklistItem[];
  
  // Custom mockups for "Antes" & "Después"
  mockupAntes: MockupValue;
  mockupDespues: MockupValue;

  // Custom user input values
  enabledPanels?: {
    mobileDark: boolean;
    mobileLight: boolean;
    desktopLight: boolean;
    desktopDark: boolean;
  };
  evidencePhotos?: EvidencePhoto[];
  panelImages?: {
    mobileDark?: PanelImage;
    mobileLight?: PanelImage;
    desktopLight?: PanelImage;
    desktopDark?: PanelImage;
  };
}
