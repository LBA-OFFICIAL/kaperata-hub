import React, { createContext, useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db, auth } from './firebase'; // Assuming you extract Firebase config here

export const HubContext = createContext();

export const HubProvider = ({ children, profile, appId }) => {
  // 1. Move your global states here
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [hubSettings, setHubSettings] = useState({});

  // 2. Move your massive useEffect data fetchers here
  useEffect(() => {
      if (!profile) return;
      const unsubEvents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'events'), 
          (s) => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() })))
      );
      // ... (bring over the other listeners like members, tasks, settings)
      return () => { unsubEvents(); /* ... */ };
  }, [profile, appId]);

  // 3. Move your useMemo calculations here (like teamStructure, financialStats)
  const isSuperAdmin = useMemo(() => profile?.role === 'superadmin', [profile?.role]);

  return (
    <HubContext.Provider value={{ profile, members, events, tasks, hubSettings, isSuperAdmin }}>
      {children}
    </HubContext.Provider>
  );
};
