import React, { useState, useEffect } from 'react';
import { auth, db, appId } from './firebase'; // Correct: same folder
import { getDirectLink } from './utils/helpers'; // Correct: same folder -> utils
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // YOUR PERMANENT MASTER KEY
  const SUPER_ADMIN_UID = "Vs9ReVqHYzXDcVQDSg53FdBDmGN2";
  const isSystemAdmin = user?.uid === SUPER_ADMIN_UID || profile?.role === 'admin';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        const savedProfile = localStorage.getItem('lba_profile');
        if (savedProfile) setProfile(JSON.parse(savedProfile));
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
    setProfile(userProfile);
    localStorage.setItem('lba_profile', JSON.stringify(userProfile));
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('lba_profile');
    setUser(null);
    setProfile(null);
  };

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#3E2723]"></div></div>;

  return (
    <>
      {user && profile ? (
        <Dashboard user={user} profile={profile} logout={handleLogout} isSystemAdmin={isSystemAdmin} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}
