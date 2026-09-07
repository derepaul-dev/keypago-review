import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Sparkles, 
  CheckCircle, 
  ShieldCheck, 
  Percent
} from 'lucide-react';
import { initialRequirements } from './initialData';
import { Requirement, EvidencePhoto } from './types';
import Sidebar from './components/Sidebar';
import ActiveModule from './components/ActiveModule';
import FooterPagination from './components/FooterPagination';
import NewRequirementModal from './components/NewRequirementModal';
import LoginModal from './components/LoginModal';

// Firebase imports
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';

export default function App() {
  const [isLocalMode, setIsLocalMode] = useState<boolean>(() => {
    return localStorage.getItem('review_auth_local_mode') === 'true';
  });
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<'Admin' | 'Solicitante' | 'Desarrollador' | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [dbLoading, setDbLoading] = useState<boolean>(true);

  // Synchronized requirements list from Firestore
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  // Active module selection state
  const [activeId, setActiveId] = useState<string>('');

  // Current tab filter in SideBar: 'Pendientes' | 'Desarrollo' | 'Completos'
  const [filterTab, setFilterTab] = useState<'Pendientes' | 'Desarrollo' | 'Completos'>('Pendientes');

  // Mobile menu control toggles
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Listen to Authentication State Changes
  useEffect(() => {
    if (isLocalMode) {
      const savedUser = localStorage.getItem('review_local_user');
      const savedRole = localStorage.getItem('review_local_role');
      if (savedUser && savedRole) {
        setUser({
          email: savedUser,
          uid: 'local-' + savedRole.toLowerCase(),
          emailVerified: true,
        } as any);
        setUserRole(savedRole as any);
        setAuthLoading(false);
      } else {
        setIsLocalMode(false);
        setAuthLoading(false);
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Fetch user profile document containing their role
          const profileRef = doc(db, 'profiles', firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            setUserRole(profileSnap.data().role as 'Admin' | 'Solicitante' | 'Desarrollador');
          } else {
            // Fallback default role just in case
            setUserRole('Solicitante');
          }
        } catch (e) {
          console.error('Error fetching profile:', e);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isLocalMode]);

  // 2. Listen & Synchronize Requirements from Firestore in Real-Time
  useEffect(() => {
    if (isLocalMode) {
      setDbLoading(true);
      const isInitialized = localStorage.getItem('review_local_requirements_initialized') === 'true';
      const localData = localStorage.getItem('review_local_requirements');
      
      if (isInitialized) {
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            setRequirements(parsed);
            
            if (parsed.length > 0) {
              setActiveId((prev) => {
                if (prev && parsed.some((r: any) => r.id === prev)) {
                  return prev;
                }
                return parsed[0].id;
              });
            }
          } catch (e) {
            console.error('Error parsing local requirements:', e);
            setRequirements([]);
          }
        } else {
          setRequirements([]);
        }
      } else {
        // First run initialization
        setRequirements(initialRequirements);
        localStorage.setItem('review_local_requirements', JSON.stringify(initialRequirements));
        localStorage.setItem('review_local_requirements_initialized', 'true');
        if (initialRequirements.length > 0) setActiveId(initialRequirements[0].id);
      }
      setDbLoading(false);
      return;
    }

    if (!user) {
      setDbLoading(false);
      return;
    }

    setDbLoading(true);
    const requirementsQuery = query(collection(db, 'requirements'), orderBy('number', 'asc'));

    const unsubscribe = onSnapshot(
      requirementsQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          // Check if we have already seeded in the past
          try {
            const seedRef = doc(db, 'requirements', '_seeding');
            const seedSnap = await getDoc(seedRef);
            if (!seedSnap.exists()) {
              console.log('Seeding initial requirements to Firestore Database...');
              // Create the seeding marker
              await setDoc(seedRef, { seeded: true });
              for (const req of initialRequirements) {
                await setDoc(doc(db, 'requirements', req.id), req);
              }
              setRequirements(initialRequirements);
            } else {
              console.log('Database empty by user intent, not reseeding.');
              setRequirements([]);
            }
          } catch (err) {
            console.error('Seeding error or permission issue:', err);
            setRequirements([]);
          }
        } else {
          const loaded: Requirement[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            if (d.id !== '_seeding' && data.number !== undefined) {
              loaded.push(data as Requirement);
            }
          });
          setRequirements(loaded);

          // Ensure _seeding marker exists so that future complete deletions are robustly designated as user intent
          if (loaded.length > 0 && userRole && (userRole === 'Admin' || userRole === 'Solicitante')) {
            const seedRef = doc(db, 'requirements', '_seeding');
            getDoc(seedRef).then((snap) => {
              if (!snap.exists()) {
                setDoc(seedRef, { seeded: true }).catch(console.error);
              }
            }).catch(console.error);
          }
          
          // Auto select first entry on initial load if no selection is set
          if (loaded.length > 0) {
            setActiveId((prev) => {
              if (prev && loaded.some(r => r.id === prev)) {
                return prev;
              }
              return loaded[0].id;
            });
          }
        }
        setDbLoading(false);
      },
      (error) => {
        console.error('Snapshot error:', error);
        handleFirestoreError(error, OperationType.LIST, 'requirements');
        setDbLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isLocalMode]);

  // Find the exact active requirement object
  const activeRequirement = requirements.find((req) => req.id === activeId) || requirements[0];

  // Calculate current requirement indices for Footer Navigation
  const activeIndex = requirements.findIndex((req) => req.id === activeId);
  const previousRequirement = activeIndex > 0 ? requirements[activeIndex - 1] : null;
  const nextRequirement = activeIndex >= 0 && activeIndex < requirements.length - 1 ? requirements[activeIndex + 1] : null;

  // Handle saving details modifications securely over Firestore
  const handleUpdateRequirement = async (updated: Requirement) => {
    if (isLocalMode) {
      const original = requirements.find(r => r.id === updated.id);
      if (original) {
        let restrictedUpdate = { ...updated };
        if (userRole === 'Desarrollador') {
          // Enforce that only "panelImages" is being changed
          restrictedUpdate = {
            ...original,
            panelImages: updated.panelImages
          };
        }
        const updatedReqs = requirements.map(r => r.id === updated.id ? restrictedUpdate : r);
        setRequirements(updatedReqs);
        localStorage.setItem('review_local_requirements', JSON.stringify(updatedReqs));
      }
      return;
    }

    // Developers can only modify "panelImages"
    if (userRole === 'Desarrollador') {
      const original = requirements.find(r => r.id === updated.id);
      if (original) {
        // Enforce that only "panelImages" is being changed
        const restrictedUpdate: Requirement = {
          ...original,
          panelImages: updated.panelImages
        };
        try {
          await setDoc(doc(db, 'requirements', updated.id), restrictedUpdate);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `requirements/${updated.id}`);
        }
        return;
      }
    }

    // Admins and Solicitantes can update everything
    try {
      await setDoc(doc(db, 'requirements', updated.id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `requirements/${updated.id}`);
    }
  };

  // Open creation modal (Admin & Solicitante only)
  const handleAddRequirement = () => {
    if (userRole === 'Desarrollador') {
      alert('Los Desarrolladores no tienen permisos para crear Requerimientos.');
      return;
    }
    setIsModalOpen(true);
  };

  // Create customized requirement from modal fields
  const handleCreateRequirement = async (data: {
    title: string;
    specs: string[];
    enabledPanels: {
      mobileDark: boolean;
      mobileLight: boolean;
      desktopLight: boolean;
      desktopDark: boolean;
    };
    evidencePhotos: EvidencePhoto[];
  }) => {
    if (userRole === 'Desarrollador') {
      alert('Los Desarrolladores no tienen permisos para crear Requerimientos.');
      return;
    }

    const nextNum = requirements.length > 0 ? Math.max(...requirements.map(r => r.number)) + 1 : 1;
    const newId = `req-${Date.now()}`;

    // Map user specs array to checklist objects
    const checklist = data.specs.map((text, idx) => ({
      id: `check-${Date.now()}-${idx}`,
      text,
      completed: false
    }));

    const newReq: Requirement = {
      id: newId,
      number: nextNum,
      title: data.title,
      type: 'Requerimientos',
      checklist,
      mockupAntes: {
        title: data.title,
        theme: 'light'
      },
      mockupDespues: {
        title: data.title,
        theme: 'light'
      },
      enabledPanels: data.enabledPanels,
      evidencePhotos: data.evidencePhotos
    };

    if (isLocalMode) {
      const updatedReqs = [...requirements, newReq];
      setRequirements(updatedReqs);
      setActiveId(newId);
      localStorage.setItem('review_local_requirements', JSON.stringify(updatedReqs));
      return;
    }

    try {
      await setDoc(doc(db, 'requirements', newId), newReq);
      setActiveId(newId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `requirements/${newId}`);
    }
  };

  // Secure deletion of a requirement card
  const handleDeleteRequirement = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card selection
    
    if (userRole === 'Desarrollador') {
      alert('Los Desarrolladores no tienen permisos para borrar Requerimientos.');
      return;
    }

    if (isLocalMode) {
      const remaining = requirements.filter((req) => req.id !== id);
      setRequirements(remaining);
      localStorage.setItem('review_local_requirements', JSON.stringify(remaining));

      const deletedIndex = requirements.findIndex((req) => req.id === id);
      const nextActiveIndex = deletedIndex === 0 ? 0 : deletedIndex - 1;
      
      if (remaining[nextActiveIndex]) {
        setActiveId(remaining[nextActiveIndex].id);
      } else if (remaining[0]) {
        setActiveId(remaining[0].id);
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'requirements', id));
      
      // Select another requirement as active
      const deletedIndex = requirements.findIndex((req) => req.id === id);
      const remaining = requirements.filter((req) => req.id !== id);
      const nextActiveIndex = deletedIndex === 0 ? 0 : deletedIndex - 1;
      
      if (remaining[nextActiveIndex]) {
        setActiveId(remaining[nextActiveIndex].id);
      } else if (remaining[0]) {
        setActiveId(remaining[0].id);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `requirements/${id}`);
    }
  };

  // Navigation callbacks
  const handleNavigate = (id: string) => {
    setActiveId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate high-level progress stats
  const totalTasks = requirements.reduce((acc, r) => acc + r.checklist.length, 0);
  const completedTasks = requirements.reduce((acc, r) => acc + r.checklist.filter(c => c.completed).length, 0);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Render Login Modal if not logged in
  if (!user || !userRole) {
    if (authLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#1c1635] text-white">
          <Sparkles className="w-12 h-12 text-[#d4ff00] animate-pulse mb-4" />
          <p className="text-sm font-black tracking-widest uppercase text-[#d4ff00]">Cargando Control de Calidad...</p>
        </div>
      );
    }
    return (
      <LoginModal 
        onLoginSuccess={() => {}} 
        onLoginLocal={(email, role) => {
          localStorage.setItem('review_auth_local_mode', 'true');
          localStorage.setItem('review_local_user', email);
          localStorage.setItem('review_local_role', role);
          
          setUser({
            email,
            uid: 'local-' + role.toLowerCase(),
            emailVerified: true,
          } as any);
          setUserRole(role);
          setIsLocalMode(true);
        }}
      />
    );
  }

  // Render Loading transition screen for database
  if (dbLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#1c1635] text-white">
        <Sparkles className="w-12 h-12 text-[#d4ff00] animate-pulse mb-4" />
        <p className="text-sm font-black tracking-widest uppercase text-[#d4ff00]">Sincronizando Base de Datos Firestore...</p>
        <p className="text-xs text-slate-400 mt-2 font-sans font-medium">Cargando con su perfil de {userRole} autorizado...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      
      {/* 1. SIDEBAR NAVIGATION COMPONENT */}
      <Sidebar
        requirements={requirements}
        activeId={activeId}
        onSelect={handleNavigate}
        filterTab={filterTab}
        setFilterTab={setFilterTab}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        onAddRequirement={handleAddRequirement}
        onDeleteRequirement={handleDeleteRequirement}
        userEmail={user.email || ''}
        userRole={userRole}
        onLogout={async () => {
          if (isLocalMode) {
            localStorage.removeItem('review_auth_local_mode');
            localStorage.removeItem('review_local_user');
            localStorage.removeItem('review_local_role');
            setIsLocalMode(false);
            setUser(null);
            setUserRole(null);
            return;
          }
          try {
            await signOut(auth);
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {/* 2. MAIN HUB CONTENT CONTAINER */}
      <div className="flex-1 lg:pl-80 flex flex-col min-h-screen relative">
        
        {/* MOBILE TOP TITLEBAR */}
        <header className="lg:hidden sticky top-0 left-0 right-0 h-16 bg-[#1a1532] text-white flex items-center justify-between px-5 z-40 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpenMobile(true)}
              className="p-1.5 -ml-1 rounded-lg text-[#d4ff00] hover:bg-[#2d2454] transition-colors focus:outline-none"
              title="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-[#d4ff00] flex items-center justify-center font-bold text-[#1c1635] text-[10px]">
                CC
              </span>
              <span className="text-xs font-black tracking-widest text-[#d4ff00]">
                QA HUB
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#2d2454] text-[11px] font-bold">
            <Percent className="w-3 h-3 text-[#d4ff00]" />
            <span>{completionRate}% Hecho</span>
          </div>
        </header>

        {/* COMPREHENSIVE MAIN PANEL WINDOW */}
        <main className="flex-1 p-5 sm:p-8 lg:p-12 max-w-6xl w-full mx-auto animate-fade-in">
          
          {/* TOP WELCOME & SYSTEM WIDGETS */}
          <div className={`mb-8 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 border ${
            isLocalMode 
              ? 'bg-amber-50/50 border-amber-200/50' 
              : 'bg-indigo-50/50 border-indigo-100/40'
          }`}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-white shadow-sm border border-indigo-50 flex items-center justify-center text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <p className={`text-xs font-extrabold uppercase tracking-widest font-sans ${isLocalMode ? 'text-amber-800' : 'text-[#1c1635]'}`}>
                  {isLocalMode ? 'WORKSPACE LOCAL (MODO OFFLINE)' : 'WORKSPACE PERSISTENTE (CONEXIÓN FIREBASE)'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">
                  Autenticado como: <span className="font-bold">{user.email}</span> ({userRole}) • {isLocalMode ? 'Guardando en Almacenamiento Local.' : 'Conexión Firestore activa.'}
                </p>
              </div>
            </div>

            {/* Micro stats indicators */}
            <div className="flex items-center gap-4 text-xs font-sans font-medium text-slate-600">
              <div className="text-right">
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-extrabold">Tareas completadas</span>
                <span className="font-bold text-[#1c1635]">{completedTasks}</span> de <span className="font-bold">{totalTasks}</span>
              </div>
              <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden relative shadow-inner">
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-emerald-500 transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* ACTIVE MODULE VIEW WRAPPER */}
          {activeRequirement ? (
            <ActiveModule
              requirement={activeRequirement}
              onUpdateRequirement={handleUpdateRequirement}
              userRole={userRole}
            />
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <CheckCircle className="w-16 h-16 text-indigo-600 mx-auto opacity-70 mb-4 animate-bounce" />
              <h2 className="text-xl font-bold text-slate-800">
                ¡Todos los pendientes completados!
              </h2>
              <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                No hay más requerimientos en revisión. Puedes agregar uno utilizando el botón "Nuevo" arriba.
              </p>
            </div>
          )}
        </main>

        {/* 3. POSITION FIXED FOOTER PAGINATION */}
        <FooterPagination
          previousRequirement={previousRequirement}
          nextRequirement={nextRequirement}
          onNavigate={handleNavigate}
        />
      </div>

      {/* 4. MODAL TO DEFINE AND CREATE CUSTOM REQUIREMENT */}
      <NewRequirementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRequirement}
      />
    </div>
  );
}
