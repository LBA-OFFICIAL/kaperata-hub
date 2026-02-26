import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lba_profile'));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        localStorage.removeItem('lba_profile');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userProfile) => {
    setProfile(userProfile);
    localStorage.setItem('lba_profile', JSON.stringify(userProfile));
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    localStorage.removeItem('lba_profile');
  };

  // If no profile, show Login. Otherwise, show the Hub.
  return !profile ? (
    <Login onLoginSuccess={handleLoginSuccess} />
  ) : (
    <Dashboard user={user} profile={profile} setProfile={setProfile} logout={logout} />
  );
}
