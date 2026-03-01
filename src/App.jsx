import React, { useState, useEffect } from 'react';
import { auth, db, appId } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const SUPER_ADMIN_UID = "Vs9ReVqHYzXDcVQDSg53FdBDmGN2";
  const isSystemAdmin = user?.uid === SUPER_ADMIN_UID || profile?.role === 'admin';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Sync profile from local storage if it exists
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
    // 1. Force update the user from Auth in case the listener is slow
    setUser(auth.currentUser);
    // 2. Set the profile
    setProfile(userProfile);
    // 3. Save for persistence
    localStorage.setItem('lba_profile', JSON.stringify(userProfile));
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('lba_profile');
    setUser(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#3E2723]"></div>
      </div>
    );
  }

  // THE KEY FIX: If we have a profile but user is still "linking", 
  // we check auth.currentUser directly to break the "hang".
  const isAuthenticated = (user || auth.currentUser) && profile;

  return (
    <>
      {isAuthenticated ? (
        <Dashboard 
          user={user || auth.currentUser} 
          profile={profile} 
          logout={handleLogout} 
          isSystemAdmin={isSystemAdmin} 
        />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}
