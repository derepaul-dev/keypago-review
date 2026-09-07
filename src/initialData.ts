import { Requirement } from './types';

export const initialRequirements: Requirement[] = [
  {
    id: 'req-1',
    number: 1,
    title: 'Página CrossCore',
    type: 'Requerimientos',
    checklist: [
      { id: 'req-1-c1', text: 'Cambiar el título de "Bienvenido a CrossCore" por "Bienvenido a Hola".', completed: false },
      { id: 'req-1-c2', text: 'Cambiar la descripción y eliminarla.', completed: false }
    ],
    mockupAntes: {
      title: 'Bienvenido a CrossCore',
      description: 'Esta plataforma de núcleo cruzado permite gestionar sus validaciones, perfiles y estados de seguridad empresarial de manera dinámica.',
      theme: 'light'
    },
    mockupDespues: {
      title: 'Bienvenido a Hola',
      description: '', // Removed description as per requirement
      theme: 'light'
    }
  },
  {
    id: 'req-2',
    number: 2,
    title: 'OTP CrossCore',
    type: 'Requerimientos',
    checklist: [
      { id: 'req-2-c1', text: 'Incrementar la longitud del código de validación OTP de 4 a 6 dígitos.', completed: false },
      { id: 'req-2-c2', text: 'Incluir el temporizador dinámico de reenvío en la parte inferior.', completed: false }
    ],
    mockupAntes: {
      title: 'Validación OTP',
      otpLength: 4,
      otpValues: ['1', '2', '3', '4'],
      helperText: 'Ingrese el PIN de seguridad enviado.',
      hasTimer: false,
      theme: 'light'
    },
    mockupDespues: {
      title: 'Validación OTP',
      otpLength: 6,
      otpValues: ['9', '4', '8', '2', '0', '5'],
      helperText: '¿No recibiste el código? Reenviar en 1:59',
      hasTimer: true,
      timerSeconds: 119,
      theme: 'light'
    }
  },
  {
    id: 'req-3',
    number: 3,
    title: 'OTP',
    type: 'Requerimientos',
    checklist: [
      { id: 'req-3-c1', text: 'Implementar el estado de error de validación con alerta visual roja.', completed: false },
      { id: 'req-3-c2', text: 'Agregar botón interactivo "Verificar" con estado de carga animado.', completed: false }
    ],
    mockupAntes: {
      title: 'Verificación de Código',
      otpLength: 6,
      otpValues: ['1', '2', '3', '4', '', ''],
      helperText: 'Complete el código para continuar.',
      showError: false,
      theme: 'light'
    },
    mockupDespues: {
      title: 'Código Inválido',
      otpLength: 6,
      otpValues: ['1', '2', '3', '8', '9', '0'],
      helperText: 'Código inválido o expirado. Inténtelo nuevamente.',
      showError: true,
      theme: 'light'
    }
  },
  {
    id: 'req-4',
    number: 4,
    title: 'OTP',
    type: 'Requerimientos',
    checklist: [
      { id: 'req-4-c1', text: 'Asegurar que se muestre el teclado numérico de forma predeterminada.', completed: false },
      { id: 'req-4-c2', text: 'Agregar soporte para completar código de autenticación mediante sugerencia por SMS.', completed: false }
    ],
    mockupAntes: {
      title: 'Soporte Teclado',
      otpLength: 6,
      otpValues: ['', '', '', '', '', ''],
      helperText: 'Enfoque requerido.',
      theme: 'light'
    },
    mockupDespues: {
      title: 'Teclado Recomendado',
      otpLength: 6,
      otpValues: ['1', '', '', '', '', ''],
      helperText: 'Teclado activo en modo numérico (inputmode="numeric").',
      theme: 'light'
    }
  },
  {
    id: 'req-5',
    number: 4,
    title: 'OTP',
    type: 'Requerimientos',
    checklist: [
      { id: 'req-5-c1', text: 'Optimizar márgenes del formulario de OTP para pantallas ultra reducidas (hasta 320px).', completed: false }
    ],
    mockupAntes: {
      title: 'Vista Compacta',
      theme: 'light'
    },
    mockupDespues: {
      title: 'Formulario Compactado',
      theme: 'light'
    }
  }
];
