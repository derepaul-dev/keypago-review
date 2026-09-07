import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const PREDEFINED_USERS = [
  {
    email: 'admin.keypago@gmail.com',
    password: '4,X%~1DwMiOy,fa;z\\k2Kr5n`@+uN}s)-RA',
    role: 'Admin'
  },
  {
    email: 'solicitante.keypago@gmail.com',
    password: '4pvN21.kj0P0lsl#^C]7yYP5-?QE£S~aM|Dn',
    role: 'Solicitante'
  },
  {
    email: 'desarrollador.keypago@gmail.com',
    password: `.'%i9V7p':Mt4CW5gZ\\Lmb?jKeQ8%8=w3!u(`,
    role: 'Desarrollador'
  }
];

interface LoginModalProps {
  onLoginSuccess: () => void;
  onLoginLocal?: (email: string, role: 'Admin' | 'Solicitante' | 'Desarrollador') => void;
}

export default function LoginModal({ onLoginSuccess, onLoginLocal }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocalFallback, setShowLocalFallback] = useState(false);

  // Validations:
  // Usuario: must be a valid email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isUsernameValid = emailRegex.test(username);

  // Contraseña: minimum 6 characters
  const isPasswordValid = password.length >= 6;

  const isValidForm = isUsernameValid && isPasswordValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidForm) return;

    setIsSubmitting(true);
    setErrorMsg('');

    const trimmedEmail = username.trim().toLowerCase();
    const matchedUser = PREDEFINED_USERS.find(
      (u) => u.email.toLowerCase() === trimmedEmail
    );

    if (!matchedUser) {
      setErrorMsg('Usuario no autorizado. Requerido usar cuenta predefinida de KeyPago.');
      setIsSubmitting(false);
      return;
    }

    if (password !== matchedUser.password) {
      setErrorMsg('Contraseña incorrecta para esta cuenta.');
      setIsSubmitting(false);
      return;
    }

    try {
      let userCredential;
      try {
        // Try standard sign in
        userCredential = await signInWithEmailAndPassword(auth, matchedUser.email, matchedUser.password);
      } catch (signInErr: any) {
        // If account yet to be created, create in real-time
        if (
          signInErr.code === 'auth/user-not-found' ||
          signInErr.code === 'auth/invalid-credential' ||
          signInErr.code === 'auth/cannot-find-user' ||
          String(signInErr.message).includes('INVALID_LOGIN_CREDENTIALS') ||
          String(signInErr.message).includes('user-not-found')
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, matchedUser.email, matchedUser.password);
          } catch (signUpErr: any) {
            throw signUpErr;
          }
        } else {
          throw signInErr;
        }
      }

      const user = userCredential.user;

      // Always write/sync profile to ensure doc is there
      await setDoc(doc(db, 'profiles', user.uid), {
        email: matchedUser.email,
        role: matchedUser.role
      });

      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error details:', err);
      setShowLocalFallback(true);
      if (err.code === 'auth/wrong-password') {
        setErrorMsg('Contraseña incorrecta.');
        setShowLocalFallback(false);
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMsg('Error de conexión. Verifique su acceso a internet.');
        setShowLocalFallback(false);
      } else if (
        err.code === 'auth/operation-not-allowed' ||
        String(err.message).includes('operation-not-allowed')
      ) {
        setErrorMsg('Error (auth/operation-not-allowed): El proveedor de Correo/Contraseña está inactivo en Firebase Console.');
      } else if (
        err.code === 'auth/configuration-not-found' ||
        String(err.message).includes('configuration-not-found') ||
        String(err.message).includes('PROJECT_NOT_FOUND')
      ) {
        setErrorMsg('Error: Habilite el proveedor de Email/Password en la consola de Firebase.');
      } else {
        setErrorMsg(`Error de autenticación: ${err.message || err}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocalLoginClick = () => {
    setErrorMsg('');
    const trimmedEmail = username.trim().toLowerCase();
    const matchedUser = PREDEFINED_USERS.find(
      (u) => u.email.toLowerCase() === trimmedEmail
    );

    if (!matchedUser) {
      setErrorMsg('Usuario no autorizado. Requerido usar cuenta predefinida de KeyPago.');
      return;
    }

    if (password !== matchedUser.password) {
      setErrorMsg('Contraseña incorrecta para esta cuenta.');
      return;
    }

    if (onLoginLocal) {
      onLoginLocal(matchedUser.email, matchedUser.role as any);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#0f0c1e]/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-8 sm:p-10 animate-fade-in flex flex-col justify-between">
        <div className="space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden shadow-md flex items-center justify-center">
              <svg viewBox="0 0 100 110" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Rounded square background of exact lime color */}
                <rect width="100" height="110" rx="22" fill="#d4ff00" />
                {/* Left Shape of the K in dark indigo */}
                <path d="M14.5 25 L34 40 V70 L14.5 85 Z" fill="#1c1635" />
                {/* Right Shape of the K in dark indigo */}
                <path d="M42.5 15 H85 L55 55 L85 95 H42.5 Z" fill="#1c1635" />
              </svg>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-[#1c1635] font-sans">
                REVIEW
              </h1>
              <p className="text-xs text-slate-500 font-sans tracking-wide">
                Plataforma de Control de Calidad y Requerimientos
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Input Usuario */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Usuario (Email de KeyPago)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej: admin.keypago@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-sans placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1c1635]/15 focus:border-[#1c1635] transition-all font-medium"
                />
              </div>
              {username && !isUsernameValid && (
                <p className="text-[10px] text-rose-500 font-bold font-sans">
                  * Ingrese el correo electrónico predefinido.
                </p>
              )}
            </div>

            {/* Input Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese la contraseña otorgada"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-sans placeholder-slate-400 text-slate-933 focus:outline-none focus:ring-2 focus:ring-[#1c1635]/15 focus:border-[#1c1635] transition-all font-medium"
                />
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && !isPasswordValid && (
                <p className="text-[10px] text-rose-500 font-bold font-sans">
                  * Contraseña inválida.
                </p>
              )}
            </div>

            {/* Error view */}
            {errorMsg && (
              <p className="text-xs text-rose-500 text-center font-bold">
                {errorMsg}
              </p>
            )}

            {/* Button INICIAR SESIÓN */}
            <button
              type="submit"
              disabled={!isValidForm || isSubmitting}
              className={`w-full py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest text-center shadow-md transition-all duration-200 flex items-center justify-center gap-2
                ${isValidForm && !isSubmitting
                  ? 'bg-[#1c1635] text-[#d4ff00] hover:bg-[#28204d] hover:scale-[1.01] active:scale-[0.99] cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
            >
              {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>

            {showLocalFallback && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2.5">
                <p className="text-[11px] font-sans font-medium leading-relaxed text-left">
                  ⚠️ <strong>Método Firebase inactivo:</strong> No se pudo autenticar vía Firebase porque el proveedor de Email/Password no está habilitado en tu consola, o el proyecto Firebase no está inicializado.
                </p>
                <button
                  type="button"
                  onClick={handleLocalLoginClick}
                  className="w-full py-2.5 rounded-xl bg-amber-600 text-white hover:bg-[#1a1532] border border-amber-500 font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                  Continuar en Modo Local Offline
                </button>
                <p className="text-[9px] text-amber-700 font-sans leading-normal text-center select-none">
                  (El Modo Local guardará sus requerimientos y estados de manera segura en el navegador).
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Info footer banner */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span className="font-sans font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            Acceso Autorizado SSL
          </span>
          <span className="font-sans">v1.4.0</span>
        </div>
      </div>
    </div>
  );
}
