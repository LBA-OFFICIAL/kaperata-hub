import React, { createContext, useState, useEffect, useMemo } from 'react';
import { collection, doc, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db, appId } from '../firebase.js';

// Create the Context
export const HubContext = createContext();

export const HubProvider = ({ children, profile }) => {
  // 1. Core Data States
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [committeeApps, setCommitteeApps] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [polls, setPolls] = useState([]);
  const [seriesPosts, setSeriesPosts] = useState([]);
  
  // 2. App Settings & Tracking States
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true, maintenanceMode: false, renewalMode: false, allowedPayment: 'gcash_only', gcashNumber: '09063751402', dailyKey: '---' });
  const [secureKeys, setSecureKeys] = useState({ officerKey: '', headKey: '', commKey: '' });
  const [legacyContent, setLegacyContent] = useState({ body: "", achievements: [], imageSettings: { objectFit: 'cover', objectPosition: 'center' } });
  const [masterclassData, setMasterclassData] = useState({ certTemplate: '', moduleAttendees: { 1: [], 2: [], 3: [], 4: [], 5: [] }, moduleDetails: {} });
  
  // Notification Tracking
  const [lastVisited, setLastVisited] = useState(() => { 
    try { return JSON.parse(localStorage.getItem('lba_last_visited') || '{}'); } 
    catch { return {}; } 
  });

  const updateLastVisited = (page) => { 
    const newVisits = { ...lastVisited, [page]: new Date().toISOString() }; 
    setLastVisited(newVisits); 
    localStorage.setItem('lba_last_visited', JSON.stringify(newVisits)); 
  };

  // 3. 🛡️ THE 4-TIER ACCESS SYSTEM
  // Added your UID here as a secondary "Master Key" safety check
  const isSuperAdmin = useMemo(() => {
    return profile?.role === 'superadmin' || profile?.uid === "Vs9ReVqHYzXDcVQDSg53FdBDmGN2";
  }, [profile?.role, profile?.uid]);

  const isOfficer = useMemo(() => isSuperAdmin || ['OFFICER'].includes(String(profile?.positionCategory || '').toUpperCase()), [profile?.positionCategory, isSuperAdmin]);
  const isCommitteePlus = useMemo(() => isOfficer || ['COMMITTEE'].includes(String(profile?.positionCategory || '').toUpperCase()), [profile?.positionCategory, isOfficer]);
  const isExpired = useMemo(() => profile?.status === 'expired', [profile?.status]);

  // 4. Notifications Logic
  const notifications = useMemo(() => {
      const hasNew = (items, pageKey) => { 
        if (!items || items.length === 0) return false; 
        const lastVisit = lastVisited[pageKey]; 
        if (!lastVisit) return true; 
        return items.some(i => { 
          const d = i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt || 0); 
          return d > new Date(lastVisit); 
        }); 
      };
      
      let huntNotify = isSuperAdmin 
        ? committeeApps.some(a => a.status === 'pending') 
        : userApplications.some(a => { 
            const updated = a.statusUpdatedAt?.toDate ? a.statusUpdatedAt.toDate() : null; 
            const lastVisit = lastVisited['committee_hunt']; 
            if (!updated) return false; 
            return !lastVisit || updated > new Date(lastVisit); 
          });
          
      let regNotify = isOfficer ? hasNew((members || []).map(m => ({ createdAt: m?.joinedDate })), 'members') : false;
      
      return { 
        events: hasNew(events, 'events'), 
        announcements: hasNew(announcements, 'announcements'), 
        suggestions: hasNew(suggestions, 'suggestions'), 
        committee_hunt: huntNotify, 
        members: regNotify 
      };
  }, [events, announcements, suggestions, members, committeeApps, userApplications, lastVisited, isOfficer, isSuperAdmin]);

  // 5. Firebase Real-time Subscriptions
  useEffect(() => {
      if (!profile) return;
      
      // Basic Public Data Subscriptions
      const unsubEvents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'events'), (s) => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubAnn = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), (s) => setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubSug = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), (s) => { 
        const data = s.docs.map(d => ({ id: d.id, ...d.data() })); 
        data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)); 
        setSuggestions(data); 
      });
      const unsubPolls = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'polls'), orderBy('createdAt', 'desc')), (s) => setPolls(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubSeries = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'series_posts'), orderBy('createdAt', 'desc')), (s) => setSeriesPosts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      
      // Settings Subscriptions
      const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (s) => s.exists() && setHubSettings(s.data()));
      const unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (s) => s.exists() && setSecureKeys(s.data()));
      const unsubLegacy = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), (s) => { if(s.exists()) setLegacyContent(s.data()); });
      const unsubMC = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), (s) => { if(s.exists()) setMasterclassData(s.data()); });

      // Admin & Privileged Subscriptions
      let unsubReg = () => {}; 
      if (isOfficer) unsubReg = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), (s) => setMembers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      
      let unsubApps = () => {}; 
      if (isSuperAdmin) unsubApps = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), (s) => setCommitteeApps(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      
      const unsubUserApps = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), where('memberId', '==', profile.memberId)), (s) => setUserApplications(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      
      let unsubProjects = () => {}; 
      if (isCommitteePlus) unsubProjects = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), orderBy('createdAt', 'desc')), (s) => setProjects(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      
      let unsubTasks = () => {}; 
      if (isCommitteePlus) unsubTasks = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), (s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      
      // Updated log path to 'activity_logs' to ensure Terminal compatibility
      let unsubLogs = () => {}; 
      if (isSuperAdmin) unsubLogs = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), orderBy('timestamp', 'desc'), limit(50)), (s) => setLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      return () => { 
        unsubEvents(); unsubAnn(); unsubSug(); unsubPolls(); unsubSeries(); 
        unsubOps(); unsubKeys(); unsubLegacy(); unsubMC(); 
        unsubReg(); unsubApps(); unsubUserApps(); unsubProjects(); unsubTasks(); unsubLogs(); 
      };
  }, [profile, isSuperAdmin, isOfficer, isCommitteePlus]);

  const contextValue = {
    profile, members, events, announcements, suggestions, committeeApps, 
    userApplications, tasks, projects, logs, polls, seriesPosts, 
    hubSettings, secureKeys, legacyContent, masterclassData,
    isSuperAdmin, isOfficer, isCommitteePlus, isExpired,
    notifications, updateLastVisited
  };

  return (
    <HubContext.Provider value={contextValue}>
      {children}
    </HubContext.Provider>
  );
};
