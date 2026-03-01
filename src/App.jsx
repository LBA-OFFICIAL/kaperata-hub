import React, { useState, useEffect } from 'react';
import { auth } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const SUPER_ADMIN_UID = "Vs9ReVqHYzXDcVQDSg53FdBDmGN2";

  // Effect to handle initial load and Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const savedProfile = localStorage.getItem('lba_profile');
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }
      } else {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('lba_profile');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userProfile) => {
    // 1. Immediate save to device
    localStorage.setItem('lba_profile', JSON.stringify(userProfile));
    // 2. Immediate state update
    setProfile(userProfile);
    setUser(auth.currentUser);
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('lba_profile');
    setUser(null);
    setProfile(null);
  };

  // --- THE STRENGTHENED BRIDGE ---
  // We check LocalStorage directly as a fallback to prevent the "Login Screen Hang"
  const activeProfile = profile || JSON.parse(localStorage.getItem('lba_profile'));
  const activeUser = user || auth.currentUser;
  
  const isAuthenticated = !!(activeUser && activeProfile);
  const isSystemAdmin = activeUser?.uid === SUPER_ADMIN_UID || activeProfile?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#3E2723]"></div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <Dashboard 
          user={activeUser} 
          profile={activeProfile} 
          logout={handleLogout} 
          isSystemAdmin={isSystemAdmin} 
        />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}
