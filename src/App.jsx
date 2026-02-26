import React, { useState, useEffect } from 'react';
import { auth, db, appId } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Login from './components/Login.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        // Try to get profile from localStorage first for speed
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

  return (
    <>
      {user && profile ? (
        <Dashboard user={user} profile={profile} setProfile={setProfile} logout={handleLogout} />
      ) : (
        <Login onLoginSuccess={(p) => setProfile(p)} />
      )}
    </>
  );
}
