import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, signOut
} from 'firebase/auth';
import { 
  getFirestore, collection, query, where, onSnapshot, doc, setDoc, 
  updateDoc, addDoc, serverTimestamp, getDocs, limit, deleteDoc, 
  orderBy, writeBatch, arrayUnion, arrayRemove, runTransaction
} from 'firebase/firestore'; 
import { 
  Users, Calendar, Award, Bell, LogOut, Home, Plus, 
  ShieldCheck, Menu, X, Sparkles, Loader2, Coffee, Star, 
  Download, Lock, ShieldAlert, BadgeCheck, MapPin, Pen, Send, 
  Megaphone, Ticket, MessageSquare, 
  TrendingUp, Mail, Trash2, Search, ArrowUpDown, CheckCircle, 
  CheckCircle2, Settings2, ChevronLeft, ChevronRight, Facebook, Instagram, 
  LifeBuoy, FileUp, Banknote, AlertTriangle, AlertCircle,
  History, Cake, Camera, User, Trophy, Clock, 
  Briefcase, ClipboardCheck, ChevronDown, ChevronUp, 
  CheckSquare, Music, Database, ExternalLink, Hand, Image as ImageIcon, 
  Link as LinkIcon, RefreshCcw, GraduationCap, PenTool, BookOpen, 
  AlertOctagon, Power, FileText, FileBarChart, MoreVertical, CreditCard,
  ClipboardList, CheckSquare2, ExternalLink as Link2, MessageCircle,
  BarChart2, Smile, FolderKanban, UserCheck, Layers, Info, Link
} from 'lucide-react';

// --- Configuration Helper ---
let firebaseConfig;
if (typeof __firebase_config !== 'undefined') {
  try {
    firebaseConfig = JSON.parse(__firebase_config);
  } catch (e) {
    console.error("Error parsing firebase config", e);
    firebaseConfig = {};
  }
} else {
  firebaseConfig = {
      apiKey: "AIzaSyByPoN0xDIfomiNHLQh2q4OS0tvhY9a_5w",
      authDomain: "kaperata-hub.firebaseapp.com",
      projectId: "kaperata-hub",
      storageBucket: "kaperata-hub.firebasestorage.app",
      messagingSenderId: "760060001621",
      appId: "1:760060001621:web:1d0439eff2fb2d2e1143dc",
      measurementId: "G-D2YNL39DSF"
  };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Sanitize appId to ensure it is a valid Firestore document ID
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'lba-portal-v13';
const appId = rawAppId.replace(/[\/.]/g, '_'); 

// --- Global Constants & Assets ---
const ORG_LOGO_URL = "https://lh3.googleusercontent.com/d/1aYqARgJoEpHjqWJONprViSsEUAYHNqUL";
const APP_ICON_URL = "https://lh3.googleusercontent.com/d/1_MAy5RIPYHLuof-DoKcMPvN_dIM3fIwY";

const OFFICER_TITLES = ["President", "Vice President", "Secretary", "Assistant Secretary", "Treasurer", "Auditor", "Business Manager", "P.R.O.", "Overall Committee Head"];
const COMMITTEE_TITLES = ["Committee Head", "Committee Member"];
const PROGRAMS = ["CAKO", "CLOCA", "CLOHS", "HRA", "ITM/ITTM"];
const POSITION_CATEGORIES = ["Member", "Officer", "Committee", "Execomm", "Org Adviser", "Blacklisted"];
const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
  { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
  { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" }
];

const DEFAULT_MASTERCLASS_MODULES = [
    { id: 1, title: "Foundation: Coffee History & Knowledge", short: "Basics" },
    { id: 2, title: "Hardware: Equipment Familiarization", short: "Equipment" },
    { id: 3, title: "Brewing: Manual Methods", short: "Brewing" },
    { id: 4, title: "Barista: Espresso Machine", short: "Espresso" },
    { id: 5, title: "Mastery: Signature Beverage", short: "Sig Bev" }
];

const COMMITTEES_INFO = [
  { 
    id: "Arts", 
    title: "Arts & Design", 
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80",
    description: "The creative soul of LBA. We handle all visual assets, stage decorations, and artistic direction for major events.",
    roles: ["Create event pubmats & posters", "Design merchandise & t-shirts", "Execute venue styling & decoration"]
  },
  { 
    id: "PR", 
    title: "Public Relations", 
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80", 
    description: "The voice of the association. We manage social media presence, student engagement, and external communications.",
    roles: ["Manage social media pages", "Write engaging captions & copies", "Coordinate with external partners"]
  },
  { 
    id: "Events", 
    title: "Events & Logistics", 
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    description: "The backbone of operations. We plan flows, manage logistics, and ensure every LBA gathering runs smoothly.",
    roles: ["Plan detailed event programs", "Coordinate with venues & suppliers", "Manage on-the-day flow & crowd control"]
  },
  {
      id: "Secretariat",
      title: "Secretariat",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80",
      description: "Keepers of the records. We handle registration, attendance, documentation, and the official member database.",
      roles: ["Manage registration desk", "Record meeting minutes", "Maintain member database"]
  },
  {
      id: "Finance",
      title: "Finance & Audit",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
      description: "Guardians of the treasury. We ensure funds are managed transparently and resources are allocated efficiently.",
      roles: ["Collect fees & payments", "Audit financial reports", "Manage budget allocation"]
  },
  {
      id: "Academics",
      title: "Academics",
      image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
      description: "The brain trust. We develop the Masterclass curriculum, organize workshops, and ensure coffee excellence.",
      roles: ["Develop training modules", "Facilitate workshops", "Research coffee trends"]
  }
];

const SOCIAL_LINKS = { 
  facebook: "https://fb.com/lpubaristas.official", 
  instagram: "https://instagram.com/lpubaristas.official", 
  tiktok: "https://tiktok.com/@lpubaristas.official",
  email: "lpubaristas.official@gmail.com",
  pr_email: "lbaofficial.pr@gmail.com"
};

// --- Helper Logic ---
const getDirectLink = (url) => {
  if (!url || typeof url !== 'string') return "";
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/[-\w]{25,}/);
    if (idMatch) return `https://lh3.googleusercontent.com/d/${idMatch[0]}`;
  }
  return url;
};

const ensureAbsoluteUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return 'https://' + url;
};

const generateCSV = (headers, rows, filename) => {
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

const getMemberIdMeta = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let syStart = year % 100;
  let syEnd = (year + 1) % 100;
  if (month < 8) { syStart = (year - 1) % 100; syEnd = year % 100; }
  return { sy: `${syStart}${syEnd}`, sem: (month >= 8 || month <= 12) && month >= 8 ? "1" : "2" };
};

const generateLBAId = (category, currentCount = 0) => {
  const { sy, sem } = getMemberIdMeta();
  const padded = String(Number(currentCount) + 1).padStart(4, '0');
  const isLeader = ['Officer', 'Execomm', 'Committee'].includes(category);
  return `LBA${sy}-${sem}${padded}${isLeader ? "C" : ""}`;
};

const getDailyCashPasskey = () => {
  const now = new Date();
  return `KBA-${now.getDate()}-${(now.getMonth() + 1) + (now.getFullYear() % 100)}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return ""; 
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getEventDay = (dateStr) => {
    if (!dateStr) return "?";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "?" : d.getDate();
};

const getEventMonth = (dateStr) => {
    if (!dateStr) return "???";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "???" : d.toLocaleString('default', { month: 'short' }).toUpperCase();
};

// Safe date helpers for event rendering
const getEventDateParts = (startStr, endStr) => {
    if (!startStr) return { day: '?', month: '?' };
    const start = new Date(startStr);
    const startMonth = start.toLocaleString('default', { month: 'short' }).toUpperCase();
    const startDay = start.getDate();
    if (!endStr || startStr === endStr) {
        return { day: `${startDay}`, month: startMonth };
    }
    const end = new Date(endStr);
    const endMonth = end.toLocaleString('default', { month: 'short' }).toUpperCase();
    const endDay = end.getDate();
    if (startMonth === endMonth) {
        return { day: `${startDay}-${endDay}`, month: startMonth };
    } else {
        return { day: `${startDay}-${endDay}`, month: `${startMonth}/${endMonth}` };
    }
};

// --- Components ---

const MaintenanceBanner = () => (
    <div className="w-full bg-[#3E2723] text-[#FDB813] text-center py-2 px-4 flex items-center justify-center gap-2 font-black text-[10px] uppercase animate-pulse border-b-2 border-[#FDB813]">
        <Coffee size={14} />
        <span>Machine Calibration in Progress • Some Features Unavailable</span>
    </div>
);

const MemberCard = ({ m }) => (
    <div key={m.memberId || m.name} className="bg-white p-6 rounded-[32px] border border-amber-100 flex flex-col items-center text-center shadow-sm w-full sm:w-64 transform hover:scale-105 transition-transform duration-300">
       <img 
         src={getDirectLink(m.photoUrl) || `https://ui-avatars.com/api/?name=${m.name}&background=FDB813&color=3E2723`} 
         onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${m.name}&background=FDB813&color=3E2723`; }}
         className="w-20 h-20 rounded-full border-4 border-[#3E2723] mb-4 object-cover shadow-lg"
       />
       <h4 className="font-black text-xs uppercase mb-1 text-[#3E2723]">{m.name}</h4>
       {m.nickname && <p className="text-[10px] text-gray-500 mb-2 italic">"{m.nickname}"</p>}
       <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider">{m.specificTitle}</span>
    </div>
);

const DataPrivacyFooter = () => (
  <div className="w-full py-8 mt-12 border-t border-amber-900/10 text-[#3E2723]/40 text-center">
    <div className="flex items-center justify-center gap-2 mb-2 font-black uppercase text-[10px] tracking-widest">
      <ShieldCheck size={12} /> Data Privacy Statement
    </div>
    <p className="text-[9px] leading-relaxed max-w-lg mx-auto px-4">
      LPU Baristas' Association (LBA) is committed to protecting your personal data. All information collected within the Kaperata Hub is securely stored and processed in accordance with the Data Privacy Act of 2012 (RA 10173). Data is used strictly for membership management, event attendance, and certificate issuance. We do not share your information with unauthorized third parties.
    </p>
    <div className="mt-4 flex justify-center gap-4 text-[9px] font-bold uppercase tracking-wider">
      <span>© {new Date().getFullYear()} LBA</span>
      <span>•</span>
      <a href="#" className="hover:text-[#3E2723] hover:underline" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
      <span>•</span>
      <a href="#" className="hover:text-[#3E2723] hover:underline" onClick={(e) => e.preventDefault()}>Terms of Use</a>
    </div>
  </div>
);

const Login = ({ user, onLoginSuccess, initialError }) => {
  const [authMode, setAuthMode] = useState('login'); 
  const [memberIdInput, setMemberIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); 
  const [refNo, setRefNo] = useState('');
  const [cashOfficerKey, setCashOfficerKey] = useState('');
  const [membershipType, setMembershipType] = useState('new'); 
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(''); 
  const [pendingProfile, setPendingProfile] = useState(null);
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true, maintenanceMode: false, gcashNumber: '09063751402' });
  const [secureKeys, setSecureKeys] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    if(initialError) setError(initialError);
  }, [initialError]);

  useEffect(() => {
    if (!user) return;
    const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (s) => s.exists() && setHubSettings(s.data()), (e) => {});
    const unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (s) => s.exists() && setSecureKeys(s.data()), (e) => {});
    return () => { unsubOps(); unsubKeys(); };
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return; 
    setError('');
    setLoading(true);
    setStatusMessage('Authenticating...');

    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out.")), 60000));
    
    try {
        await Promise.race([
            (async () => {
                let currentUser = user || auth.currentUser;
                if (!currentUser) {
                    try {
                        const result = await signInAnonymously(auth);
                        currentUser = result.user;
                    } catch (err) {
                        throw new Error(`Connection failed: ${err.message}`);
                    }
                }

                if (authMode === 'register') {
                    if (!hubSettings.registrationOpen) throw new Error("Registration closed.");
                    if (password !== confirmPassword) throw new Error("Passwords mismatch.");
                    if (!birthMonth || !birthDay) throw new Error("Birthday required.");
                    
                    setStatusMessage('Verifying details...');
                    let pc = 'Member', st = 'Member', role = 'member', pay = 'unpaid';
                    let finalMembershipType = membershipType; 

                    if (inputKey) {
                        const uk = inputKey.trim().toUpperCase();
                        if (uk === (secureKeys?.officerKey || "KAPERATA_OFFICER_2024").toUpperCase()) { pc = 'Officer'; role = 'admin'; pay = 'exempt'; }
                        else if (uk === (secureKeys?.headKey || "KAPERATA_HEAD_2024").toUpperCase()) { pc = 'Committee'; st = 'Committee Head'; pay = 'exempt'; }
                        else if (uk === (secureKeys?.commKey || "KAPERATA_COMM_2024").toUpperCase()) { pc = 'Committee'; st = 'Committee Member'; pay = 'exempt'; }
                        else if (uk === (secureKeys?.exemptKey || "KAPERATA_EXEMPT_2024").toUpperCase()) { pc = 'Member'; pay = 'exempt'; }
                        else throw new Error("Invalid key.");
                        
                        if (pay === 'exempt') finalMembershipType = 'renewal';
                    }

                    setStatusMessage('Finalizing registration...');
                    
                    const registryRef = collection(db, 'artifacts', appId, 'public', 'data', 'registry');
                    const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters');
                    
                    // Transaction logic for safe ID generation
                    const newProfile = await runTransaction(db, async (transaction) => {
                         const counterSnap = await transaction.get(counterRef);
                         let nextCount;
                         const storedCount = counterSnap.exists() ? (counterSnap.data().memberCount || 0) : 0;
                         const baseCount = Math.max(storedCount, 0);
                         nextCount = baseCount + 1;

                         let assignedId = generateLBAId(pc, nextCount - 1); 
                         let memberRef = doc(registryRef, assignedId);
                         let memberSnap = await transaction.get(memberRef);
                         
                         let attempts = 0;
                         while(memberSnap.exists() && attempts < 20) {
                             nextCount++;
                             assignedId = generateLBAId(pc, nextCount - 1);
                             memberRef = doc(registryRef, assignedId);
                             memberSnap = await transaction.get(memberRef);
                             attempts++;
                         }
                         
                         if(memberSnap.exists()) throw new Error("System busy. Please try again.");

                         const meta = getMemberIdMeta();
                         const profileData = { 
                            uid: currentUser.uid, 
                            name: `${firstName} ${middleInitial ? middleInitial + '. ' : ''}${lastName}`.toUpperCase(), 
                            firstName: firstName.toUpperCase(), 
                            middleInitial: middleInitial.toUpperCase(), 
                            lastName: lastName.toUpperCase(), 
                            email: email.toLowerCase(), 
                            password, 
                            program, 
                            birthMonth: parseInt(birthMonth),
                            birthDay: parseInt(birthDay),
                            positionCategory: pc, 
                            specificTitle: st, 
                            memberId: assignedId, 
                            role, 
                            status: 'active', 
                            paymentStatus: pay, 
                            lastRenewedSem: meta.sem, 
                            lastRenewedSY: meta.sy, 
                            membershipType: finalMembershipType,
                            joinedDate: new Date().toISOString() 
                        };

                        if (pay === 'exempt') {
                             transaction.set(memberRef, profileData);
                             transaction.set(counterRef, { memberCount: nextCount }, { merge: true });
                             return profileData; 
                        } else {
                             return profileData;
                        }
                    });

                    if (pay === 'exempt') {
                        localStorage.setItem('lba_profile', JSON.stringify(newProfile));
                        onLoginSuccess(newProfile);
                    } else { 
                        setPendingProfile(newProfile); 
                        setAuthMode('payment'); 
                    }

                } else if (authMode === 'payment') {
                    setStatusMessage('Processing...');
                    if (paymentMethod === 'cash' && cashOfficerKey.trim().toUpperCase() !== getDailyCashPasskey().toUpperCase()) throw new Error("Invalid Cash Key.");
                    
                    const registryRef = collection(db, 'artifacts', appId, 'public', 'data', 'registry');
                    const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters');
                    
                    const finalProfile = await runTransaction(db, async (transaction) => {
                         const counterSnap = await transaction.get(counterRef);
                         let nextCount;
                         const storedCount = counterSnap.exists() ? (counterSnap.data().memberCount || 0) : 0;
                         nextCount = storedCount + 1;

                         let assignedId = generateLBAId(pendingProfile.positionCategory, nextCount - 1);
                         let memberRef = doc(registryRef, assignedId);
                         let memberSnap = await transaction.get(memberRef);
                         
                         let attempts = 0;
                         while(memberSnap.exists() && attempts < 20) {
                             nextCount++;
                             assignedId = generateLBAId(pendingProfile.positionCategory, nextCount - 1);
                             memberRef = doc(registryRef, assignedId);
                             memberSnap = await transaction.get(memberRef);
                             attempts++;
                         }
                         
                         if(memberSnap.exists()) throw new Error("System busy. Please try again.");

                         const finalData = { 
                             ...pendingProfile, 
                             memberId: assignedId, 
                             paymentStatus: 'paid', 
                             paymentDetails: { method: paymentMethod, refNo } 
                         };

                         transaction.set(memberRef, finalData);
                         transaction.set(counterRef, { memberCount: nextCount }, { merge: true });
                         return finalData;
                    });

                    localStorage.setItem('lba_profile', JSON.stringify(finalProfile));
                    onLoginSuccess(finalProfile);
                } else {
                    setStatusMessage('Logging in...');
                    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), where('memberId', '==', memberIdInput.trim().toUpperCase()), limit(1));
                    const snap = await getDocs(q);
                    if (snap.empty) throw new Error("ID not found.");
                    const docSnap = snap.docs[0];
                    const userData = docSnap.data();
                    if (userData.password !== password) throw new Error("Incorrect password.");

                    if (userData.uid !== currentUser.uid) {
                        setStatusMessage('Updating session...');
                        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', docSnap.id), {
                            uid: currentUser.uid
                        });
                        userData.uid = currentUser.uid;
                    }
                    
                    localStorage.setItem('lba_profile', JSON.stringify(userData));
                    onLoginSuccess(userData);
                }
            })(),
            timeout
        ]);
    } catch (err) { 
        console.error("Auth error:", err);
        setError(err.message); 
    } finally { setLoading(false); setStatusMessage(''); }
  };

  const activeBtnClass = "flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] bg-[#3E2723] text-[#FDB813]";
  const inactiveBtnClass = "flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] bg-amber-50 text-amber-900";
  const feeAmount = pendingProfile?.membershipType === 'renewal' ? "50.00" : "100.00";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4 text-[#3E2723] relative">
      {hubSettings.maintenanceMode && (
          <div className="absolute top-0 left-0 right-0 z-[101] w-full">
              <MaintenanceBanner />
          </div>
      )}
      {showForgotModal && (
         <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[40px] max-w-sm w-full p-10 shadow-2xl border-t-[12px] border-[#FDB813] text-center">
               <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6"><Info size={32}/></div>
               <h4 className="font-serif text-2xl font-black uppercase">Account Recovery</h4>
               <p className="text-sm font-medium text-amber-950 mt-4">Contact an officer at:</p>
               <a href={`mailto:${SOCIAL_LINKS.pr_email}`} className="text-[#3E2723] font-black underline block mt-2 text-xs">{SOCIAL_LINKS.pr_email}</a>
               <button onClick={() => setShowForgotModal(false)} className="w-full mt-8 bg-[#3E2723] text-[#FDB813] py-4 rounded-2xl font-black uppercase text-[10px]">Close</button>
            </div>
         </div>
      )}
      <div className="bg-white p-10 rounded-[48px] shadow-2xl max-w-md w-full border-t-[12px] border-[#3E2723] mt-8">
        <div className="flex flex-col items-center mb-10 text-center">
          <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-32 h-32 object-contain mb-4" />
          <h1 className="font-serif text-xl font-black uppercase">LPU Baristas' Association</h1>
          <p className="text-[#FDB813] font-black tracking-[0.3em] text-[10px] bg-[#3E2723] px-4 py-1 rounded-full mt-2 uppercase">KAPERATA HUB</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-xl text-center text-xs font-bold">{error}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'login' && (
            <div className="space-y-3">
               <input type="text" required placeholder="Member ID" className="w-full p-4 border border-amber-200 rounded-2xl font-bold uppercase text-xs" value={memberIdInput} onChange={(e) => setMemberIdInput(e.target.value.toUpperCase())} />
               <input type="password" required placeholder="Password" className="w-full p-4 border border-amber-200 rounded-2xl font-bold text-xs" value={password} onChange={(e) => setPassword(e.target.value)} />
               <div className="flex justify-end pr-2"><button type="button" onClick={() => setShowForgotModal(true)} className="text-[10px] font-black uppercase text-amber-600 hover:text-amber-800">Forgot Password?</button></div>
            </div>
          )}
          {authMode === 'register' && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                <input type="text" required placeholder="FIRST" className="col-span-2 p-3 border border-amber-200 rounded-xl outline-none text-xs font-bold uppercase" value={firstName} onChange={(e) => setFirstName(e.target.value.toUpperCase())} />
                <input type="text" placeholder="MI" maxLength="1" className="p-3 border border-amber-200 rounded-xl outline-none text-xs text-center font-bold uppercase" value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())} />
                <input type="text" required placeholder="LAST" className="col-span-2 p-3 border border-amber-200 rounded-xl outline-none text-xs font-bold uppercase" value={lastName} onChange={(e) => setLastName(e.target.value.toUpperCase())} />
              </div>
              <input type="email" required placeholder="LPU Email" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
              
              <div className="grid grid-cols-2 gap-2">
                 <select required className="p-3 border border-amber-200 rounded-xl text-xs font-black uppercase" value={program} onChange={(e) => setProgram(e.target.value)}>
                    <option value="">Select Program</option>
                    {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
                 <select required className="p-3 border border-amber-200 rounded-xl text-xs font-black uppercase" value={membershipType} onChange={(e) => setMembershipType(e.target.value)}>
                    <option value="new">New Member</option>
                    <option value="renewal">Renewal</option>
                 </select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select required className="p-3 border border-amber-200 rounded-xl text-xs font-black uppercase" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                    <option value="">Birth Month</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <input type="number" required min="1" max="31" placeholder="Day" className="p-3 border border-amber-200 rounded-xl text-xs font-bold" value={birthDay} onChange={(e) => setBirthDay(e.target.value)} />
              </div>

              <input type="password" required placeholder="Password" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input type="password" required placeholder="Confirm Password" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <input type="text" placeholder="Leader Key / Exempt Key" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold uppercase" value={inputKey} onChange={(e) => setInputKey(e.target.value.toUpperCase())} />
            </div>
          )}
          {authMode === 'payment' && (
            <div className="space-y-4">
               <p className="text-center font-black text-sm uppercase text-[#3E2723]">Total Fee: ₱{feeAmount}</p>
               <div className="flex gap-2">
                  <button type="button" onClick={() => setPaymentMethod('gcash')} className={paymentMethod === 'gcash' ? activeBtnClass : inactiveBtnClass}>GCash</button>
                  <button type="button" onClick={() => setPaymentMethod('cash')} className={paymentMethod === 'cash' ? activeBtnClass : inactiveBtnClass}>Cash</button>
               </div>
               <div className="p-4 bg-amber-50 rounded-2xl text-[10px] font-black text-amber-900 text-center uppercase">
                  {/* Updated GCash number */}
                  {paymentMethod === 'gcash' ? `GCash: +63${hubSettings.gcashNumber || '9063751402'}` : "Provide Daily Cash Key"}
               </div>
               <input type="text" required placeholder={paymentMethod === 'gcash' ? "Reference No." : "Daily Cash Key"} className="w-full p-3 border border-amber-200 rounded-xl outline-none text-xs uppercase" value={paymentMethod === 'gcash' ? refNo : cashOfficerKey} onChange={e => paymentMethod === 'gcash' ? setRefNo(e.target.value) : setCashOfficerKey(e.target.value.toUpperCase())} />
               <button type="button" onClick={() => setAuthMode('register')} className="w-full text-xs font-bold text-gray-500 hover:text-[#3E2723] underline">Back to Registration</button>
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-[#3E2723] text-[#FDB813] py-5 rounded-2xl hover:bg-black transition-all font-black uppercase flex justify-center items-center gap-2 text-xs">
            {loading ? <div className="flex items-center gap-2"><Loader2 className="animate-spin" size={20}/><span className="text-[10px]">{statusMessage}</span></div> : (authMode === 'payment' ? 'Complete' : authMode === 'register' ? 'Register' : 'Enter Hub')}
          </button>
        </form>
        {authMode !== 'payment' && (
          <p className="text-center mt-6 text-[10px] text-amber-800 uppercase font-black">
            {authMode === 'login' ? (
              <button onClick={() => setAuthMode('register')} className="ml-2 text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Not Yet Registered? Brew With Us!</button>
            ) : <button onClick={() => setAuthMode('login')} className="ml-2 text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Back to Login</button>}
          </p>
        )}
      </div>
      <div className="w-full mt-auto">
         <DataPrivacyFooter />
      </div>
    </div>
  );
};

// --- Dashboard Component ---
const Dashboard = ({ user, profile, setProfile, logout }) => {
  const [view, setView] = useState('home');
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [committeeApps, setCommitteeApps] = useState([]); 
  const [userApplications, setUserApplications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  
  const [logs, setLogs] = useState([]);
  const [polls, setPolls] = useState([]);
  const [seriesPosts, setSeriesPosts] = useState([]);
  
  // Member's Corner & Diaries
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] }); 
  const [showPollForm, setShowPollForm] = useState(false);
  const [newSeriesPost, setNewSeriesPost] = useState({ title: '', imageUrl: '', caption: '' });
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);

  // Project Form State
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({ 
    title: '', 
    description: '', 
    deadline: '', 
    projectHeadId: '', 
    projectHeadName: '' 
  });
  const [editingProject, setEditingProject] = useState(null);

  const [hubSettings, setHubSettings] = useState({ 
      registrationOpen: true, 
      renewalOpen: true, 
      maintenanceMode: false,
      renewalMode: false, 
      allowedPayment: 'gcash_only', 
      gcashNumber: '09063751402',
      idLaceReady: false 
  });
  const [secureKeys, setSecureKeys] = useState({ officerKey: '', headKey: '', commKey: '', exemptKey: '' });
  const [legacyContent, setLegacyContent] = useState({ body: "Loading association history...", achievements: [], imageSettings: { objectFit: 'cover', objectPosition: 'center' } });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Masterclass State
  const [masterclassData, setMasterclassData] = useState({ certTemplate: '', moduleAttendees: { 1: [], 2: [], 3: [], 4: [], 5: [] }, moduleDetails: {} });
  const [showCertificate, setShowCertificate] = useState(false);
  const [adminMcModule, setAdminMcModule] = useState(1);
  const [adminMcSearch, setAdminMcSearch] = useState('');
  const [selectedMcMembers, setSelectedMcMembers] = useState([]);
  const [editingMcCurriculum, setEditingMcCurriculum] = useState(false);
  const [tempMcDetails, setTempMcDetails] = useState({ title: '', objectives: '', topics: '', icon: '' });

  // Anniversary State
  const [isAnniversary, setIsAnniversary] = useState(false);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({ joinedDate: '' });

  // Email Modal State
  const [emailModal, setEmailModal] = useState({ isOpen: false, app: null, type: '', subject: '', body: '' });
  // Accolade Modal State
  const [showAccoladeModal, setShowAccoladeModal] = useState(null); 
  const [accoladeText, setAccoladeText] = useState("");

  // Task Board State
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
      title: '',
      description: '',
      deadline: '',
      link: '',
      status: 'pending',
      notes: '',
      projectId: '',
      assigneeId: '', 
      assigneeName: '',
      outputLink: '',
      outputCaption: ''
  });
  const [editingTask, setEditingTask] = useState(null);

  // Renewal/Payment State
  const [renewalRef, setRenewalRef] = useState('');
  const [renewalMethod, setRenewalMethod] = useState('gcash');
  const [renewalCashKey, setRenewalCashKey] = useState('');
  const [newGcashNumber, setNewGcashNumber] = useState('');

  // Last visited state for notifications
  const [lastVisited, setLastVisited] = useState(() => {
      try {
          return JSON.parse(localStorage.getItem('lba_last_visited') || '{}');
      } catch { return {}; }
  });

  const updateLastVisited = (page) => {
     const newVisits = { ...lastVisited, [page]: new Date().toISOString() };
     setLastVisited(newVisits);
     localStorage.setItem('lba_last_visited', JSON.stringify(newVisits));
  };
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'memberId', direction: 'asc' });
  const [selectedBaristas, setSelectedBaristas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isImporting, setIsImporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); 
  const fileInputRef = useRef(null);
  const currentDailyKey = getDailyCashPasskey();
  const [settingsForm, setSettingsForm] = useState({ ...profile });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  const [tempShift, setTempShift] = useState({ date: '', type: 'WHOLE_DAY', name: '', capacity: 5 });
  const [savingSettings, setSavingSettings] = useState(false);
  const [financialFilter, setFinancialFilter] = useState('all');
  
  const [isEditingLegacy, setIsEditingLegacy] = useState(false);
  const [legacyForm, setLegacyForm] = useState({ body: '', imageUrl: '', galleryUrl: '', achievements: [], establishedDate: '', imageSettings: { objectFit: 'cover', objectPosition: 'center' } });
  const [tempAchievement, setTempAchievement] = useState({ date: '', text: '' });

  const [suggestionText, setSuggestionText] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ 
    name: '', 
    startDate: '', 
    endDate: '', 
    startTime: '', 
    endTime: '', 
    venue: '', 
    description: '', 
    attendanceRequired: false, 
    evaluationLink: '',
    isVolunteer: false, 
    registrationRequired: true, 
    openForAll: true,
    volunteerTarget: { officer: 0, committee: 0, member: 0 },
    shifts: [],
    masterclassModuleIds: [], 
    scheduleType: 'WHOLE_DAY' 
  });
  const [editingEvent, setEditingEvent] = useState(null); 
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  
  const [committeeForm, setCommitteeForm] = useState({ role: 'Committee Member' });
  const [submittingApp, setSubmittingApp] = useState(false);
  const [attendanceEvent, setAttendanceEvent] = useState(null);
  const [exportFilter, setExportFilter] = useState('all');

  const isOfficer = useMemo(() => { if (!profile?.positionCategory) return false; const pc = String(profile.positionCategory).toUpperCase(); return ['OFFICER', 'EXECOMM', 'COMMITTEE'].includes(pc); }, [profile?.positionCategory]);
  const isAdmin = useMemo(() => { if (!profile?.positionCategory) return false; const pc = String(profile.positionCategory).toUpperCase(); return ['OFFICER', 'EXECOMM'].includes(pc); }, [profile?.positionCategory]);
  
  const isCommitteeHead = useMemo(() => { return profile.positionCategory === 'Committee' && (profile.specificTitle || '').includes('Head'); }, [profile]);
  const canManageProjects = useMemo(() => { return isAdmin || isCommitteeHead; }, [isAdmin, isCommitteeHead]);

  const isExpired = useMemo(() => { return profile.status === 'expired'; }, [profile.status]);
  const isExemptFromRenewal = useMemo(() => { const pc = String(profile.positionCategory).toUpperCase(); return ['OFFICER', 'EXECOMM', 'COMMITTEE', 'ORG ADVISER'].includes(pc); }, [profile.positionCategory]);
  const isBirthday = useMemo(() => { if (!profile.birthMonth || !profile.birthDay) return false; const today = new Date(); return parseInt(profile.birthMonth) === (today.getMonth() + 1) && parseInt(profile.birthDay) === today.getDate(); }, [profile]);

  const financialStats = useMemo(() => {
    if (!members) return { totalPaid: 0, cashCount: 0, gcashCount: 0, exemptCount: 0 };
    let filtered = members;
    if (financialFilter !== 'all') { const [sy, sem] = financialFilter.split('-'); filtered = members.filter(m => m.lastRenewedSY === sy && m.lastRenewedSem === sem); }
    const payingMembers = filtered.filter(m => { const isExempt = ['Officer', 'Execomm', 'Committee'].includes(m.positionCategory) || m.paymentStatus === 'exempt'; return !isExempt && m.paymentStatus === 'paid'; });
    const cashPayments = payingMembers.filter(m => m.paymentDetails?.method === 'cash').length;
    const gcashPayments = payingMembers.filter(m => m.paymentDetails?.method === 'gcash').length;
    return { totalPaid: payingMembers.length, cashCount: cashPayments, gcashCount: gcashPayments, exemptCount: filtered.length - payingMembers.length };
  }, [members, financialFilter]);

  const semesterOptions = useMemo(() => { if(!members) return []; const sems = new Set(members.map(m => `${m.lastRenewedSY}-${m.lastRenewedSem}`)); return Array.from(sems).filter(s => s !== "undefined-undefined").sort().reverse(); }, [members]);

  const teamStructure = useMemo(() => {
    if (!members) return { tier1: [], tier2: [], tier3: [], committees: { heads: [], members: [] } };
    const sortedMembers = [...members].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const hasTitle = (m, title) => (m.specificTitle || "").toUpperCase().includes(title.toUpperCase());
    const isCat = (m, cat) => (m.positionCategory || "").toUpperCase() === cat.toUpperCase();
    
    // Dynamically filter committees based on COMMITTEES_INFO
    const committeeGroups = {};
    COMMITTEES_INFO.forEach(comm => {
        committeeGroups[comm.id] = {
            heads: sortedMembers.filter(m => isCat(m, "Committee") && hasTitle(m, "Head") && (m.specificTitle.includes(comm.id) || m.specificTitle.includes(comm.title))),
            members: sortedMembers.filter(m => isCat(m, "Committee") && !hasTitle(m, "Head") && (m.specificTitle.includes(comm.id) || m.specificTitle.includes(comm.title)))
        };
    });

    return {
        tier1: sortedMembers.filter(m => hasTitle(m, "President") && isCat(m, "Officer")),
        tier2: sortedMembers.filter(m => hasTitle(m, "Secretary") && isCat(m, "Officer")),
        tier3: sortedMembers.filter(m => !hasTitle(m, "President") && !hasTitle(m, "Secretary") && isCat(m, "Officer")),
        committees: committeeGroups 
    };
  }, [members]);

  const volunteerCount = useMemo(() => { if (!events || !profile.memberId) return 0; return events.reduce((acc, ev) => { if (!ev.isVolunteer || !ev.shifts) return acc; const shiftCount = ev.shifts.filter(s => s.volunteers?.includes(profile.memberId)).length; return acc + shiftCount; }, 0); }, [events, profile.memberId]);

  const notifications = useMemo(() => {
      const hasNew = (items, pageKey) => { if (!items || items.length === 0) return false; const lastVisit = lastVisited[pageKey]; if (!lastVisit) return true; return items.some(i => { const d = i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt || 0); return d > new Date(lastVisit); }); };
      let huntNotify = false;
      if (isOfficer) { huntNotify = committeeApps.some(a => a.status === 'pending'); } else { huntNotify = userApplications.some(a => { const updated = a.statusUpdatedAt?.toDate ? a.statusUpdatedAt.toDate() : null; const lastVisit = lastVisited['committee_hunt']; if (!updated) return false; return !lastVisit || updated > new Date(lastVisit); }); }
      let regNotify = false;
      if (isOfficer) { regNotify = hasNew(members.map(m => ({ createdAt: m.joinedDate })), 'members'); }
      return { events: hasNew(events, 'events'), announcements: hasNew(announcements, 'announcements'), suggestions: hasNew(suggestions, 'suggestions'), committee_hunt: huntNotify, members: regNotify };
  }, [events, announcements, suggestions, members, committeeApps, userApplications, lastVisited, isOfficer]);

  useEffect(() => {
    if (!user) return;
    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), (docSnap) => { if (docSnap.exists()) { const data = docSnap.data(); if (JSON.stringify(data) !== JSON.stringify(profile)) { setProfile(data); localStorage.setItem('lba_profile', JSON.stringify(data)); } } });
    let unsubReg = () => {};
    if (isOfficer || isAdmin || isCommitteeHead) { unsubReg = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), (s) => { const list = s.docs.map(d => ({ id: d.id, ...d.data() })); setMembers(list); }); }
    const unsubEvents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'events'), (s) => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubAnn = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), (s) => setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSug = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions')), (s) => { const data = s.docs.map(d => ({ id: d.id, ...d.data() })); data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)); setSuggestions(data); });
    let unsubApps;
    if (isAdmin) { unsubApps = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'applications')), (s) => { const data = s.docs.map(d => ({ id: d.id, ...d.data() })); setCommitteeApps(data); }); }
    const unsubUserApps = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), where('memberId', '==', profile.memberId)), (s) => { const data = s.docs.map(d => ({ id: d.id, ...d.data() })); setUserApplications(data); });
    let unsubProjects = () => {};
    if (isOfficer || isCommitteeHead) { unsubProjects = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), orderBy('createdAt', 'desc')), (s) => { const data = s.docs.map(d => ({ id: d.id, ...d.data() })); setProjects(data); }); }
    let unsubTasks = () => {};
    // Fetch all tasks for officers/committee heads, or tasks assigned to the current user
    const taskQuery = (isOfficer || isCommitteeHead) 
        ? query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'))
        : query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), where('assigneeId', '==', profile.memberId));

    const unsubTasksListener = onSnapshot(taskQuery, (s) => { 
        const data = s.docs.map(d => ({ id: d.id, ...d.data() })); 
        setTasks(data); 
    });

    let unsubLogs = () => {};
    if (isAdmin) { unsubLogs = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), orderBy('timestamp', 'desc'), limit(50)), (s) => { const data = s.docs.map(d => ({ id: d.id, ...d.data() })); setLogs(data); }); }
    const unsubPolls = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'polls'), orderBy('createdAt', 'desc')), (s) => { const data = s.docs.map(d => ({ id: d.id, ...d.data() })); setPolls(data); });
    const unsubSeries = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'series_posts'), orderBy('createdAt', 'desc')), (s) => { const data = s.docs.map(d => ({ id: d.id, ...d.data() })); setSeriesPosts(data); });
    const setIcons = () => { const head = document.head; let linkIcon = document.querySelector("link[rel~='icon']"); if (!linkIcon) { linkIcon = document.createElement('link'); linkIcon.rel = 'icon'; head.appendChild(linkIcon); } linkIcon.href = APP_ICON_URL; let linkApple = document.querySelector("link[rel='apple-touch-icon']"); if (!linkApple) { linkApple = document.createElement('link'); linkApple.rel = 'apple-touch-icon'; head.appendChild(linkApple); } linkApple.href = APP_ICON_URL; }; setIcons();
    const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (s) => s.exists() && setHubSettings(s.data()));
    const unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (s) => s.exists() && setSecureKeys(s.data()));
    const unsubLegacy = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), (s) => { if(s.exists()) { setLegacyContent(s.data()); const data = s.data(); setLegacyForm({ ...data, achievements: data.achievements || [], imageUrl: data.imageUrl || '', galleryUrl: data.galleryUrl || '', imageSettings: data.imageSettings || { objectFit: 'cover', objectPosition: 'center' } }); if (data.establishedDate) { const today = new Date(); const est = new Date(data.establishedDate); if (today.getMonth() === est.getMonth() && today.getDate() === est.getDate()) { setIsAnniversary(true); } } } });
    const unsubMC = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), (s) => { if(s.exists()) { setMasterclassData(s.data()); } else { const initData = { certTemplate: '', moduleAttendees: { 1: [], 2: [], 3: [], 4: [], 5: [] }, moduleDetails: {} }; setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), initData); } });
    return () => { unsubProfile(); unsubReg(); unsubEvents(); unsubAnn(); unsubSug(); unsubOps(); unsubKeys(); unsubLegacy(); unsubMC(); unsubProjects(); unsubTasksListener(); unsubLogs(); unsubPolls(); unsubSeries(); if (unsubApps) unsubApps(); unsubUserApps(); };
  }, [user, isAdmin, isOfficer, isCommitteeHead, profile.memberId]);

  const logAction = async (action, details) => { if (!profile) return; try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), { action, details, actor: profile.name, actorId: profile.memberId, timestamp: serverTimestamp() }); } catch (err) { console.error("Logging failed:", err); } };

  const handleUpdateProfile = async (e) => { e.preventDefault(); setSavingSettings(true); try { const updated = { ...profile, ...settingsForm, birthMonth: parseInt(settingsForm.birthMonth), birthDay: parseInt(settingsForm.birthDay) }; if (settingsForm.email !== profile.email) { updated.email = settingsForm.email.toLowerCase(); } await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), updated); setProfile(updated); localStorage.setItem('lba_profile', JSON.stringify(updated)); alert("Profile updated successfully!"); } catch(err) { alert("Failed to update profile."); } finally { setSavingSettings(false); } };
  const handleChangePassword = async (e) => { e.preventDefault(); if (passwordForm.new !== passwordForm.confirm) return alert("New passwords do not match."); if (passwordForm.current !== profile.password) return alert("Incorrect current password."); try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), { password: passwordForm.new }); const updatedProfile = { ...profile, password: passwordForm.new }; setProfile(updatedProfile); localStorage.setItem('lba_profile', JSON.stringify(updatedProfile)); setPasswordForm({ current: '', new: '', confirm: '' }); alert("Password changed successfully."); } catch (err) { alert("Failed to change password."); } };
  const handleDeleteSuggestion = async (id) => { if(!confirm("Delete?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', id)); logAction("Delete Suggestion", `ID: ${id}`); } catch(err) {} };
  const handlePostSuggestion = async (e) => { e.preventDefault(); if (isExpired) return alert("Renew membership to post."); if (!suggestionText.trim()) return; try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), { text: suggestionText, authorId: profile.memberId, authorName: "Anonymous", createdAt: serverTimestamp() }); setSuggestionText(""); alert("Suggestion submitted!"); } catch (err) {} };
  const handleAddPollOption = () => setNewPoll(prev => ({ ...prev, options: [...prev.options, ''] }));
  const handlePollOptionChange = (index, value) => { const updatedOptions = [...newPoll.options]; updatedOptions[index] = value; setNewPoll(prev => ({ ...prev, options: updatedOptions })); };
  const handleCreatePoll = async (e) => { e.preventDefault(); if (!newPoll.question || newPoll.options.some(o => !o.trim())) return alert("Fill all fields"); try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'polls'), { question: newPoll.question, options: newPoll.options.map((text, idx) => ({ id: idx + 1, text, votes: [] })), createdBy: profile.name, createdAt: serverTimestamp(), status: 'active' }); setShowPollForm(false); setNewPoll({ question: '', options: ['', ''] }); logAction("Create Poll", newPoll.question); } catch (e) {} };
  const handleVotePoll = async (pollId, optionId) => { if (isExpired) return alert("Renew to vote."); try { const pollRef = doc(db, 'artifacts', appId, 'public', 'data', 'polls', pollId); const poll = polls.find(p => p.id === pollId); if (!poll) return; const updatedOptions = poll.options.map(opt => { const newVotes = opt.votes.filter(uid => uid !== profile.memberId); if (opt.id === optionId) newVotes.push(profile.memberId); return { ...opt, votes: newVotes }; }); await updateDoc(pollRef, { options: updatedOptions }); } catch (e) {} };
  const handleDeletePoll = async (id) => { if(!confirm("Delete poll?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'polls', id)); } catch (e) {} };
  const handleEditSeries = (post) => { setNewSeriesPost({ title: post.title, imageUrl: post.imageUrl || post.images?.join(','), caption: post.caption }); setEditingSeries(post); setShowSeriesForm(true); };
  const handlePostSeries = async (e) => { e.preventDefault(); try { const payload = { title: newSeriesPost.title, caption: newSeriesPost.caption, images: newSeriesPost.imageUrl.split(',').map(s => s.trim()).filter(s => s), imageUrl: newSeriesPost.imageUrl.split(',')[0].trim() }; if (editingSeries) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'series_posts', editingSeries.id), { ...payload, lastEdited: serverTimestamp() }); setEditingSeries(null); logAction("Edit Series", newSeriesPost.title); } else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'series_posts'), { ...payload, author: profile.name, authorId: profile.memberId, createdAt: serverTimestamp() }); logAction("Post Series", newSeriesPost.title); } setShowSeriesForm(false); setNewSeriesPost({ title: '', imageUrl: '', caption: '' }); } catch (e) {} };
  const handleDeleteSeries = async (id) => { if(!confirm("Delete post?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'series_posts', id)); } catch (e) {} };
  const addShift = () => { if (!tempShift.date) return; const sessionName = tempShift.type === 'WHOLE_DAY' ? 'Whole Day' : (tempShift.name || 'Shift'); setNewEvent(prev => ({ ...prev, shifts: [...prev.shifts, { id: crypto.randomUUID(), date: tempShift.date, session: sessionName, capacity: tempShift.capacity, volunteers: [] }] })); setTempShift(prev => ({ ...prev, name: '' })); };
  const removeShift = (id) => setNewEvent(prev => ({ ...prev, shifts: prev.shifts.filter(s => s.id !== id) }));
  const handleAddAchievement = () => { if (!tempAchievement.text.trim()) return; const newAch = { text: tempAchievement.text.trim(), date: tempAchievement.date || new Date().toISOString().split('T')[0] }; const updatedList = [...(legacyForm.achievements || []), newAch].sort((a,b) => new Date(a.date) - new Date(b.date)); setLegacyForm(prev => ({ ...prev, achievements: updatedList })); setTempAchievement({ date: '', text: '' }); };
  const handleUpdateAchievement = (index, field, value) => { const updated = [...legacyForm.achievements]; updated[index] = { ...updated[index], [field]: value }; updated.sort((a,b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01')); setLegacyForm(prev => ({ ...prev, achievements: updated })); };
  const handleRemoveAchievement = (index) => setLegacyForm(prev => ({ ...prev, achievements: prev.achievements.filter((_, i) => i !== index) }));
  const handleAddEvent = async (e) => { e.preventDefault(); try { const eventPayload = { ...newEvent, name: newEvent.name.toUpperCase(), venue: newEvent.venue.toUpperCase(), createdAt: serverTimestamp(), attendees: [], registered: [] }; if (editingEvent) { delete eventPayload.createdAt; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEvent.id), eventPayload); logAction("Update Event", newEvent.name); setEditingEvent(null); } else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), eventPayload); logAction("Create Event", newEvent.name); } setShowEventForm(false); setNewEvent({ name: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', description: '', attendanceRequired: false, evaluationLink: '', isVolunteer: false, registrationRequired: true, openForAll: true, volunteerTarget: { officer: 0, committee: 0, member: 0 }, shifts: [], masterclassModuleIds: [], scheduleType: 'WHOLE_DAY' }); } catch (err) {} };
  const handleEditEvent = (ev) => { setNewEvent({ name: ev.name, startDate: ev.startDate, endDate: ev.endDate, startTime: ev.startTime, endTime: ev.endTime, venue: ev.venue, description: ev.description, attendanceRequired: ev.attendanceRequired || false, evaluationLink: ev.evaluationLink || '', isVolunteer: ev.isVolunteer || false, registrationRequired: ev.registrationRequired !== undefined ? ev.registrationRequired : true, openForAll: ev.openForAll !== undefined ? ev.openForAll : true, volunteerTarget: ev.volunteerTarget || { officer: 0, committee: 0, member: 0 }, shifts: ev.shifts || [], masterclassModuleIds: ev.masterclassModuleIds || (ev.masterclassModuleId ? [ev.masterclassModuleId] : []), scheduleType: ev.scheduleType || 'WHOLE_DAY' }); setEditingEvent(ev); setShowEventForm(true); };
  const handleDeleteEvent = async (id) => { if(!confirm("Delete event?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id)); logAction("Delete Event", id); } catch(err) {} };
  const handleToggleAttendance = async (memberId) => { if (!attendanceEvent || !memberId) return; const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', attendanceEvent.id); const isPresent = attendanceEvent.attendees?.includes(memberId); try { if (isPresent) { await updateDoc(eventRef, { attendees: arrayRemove(memberId) }); } else { await updateDoc(eventRef, { attendees: arrayUnion(memberId) }); } if (attendanceEvent.masterclassModuleIds && attendanceEvent.masterclassModuleIds.length > 0) { const trackerRef = doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'); const updates = {}; attendanceEvent.masterclassModuleIds.forEach(modId => { const fieldPath = `moduleAttendees.${modId}`; updates[fieldPath] = isPresent ? arrayRemove(memberId) : arrayUnion(memberId); }); await updateDoc(trackerRef, updates); } setAttendanceEvent(prev => ({ ...prev, attendees: isPresent ? prev.attendees.filter(id => id !== memberId) : [...(prev.attendees || []), memberId] })); } catch(err) {} };
  const handleDownloadAttendance = () => { if (!attendanceEvent) return; const presentMembers = members.filter(m => attendanceEvent.attendees?.includes(m.memberId)); const headers = ["Name", "ID", "Position"]; const rows = presentMembers.sort((a,b) => (a.name || "").localeCompare(b.name || "")).map(m => [m.name, m.memberId, m.specificTitle]); generateCSV(headers, rows, `${attendanceEvent.name.replace(/\s+/g, '_')}_Attendance.csv`); };
  const handleRegisterEvent = async (ev) => { if (isExpired) return alert("Renew membership to join."); const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', ev.id); const isRegistered = ev.registered?.includes(profile.memberId); try { if (isRegistered) { await updateDoc(eventRef, { registered: arrayRemove(profile.memberId) }); } else { await updateDoc(eventRef, { registered: arrayUnion(profile.memberId) }); } } catch (err) {} };
  const handleVolunteerSignup = async (ev, shiftId) => { if (isExpired) return alert("Renew membership to volunteer."); const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', ev.id); const updatedShifts = ev.shifts.map(shift => { if (shift.id === shiftId) { const isVolunteered = shift.volunteers.includes(profile.memberId); if (isVolunteered) { return { ...shift, volunteers: shift.volunteers.filter(id => id !== profile.memberId) }; } else { if (shift.volunteers.length >= shift.capacity) { alert("Shift full!"); return shift; } return { ...shift, volunteers: [...shift.volunteers, profile.memberId] }; } } return shift; }); try { await updateDoc(eventRef, { shifts: updatedShifts }); } catch(err) {} };
  const handlePostAnnouncement = async (e) => { e.preventDefault(); try { if (editingAnnouncement) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'announcements', editingAnnouncement.id), { ...newAnnouncement, lastEdited: serverTimestamp() }); logAction("Update Announcement", newAnnouncement.title); setEditingAnnouncement(null); } else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), { ...newAnnouncement, date: new Date().toISOString(), createdAt: serverTimestamp() }); logAction("Post Announcement", newAnnouncement.title); } setShowAnnounceForm(false); setNewAnnouncement({ title: '', content: '' }); } catch (err) {} };
  const handleDeleteAnnouncement = async (id) => { if(!confirm("Delete announcement?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'announcements', id)); logAction("Delete Announcement", id); } catch(err) {} };
  const handleEditAnnouncement = (ann) => { setNewAnnouncement({ title: ann.title, content: ann.content }); setEditingAnnouncement(ann); setShowAnnounceForm(true); };
  const handleSaveLegacy = async () => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), legacyForm); logAction("Update Legacy", "Updated About Us"); setIsEditingLegacy(false); } catch(err) {} };
  const handleUpdateMemberDetails = async (e) => { e.preventDefault(); if (!editingMember) return; try { const docId = editingMember.id || editingMember.memberId; const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', docId); await updateDoc(memberRef, { joinedDate: new Date(editMemberForm.joinedDate).toISOString() }); logAction("Update Member", editingMember.name); setEditingMember(null); alert("Updated."); } catch(err) {} };
  const handleBulkAddMasterclass = async () => { if (selectedMcMembers.length === 0) return alert("No members selected!"); const currentAttendees = masterclassData.moduleAttendees?.[adminMcModule] || []; const updatedAttendees = [...new Set([...currentAttendees, ...selectedMcMembers])]; const newData = { ...masterclassData, moduleAttendees: { ...masterclassData.moduleAttendees, [adminMcModule]: updatedAttendees } }; try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), newData); logAction("Masterclass Add", `Added ${selectedMcMembers.length} to Module ${adminMcModule}`); setSelectedMcMembers([]); setAdminMcSearch(''); alert("Added."); } catch(e) {} };
  const handleSaveCertTemplate = async () => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), masterclassData); alert("Saved"); } catch(e) {} };
  const handleSaveMcCurriculum = async () => { try { const newData = { ...masterclassData, moduleDetails: { ...masterclassData.moduleDetails, [adminMcModule]: tempMcDetails } }; await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), newData); logAction("Update Curriculum", `Updated Module ${adminMcModule}`); setEditingMcCurriculum(false); alert("Updated"); } catch(e) {} };
  const handleUpdateGcashNumber = async () => { if (!newGcashNumber.trim()) return; try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { ...hubSettings, gcashNumber: newGcashNumber }); logAction("Update GCash", newGcashNumber); setNewGcashNumber(''); alert("Updated"); } catch (err) {} };
  const handleApplyCommittee = async (e, targetCommittee) => { e.preventDefault(); if (isExpired) return alert("Renew membership to apply."); setSubmittingApp(true); try { const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), where('memberId', '==', profile.memberId)); const snap = await getDocs(q); if(!snap.empty) { alert("Already applied."); setSubmittingApp(false); return; } await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), { memberId: profile.memberId, name: profile.name, email: profile.email, committee: targetCommittee, role: committeeForm.role, status: 'pending', createdAt: serverTimestamp(), statusUpdatedAt: serverTimestamp() }); alert("Submitted!"); } catch(err) {} finally { setSubmittingApp(false); } };
  
  const handleCreateProject = async (e) => { 
      e.preventDefault(); 
      try { 
          const projectHead = members.find(m => m.memberId === newProject.projectHeadId); 
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), { 
              title: newProject.title, 
              description: newProject.description, 
              deadline: newProject.deadline, 
              projectHeadId: newProject.projectHeadId, 
              projectHeadName: projectHead ? projectHead.name : '', 
              createdBy: profile.memberId, 
              createdAt: serverTimestamp(), 
              status: 'active' 
          }); 
          setShowProjectForm(false); 
          setNewProject({ title: '', description: '', deadline: '', projectHeadId: '', projectHeadName: '' }); 
          logAction("Create Project", newProject.title); 
      } catch(e) {} 
  };

  const handleEditProjectDetails = async (e) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
        const projectHead = members.find(m => m.memberId === newProject.projectHeadId);
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', editingProject.id), {
             title: newProject.title,
             description: newProject.description,
             deadline: newProject.deadline,
             projectHeadId: newProject.projectHeadId,
             projectHeadName: projectHead ? projectHead.name : '',
             lastEdited: serverTimestamp()
        });
        logAction("Edit Project", newProject.title);
        setShowProjectForm(false);
        setEditingProject(null);
    } catch(err) {}
  };

  const handleDeleteProject = async (id) => {
      if(!confirm("Delete project and all tasks?")) return;
      try {
          const tasksQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), where('projectId', '==', id));
          const tasksSnap = await getDocs(tasksQuery);
          const batch = writeBatch(db);
          tasksSnap.forEach(t => batch.delete(t.ref));
          await batch.commit();
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', id));
          logAction("Delete Project", id);
      } catch(e) {}
  };

  const handleAddTask = async (e) => { 
      e.preventDefault(); 
      if (!newTask.projectId) return alert("Task must belong to a project"); 
      const assigneeData = members.find(m => m.memberId === newTask.assigneeId);
      const assigneeName = assigneeData ? assigneeData.name : '';
      const taskPayload = { ...newTask, assigneeId: newTask.assigneeId || '', assigneeName: assigneeName, outputLink: newTask.outputLink || '', outputCaption: newTask.outputCaption || '' };
      try { 
          if (editingTask) { 
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', editingTask.id), { ...taskPayload, lastEdited: serverTimestamp() }); 
              logAction("Update Task", newTask.title); 
              setEditingTask(null); 
          } else { 
              await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), { ...taskPayload, createdBy: profile.memberId, creatorName: profile.name, createdAt: serverTimestamp() }); 
              logAction("Create Task", newTask.title); 
          } 
          setShowTaskForm(false); 
          setNewTask({ title: '', description: '', deadline: '', link: '', status: 'pending', notes: '', projectId: newTask.projectId, assigneeId: '', assigneeName: '', outputLink: '', outputCaption: '' }); 
      } catch (err) {} 
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), { status: newStatus }); } catch (err) {} };
  const handleDeleteTask = async (id) => { if(!confirm("Delete task?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', id)); logAction("Delete Task", id); } catch(err) {} };
  
  const handleEditTask = (task) => { 
      setNewTask({ title: task.title, description: task.description, deadline: task.deadline, link: task.link, status: task.status, notes: task.notes || '', projectId: task.projectId, assigneeId: task.assigneeId || '', assigneeName: task.assigneeName || '', outputLink: task.outputLink || '', outputCaption: task.outputCaption || '' }); 
      setEditingTask(task); 
      setShowTaskForm(true); 
  };

  const initiateAppAction = (app, type) => { let subject = "", body = ""; const signature = "\n\nBest regards,\nLPU Baristas' Association"; if (type === 'for_interview') { subject = `LBA: Interview Invitation`; body = `Dear ${app.name},\n\nWe invite you for an interview regarding your application for ${app.committee}.\n${signature}`; } else if (type === 'accepted') { subject = `LBA: Congratulations!`; body = `Dear ${app.name},\n\nAccepted as ${app.role} for ${app.committee}!\n${signature}`; } else if (type === 'denied') { subject = `LBA Application Update`; body = `Dear ${app.name},\n\nThank you for applying. We cannot move forward at this time.\n${signature}`; } setEmailModal({ isOpen: true, app, type, subject, body }); };
  const confirmAppAction = async () => { if (!emailModal.app) return; try { const { app, type, subject, body } = emailModal; const batch = writeBatch(db); const appRef = doc(db, 'artifacts', appId, 'public', 'data', 'applications', app.id); batch.update(appRef, { status: type, statusUpdatedAt: serverTimestamp(), lastEmailSent: new Date().toISOString() }); if (type === 'accepted') { const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', app.memberId); batch.update(memberRef, { accolades: arrayUnion(`${app.committee} - ${app.role}`) }); } await batch.commit(); logAction("Committee Action", `${type} for ${app.name}`); window.location.href = `mailto:${app.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; setEmailModal({ isOpen: false, app: null, type: '', subject: '', body: '' }); alert("Updated & Email opened."); } catch (err) {} };
  const handleDeleteApp = async (id) => { if (!confirm("Delete application?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', id)); logAction("Delete App", id); } catch(err) {} };
  const handleToggleRegistration = async () => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { ...hubSettings, registrationOpen: !hubSettings.registrationOpen }); } catch (err) {} };
  const handleToggleMaintenance = async () => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { ...hubSettings, maintenanceMode: !hubSettings.maintenanceMode }); } catch (err) {} };
  const handleToggleRenewalMode = async () => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { ...hubSettings, renewalMode: !hubSettings.renewalMode }); } catch (err) {} };
  const handleToggleAllowedPayment = async () => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { ...hubSettings, allowedPayment: hubSettings.allowedPayment === 'gcash_only' ? 'both' : 'gcash_only' }); } catch (err) {} };
  
  const handleToggleIdLaceIssuing = async () => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { ...hubSettings, idLaceReady: !hubSettings.idLaceReady }); } catch(err) {} };
  const handleToggleIdLaceReceived = async (memberId, currentVal) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberId), { idLaceReceived: !currentVal }); } catch(e) {} };

  const handleDownloadFinancials = () => { let filtered = members; if (financialFilter !== 'all') { const [sy, sem] = financialFilter.split('-'); filtered = members.filter(m => m.lastRenewedSY === sy && m.lastRenewedSem === sem); } const headers = ["Name", "ID", "Category", "Payment Status", "Method", "Ref No"]; const rows = filtered.map(m => { const isExempt = ['Officer', 'Execomm', 'Committee'].includes(m.positionCategory) || m.paymentStatus === 'exempt'; return [m.name, m.memberId, m.positionCategory, isExempt ? 'EXEMPT' : (m.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'), m.paymentDetails?.method || '', m.paymentDetails?.refNo || '']; }); generateCSV(headers, rows, `LBA_Financials_${financialFilter}.csv`); };
  const handleSanitizeDatabase = async () => { if (!confirm("This will REMOVE DUPLICATES and RE-GENERATE IDs. Sure?")) return; const batch = writeBatch(db); try { const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), orderBy('joinedDate', 'asc')); const snapshot = await getDocs(q); let count = 0; snapshot.docs.forEach((docSnap) => { const data = docSnap.data(); count++; const padded = String(count).padStart(4, '0'); const isLeader = ['Officer', 'Execomm', 'Committee'].includes(data.positionCategory); const meta = getMemberIdMeta(); const newId = `LBA${meta.sy}-${meta.sem}${padded}${isLeader ? "C" : ""}`; batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'registry', docSnap.id), { memberId: newId }); }); await batch.commit(); alert("Sanitized."); } catch (err) {} };
  const handleMigrateToRenewal = async () => { if(!confirm("Update ALL to 'Renewal'?")) return; const batch = writeBatch(db); try { const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'registry')); const snapshot = await getDocs(q); snapshot.forEach(doc => { if (doc.data().membershipType !== 'renewal') batch.update(doc.ref, { membershipType: 'renewal' }); }); await batch.commit(); alert("Migrated."); } catch (err) {} };
  const handleToggleStatus = async (memberId, currentStatus) => { if (!confirm(`Toggle status?`)) return; try { const updates = { status: currentStatus === 'active' ? 'expired' : 'active' }; if (currentStatus === 'active') updates.paymentStatus = 'unpaid'; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberId), updates); } catch(e) {} };
  const handleRenewalPayment = async (e) => { e.preventDefault(); if (renewalMethod === 'gcash' && !renewalRef) return; if (renewalMethod === 'cash' && (!renewalCashKey || renewalCashKey.trim().toUpperCase() !== getDailyCashPasskey().toUpperCase())) return alert("Invalid Cash Key."); try { const meta = getMemberIdMeta(); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), { status: 'active', paymentStatus: 'paid', lastRenewedSY: meta.sy, lastRenewedSem: meta.sem, membershipType: 'renewal', paymentDetails: { method: renewalMethod, refNo: renewalMethod === 'gcash' ? renewalRef : 'CASH', date: new Date().toISOString() } }); setRenewalRef(''); setRenewalCashKey(''); alert("Renewed!"); } catch (err) {} };
  const handleAcknowledgeApp = async (appId) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', appId), { acknowledged: true }); } catch (err) {} };
  const handleExportCSV = () => { let d = [...members]; if (exportFilter === 'active') d = d.filter(m => m.status === 'active'); else if (exportFilter === 'inactive') d = d.filter(m => m.status !== 'active'); else if (exportFilter === 'officers') d = d.filter(m => ['Officer', 'Execomm'].includes(m.positionCategory)); else if (exportFilter === 'committee') d = d.filter(m => m.positionCategory === 'Committee'); const h = ["Name", "ID", "Email", "Program", "Position", "Status"]; const r = d.map(e => [e.name, e.memberId, e.email, e.program, e.specificTitle, e.status]); generateCSV(h, r, `LBA_Registry_${exportFilter}.csv`); };
  const handleBulkEmail = () => { const r = selectedBaristas.length > 0 ? members.filter(m => selectedBaristas.includes(m.memberId)) : [...members]; const emails = r.map(m => m.email).filter(e => e).join(','); if (!emails) return alert("No emails."); window.location.href = `mailto:?bcc=${emails}`; };
  const handleGiveAccolade = async () => { if (!accoladeText.trim() || !showAccoladeModal) return; try { const docId = showAccoladeModal.id || showAccoladeModal.memberId; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', docId), { accolades: arrayUnion(accoladeText) }); setAccoladeText(""); setShowAccoladeModal(prev => ({...prev, currentAccolades: [...(prev.currentAccolades||[]), accoladeText]})); alert("Awarded!"); } catch (err) {} };
  const handleRemoveAccolade = async (acc) => { if(!confirm("Remove?")) return; try { const docId = showAccoladeModal.id || showAccoladeModal.memberId; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', docId), { accolades: arrayRemove(acc) }); setShowAccoladeModal(prev => ({...prev, currentAccolades: prev.currentAccolades.filter(a => a !== acc)})); } catch(e) {} };
  const handleResetPassword = async (mid, email, name) => { if (!confirm(`Reset for ${name}?`)) return; const pw = "LBA-" + Math.random().toString(36).slice(-6).toUpperCase(); try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', mid), { password: pw }); window.location.href = `mailto:${email}?subject=Reset&body=ID: ${mid}\nPW: ${pw}`; alert("Reset!"); } catch (err) {} };
  const filteredRegistry = useMemo(() => { let res = [...members]; if (searchQuery) res = res.filter(m => (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())) || (m.memberId && m.memberId.toLowerCase().includes(searchQuery.toLowerCase()))); res.sort((a, b) => (a[sortConfig.key] || "").localeCompare(b[sortConfig.key] || "") * (sortConfig.direction === 'asc' ? 1 : -1)); return res; }, [members, searchQuery, sortConfig]);
  const totalPages = Math.ceil(filteredRegistry.length / itemsPerPage);
  const paginatedRegistry = filteredRegistry.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const nextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage(p => Math.max(p - 1, 1));
  const toggleSelectAll = () => setSelectedBaristas(selectedBaristas.length === paginatedRegistry.length ? [] : paginatedRegistry.map(m => m.memberId));
  const toggleSelectBarista = (mid) => setSelectedBaristas(prev => prev.includes(mid) ? prev.filter(id => id !== mid) : [...prev, mid]);
  const handleUpdatePosition = async (tid, cat, spec) => { if (!isAdmin) return; const t = members.find(m => m.memberId === tid); if (!t) return; const isL = ['Officer', 'Execomm', 'Committee'].includes(cat); const meta = getMemberIdMeta(); const newId = `LBA${meta.sy}-${meta.sem}${String(t.memberId.match(/-(\d)(\d{4,})/)?.[2]).padStart(4,'0')}${isL ? 'C' : ''}`; const ups = { positionCategory: cat, specificTitle: spec || cat, memberId: newId, role: ['Officer', 'Execomm'].includes(cat) ? 'admin' : 'member', paymentStatus: isL ? 'exempt' : t.paymentStatus }; if (newId !== tid) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', tid)); await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', newId), { ...t, ...ups }); };
  const initiateRemoveMember = (mid, name) => setConfirmDelete({ mid, name });
  const confirmRemoveMember = async () => { if (!confirmDelete) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', confirmDelete.mid)); } catch(e) {} finally { setConfirmDelete(null); } };
  const handleBulkImportCSV = async (e) => { const file = e.target.files[0]; if (!file) return; setIsImporting(true); const reader = new FileReader(); reader.onload = async (evt) => { try { const rows = evt.target.result.split('\n').filter(r => r.trim().length > 0); const batch = writeBatch(db); let count = members.length; for (let i = 1; i < rows.length; i++) { const [name, email, prog, pos, title] = rows[i].split(',').map(s => s.trim()); if (!name || !email) continue; const mid = generateLBAId(pos, count++); const meta = getMemberIdMeta(); const data = { name: name.toUpperCase(), email: email.toLowerCase(), program: prog || "UNSET", positionCategory: pos || "Member", specificTitle: title || pos || "Member", memberId: mid, role: pos === 'Officer' ? 'admin' : 'member', status: 'expired', paymentStatus: pos !== 'Member' ? 'exempt' : 'unpaid', lastRenewedSem: meta.sem, lastRenewedSY: meta.sy, password: "LBA" + mid.slice(-5), joinedDate: new Date().toISOString() }; batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'registry', mid), data); } await batch.commit(); logAction("Bulk Import", `Count: ${rows.length - 1}`); } catch (err) {} finally { setIsImporting(false); e.target.value = ""; } }; reader.readAsText(file); };
  const downloadImportTemplate = () => generateCSV(["Name", "Email", "Program", "PositionCategory", "SpecificTitle"], [["JUAN DELA CRUZ", "juan@lpu.edu.ph", "BSIT", "Member", "Member"]], "LBA_Import_Template.csv");
  const handleRotateSecurityKeys = async () => { const newKeys = { officerKey: "OFF" + Math.random().toString(36).slice(-6).toUpperCase(), headKey: "HEAD" + Math.random().toString(36).slice(-6).toUpperCase(), commKey: "COMM" + Math.random().toString(36).slice(-6).toUpperCase() }; await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), newKeys); };
  const handleDownloadSuggestions = () => { const filtered = suggestions.filter(s => { if (!s.createdAt) return true; const d = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt); const w = new Date(); w.setDate(w.getDate() - 7); return d > w; }); generateCSV(["Date", "Suggestion"], filtered.map(s => [s.createdAt?.toDate ? formatDate(s.createdAt.toDate()) : "Just now", s.text]), `LBA_Suggestions_${new Date().toISOString().split('T')[0]}.csv`); };

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'about', label: 'Legacy Story', icon: History },
    { id: 'masterclass', label: 'Masterclass', icon: GraduationCap },
    { id: 'team', label: 'Brew Crew', icon: Users },
    { id: 'events', label: "What's Brewing?", icon: Calendar, hasNotification: notifications.events },
    { id: 'announcements', label: 'Grind Report', icon: Bell, hasNotification: notifications.announcements },
    { id: 'members_corner', label: "Member's Corner", icon: MessageSquare, hasNotification: notifications.suggestions },
    { id: 'series', label: 'Barista Diaries', icon: ImageIcon },
    { id: 'committee_hunt', label: 'Committee Hunt', icon: Briefcase, hasNotification: notifications.committee_hunt },
    ...(isOfficer || isCommitteeHead ? [ { id: 'daily_grind', label: 'The Task Bar', icon: ClipboardList } ] : []),
    ...(isOfficer ? [ { id: 'members', label: 'Registry', icon: Users, hasNotification: notifications.members } ] : []),
    ...(isAdmin ? [{ id: 'reports', label: 'Terminal', icon: FileText }] : []),
    { id: 'settings', label: 'Settings', icon: Settings2 }
  ];

  const activeMenuClass = "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all bg-[#FDB813] text-[#3E2723] shadow-lg font-black relative";
  const inactiveMenuClass = "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-amber-200/40 hover:bg-white/5 relative";

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col text-[#3E2723] font-sans relative overflow-hidden">
      {hubSettings.maintenanceMode && <div className="absolute top-0 left-0 right-0 z-[101]"><MaintenanceBanner /></div>}
      {confirmDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"><div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center border-b-[8px] border-[#3E2723]"><h3 className="text-xl font-black uppercase text-[#3E2723] mb-2">Confirm</h3><p className="text-sm text-gray-600 mb-8">Remove <span className="font-bold">{confirmDelete.name}</span>?</p><div className="flex gap-3"><button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs">Cancel</button><button onClick={confirmRemoveMember} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold uppercase text-xs">Delete</button></div></div></div>}
      {emailModal.isOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><div className="bg-white rounded-[32px] p-8 max-w-lg w-full border-b-[8px] border-[#3E2723]"><h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Send Email</h3><div className="space-y-4"><input type="text" className="w-full p-3 border rounded-xl text-xs font-bold" value={emailModal.subject} onChange={e => setEmailModal({...emailModal, subject: e.target.value})} /><textarea className="w-full p-3 border rounded-xl text-xs h-32" value={emailModal.body} onChange={e => setEmailModal({...emailModal, body: e.target.value})} /><div className="flex gap-3 pt-2"><button onClick={() => setEmailModal({ isOpen: false, app: null, type: '', subject: '', body: '' })} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs">Cancel</button><button onClick={confirmAppAction} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs">Send</button></div></div></div></div>}
      {editingMember && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"><div className="bg-white rounded-[32px] p-8 max-w-sm w-full border-b-[8px] border-[#3E2723]"><h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Edit Details</h3><form onSubmit={handleUpdateMemberDetails}><label>Joined Date</label><input type="date" className="w-full p-3 border rounded-xl text-xs font-bold" value={editMemberForm.joinedDate} onChange={e => setEditMemberForm({...editMemberForm, joinedDate: e.target.value})} /><div className="flex gap-3 pt-4"><button type="button" onClick={() => setEditingMember(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs">Cancel</button><button type="submit" className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs">Save</button></div></form></div></div>}
      {showCertificate && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"><div className="relative max-w-4xl w-full"><button onClick={() => setShowCertificate(false)} className="absolute -top-12 right-0 text-white"><X size={32}/></button>{masterclassData.certTemplate ? <div className="relative bg-white shadow-2xl rounded-lg overflow-hidden"><img src={getDirectLink(masterclassData.certTemplate)} className="w-full h-auto" /><div className="absolute inset-0 flex flex-col items-center justify-center pt-20"><h2 className="font-serif text-3xl md:text-5xl font-black text-[#3E2723] uppercase tracking-widest text-center px-4 mb-4">{profile.name}</h2><p className="font-serif text-lg md:text-2xl text-amber-700 font-bold uppercase">Certified Master Barista</p><p className="font-mono text-sm md:text-lg text-gray-500 mt-8">{new Date().toLocaleDateString()}</p></div></div> : <div className="bg-white p-8 rounded-2xl text-center"><AlertCircle size={48} className="mx-auto text-amber-500 mb-4"/><h3 className="font-bold text-xl mb-2">Missing Template</h3></div>}</div></div>}
      {attendanceEvent && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"><div className="bg-white rounded-[32px] p-8 w-full max-w-2xl h-[80vh] flex flex-col border-b-[8px] border-[#3E2723]"><div className="flex justify-between items-center mb-6 border-b pb-4 border-amber-100"><div><h3 className="text-xl font-black uppercase text-[#3E2723]">Attendance</h3><p className="text-xs text-amber-600 font-bold mt-1">{attendanceEvent.name}</p></div><div className="flex gap-2"><button onClick={handleDownloadAttendance} className="p-2 bg-green-100 text-green-700 rounded-full"><Download size={20}/></button><button onClick={() => setAttendanceEvent(null)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button></div></div><div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">{[...(attendanceEvent.registrationRequired ? members.filter(m => attendanceEvent.registered?.includes(m.memberId)) : members)].sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(m => { const isPresent = attendanceEvent.attendees?.includes(m.memberId); return (<div key={m.id} onClick={() => handleToggleAttendance(m.memberId)} className={`p-4 rounded-xl flex items-center justify-between cursor-pointer border ${isPresent ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'}`}><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isPresent ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>{m.name?.charAt(0)}</div><div><p className="text-xs font-bold uppercase">{m.name}</p><p className="text-[9px] text-gray-400">{m.memberId}</p></div></div>{isPresent && <CheckCircle size={14} className="text-green-500"/>}</div>); })}</div></div></div>}
      {showAccoladeModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"><div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center border-b-[8px] border-[#3E2723]"><h3 className="text-xl font-black uppercase text-[#3E2723] mb-2">Accolade</h3><div className="mb-4 bg-gray-50 rounded-xl p-3 max-h-32 overflow-y-auto"><ul className="space-y-1">{(showAccoladeModal.currentAccolades || []).map((acc, idx) => (<li key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100"><span className="text-[10px] font-bold text-gray-700">{acc}</span><button onClick={() => handleRemoveAccolade(acc)} className="text-red-400"><X size={12}/></button></li>))}</ul></div><input type="text" placeholder="Title" className="w-full p-3 border rounded-xl text-xs mb-6" value={accoladeText} onChange={e => setAccoladeText(e.target.value)} /><div className="flex gap-3"><button onClick={() => setShowAccoladeModal(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs">Close</button><button onClick={handleGiveAccolade} className="flex-1 py-3 rounded-xl bg-yellow-500 text-white font-bold uppercase text-xs">Award</button></div></div></div>}
      
      {/* Forms (Task, Project, Poll, Series) */}
      {showTaskForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 max-w-lg w-full border-b-[8px] border-[#3E2723] overflow-y-auto max-h-[90vh]">
                <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">{editingTask ? "Edit Task" : "Add Task"}</h3>
                <div className="space-y-4">
                    <input type="text" placeholder="Title" className="w-full p-3 border rounded-xl text-xs font-bold" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                    <textarea placeholder="Desc" className="w-full p-3 border rounded-xl text-xs" rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" className="w-full p-3 border rounded-xl text-xs" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
                        <select className="w-full p-3 border rounded-xl text-xs font-bold uppercase" value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})}>
                            <option value="pending">Pending</option>
                            <option value="brewing">In Progress</option>
                            <option value="served">Completed</option>
                        </select>
                    </div>
                    {/* ASSIGNEE FIELD */}
                    <select className="w-full p-3 border rounded-xl text-xs" value={newTask.assigneeId} onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}>
                        <option value="">Assign To (Optional)</option>
                        {members.filter(m => ['Officer', 'Execomm', 'Committee'].includes(m.positionCategory)).map(m => (
                            <option key={m.memberId} value={m.memberId}>{m.name} ({m.specificTitle})</option>
                        ))}
                    </select>

                    <input type="text" placeholder="Reference Link (URL)" className="w-full p-3 border rounded-xl text-xs" value={newTask.link} onChange={e => setNewTask({...newTask, link: e.target.value})} />
                    
                    {/* OUTPUT FIELDS */}
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">Output Submission</label>
                        <input type="text" placeholder="Output Link (GDrive/Canva)" className="w-full p-3 border rounded-xl text-xs mb-2" value={newTask.outputLink} onChange={e => setNewTask({...newTask, outputLink: e.target.value})} />
                        <textarea placeholder="Caption / Write-up (Formatting preserved)" className="w-full p-3 border rounded-xl text-xs bg-white whitespace-pre-wrap" rows="4" value={newTask.outputCaption} onChange={e => setNewTask({...newTask, outputCaption: e.target.value})} />
                    </div>

                    <div className="bg-amber-50 p-3 rounded-xl"><label className="text-[10px] font-black uppercase text-amber-800 mb-1 block">Barista Notes</label><textarea className="w-full p-3 border border-amber-200 rounded-xl text-xs bg-white" rows="2" value={newTask.notes} onChange={e => setNewTask({...newTask, notes: e.target.value})} /></div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => { setShowTaskForm(false); setEditingTask(null); }} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs">Cancel</button>
                        <button onClick={handleAddTask} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs">Save</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {showProjectForm && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><div className="bg-white rounded-[32px] p-8 max-w-lg w-full border-b-[8px] border-[#3E2723]"><h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">{editingProject ? 'Edit Project' : 'New Project'}</h3><div className="space-y-4"><input type="text" placeholder="Title" className="w-full p-3 border rounded-xl text-xs font-bold" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} /><textarea placeholder="Desc" className="w-full p-3 border rounded-xl text-xs" rows="3" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} /><div className="grid grid-cols-2 gap-4"><input type="date" className="w-full p-3 border rounded-xl text-xs" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} /><select className="w-full p-3 border rounded-xl text-xs" value={newProject.projectHeadId} onChange={e => setNewProject({...newProject, projectHeadId: e.target.value})}><option value="">Select Head</option>{members.map(m => (<option key={m.memberId} value={m.memberId}>{m.name}</option>))}</select></div><div className="flex gap-3 pt-2"><button onClick={() => { setShowProjectForm(false); setEditingProject(null); }} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs">Cancel</button><button onClick={editingProject ? handleEditProjectDetails : handleCreateProject} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs">{editingProject ? 'Save Changes' : 'Create'}</button></div></div></div></div>}
      
      {showPollForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full border-b-[8px] border-[#3E2723]">
                <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Create New Poll</h3>
                <div className="space-y-4">
                    <input type="text" placeholder="Question" className="w-full p-3 border rounded-xl text-xs font-bold" value={newPoll.question} onChange={e => setNewPoll({...newPoll, question: e.target.value})} />
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {newPoll.options.map((opt, idx) => (
                            <input key={idx} type="text" placeholder={`Option ${idx + 1}`} className="w-full p-3 border rounded-xl text-xs" value={opt} onChange={e => handlePollOptionChange(idx, e.target.value)} />
                        ))}
                        <button onClick={handleAddPollOption} className="text-xs text-amber-600 font-bold hover:underline">+ Add Option</button>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowPollForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs">Cancel</button>
                        <button onClick={handleCreatePoll} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs">Post</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {showSeriesForm && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><div className="bg-white rounded-[32px] p-8 max-w-md w-full border-b-[8px] border-[#3E2723]"><h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Diary Post</h3><div className="space-y-4"><input type="text" placeholder="Title" className="w-full p-3 border rounded-xl text-xs font-bold" value={newSeriesPost.title} onChange={e => setNewSeriesPost({...newSeriesPost, title: e.target.value})} /><textarea placeholder="Image URLs (comma separated for album)" className="w-full p-3 border rounded-xl text-xs" value={newSeriesPost.imageUrl} onChange={e => setNewSeriesPost({...newSeriesPost, imageUrl: e.target.value})} /><textarea placeholder="Caption" className="w-full p-3 border rounded-xl text-xs h-24" value={newSeriesPost.caption} onChange={e => setNewSeriesPost({...newSeriesPost, caption: e.target.value})} /><div className="flex gap-3 pt-2"><button onClick={() => setShowSeriesForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs">Cancel</button><button onClick={handlePostSeries} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs">Post</button></div></div></div></div>}
      
      {showEventForm && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"><div className="bg-white rounded-[32px] p-8 max-w-lg w-full border-b-[8px] border-[#3E2723] overflow-y-auto max-h-[90vh]"><h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">{editingEvent ? 'Edit Event' : 'New Event'}</h3><div className="space-y-4"><input type="text" placeholder="Event Name" className="w-full p-3 border rounded-xl text-xs font-bold" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} /><div className="grid grid-cols-2 gap-2"><input type="date" className="p-3 border rounded-xl text-xs" value={newEvent.startDate} onChange={e => setNewEvent({...newEvent, startDate: e.target.value})} /><input type="time" className="p-3 border rounded-xl text-xs" value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} /></div><div className="flex flex-col gap-2"><div className="flex gap-2 items-center"><input type="checkbox" checked={newEvent.registrationRequired} onChange={e => setNewEvent({...newEvent, registrationRequired: e.target.checked})} /><span className="text-xs">Reg Required</span><input type="checkbox" checked={newEvent.isVolunteer} onChange={e => setNewEvent({...newEvent, isVolunteer: e.target.checked})} className="ml-4" /><span className="text-xs">Volunteer Event</span><input type="checkbox" checked={newEvent.openForAll} onChange={e => setNewEvent({...newEvent, openForAll: e.target.checked})} className="ml-4" /><span className="text-xs">Open For All</span></div></div>{newEvent.isVolunteer && <div className="bg-amber-50 p-3 rounded-xl"><h4 className="text-xs font-bold mb-2">Shifts</h4><div className="flex gap-2 mb-2"><input type="date" className="p-2 border rounded text-xs" value={tempShift.date} onChange={e => setTempShift({...tempShift, date: e.target.value})} /><input type="number" placeholder="Cap" className="p-2 border rounded text-xs w-16" value={tempShift.capacity} onChange={e => setTempShift({...tempShift, capacity: parseInt(e.target.value)})} /><button onClick={addShift} className="p-2 bg-[#3E2723] text-white rounded text-xs">Add</button></div><div className="space-y-1">{newEvent.shifts.map(s => (<div key={s.id} className="flex justify-between text-xs bg-white p-2 rounded border"><span>{s.date} - {s.session} (Cap: {s.capacity})</span><button onClick={() => removeShift(s.id)} className="text-red-500">x</button></div>))}</div></div>}<textarea placeholder="Description" className="w-full p-3 border rounded-xl text-xs" rows="3" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} /><input type="text" placeholder="Venue" className="w-full p-3 border rounded-xl text-xs" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} /><input type="text" placeholder="Evaluation Link (Optional)" className="w-full p-3 border rounded-xl text-xs" value={newEvent.evaluationLink} onChange={e => setNewEvent({...newEvent, evaluationLink: e.target.value})} /><div className="flex gap-3 pt-2"><button onClick={() => setShowEventForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs">Cancel</button><button onClick={handleAddEvent} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs">Save</button></div></div></div></div>}
      
      {showAnnounceForm && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"><div className="bg-white rounded-[32px] p-8 max-w-md w-full border-b-[8px] border-[#3E2723]"><h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Announcement</h3><div className="space-y-4"><input type="text" placeholder="Title" className="w-full p-3 border rounded-xl text-xs font-bold" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} /><textarea placeholder="Content" className="w-full p-3 border rounded-xl text-xs h-32" value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} /><div className="flex gap-3 pt-2"><button onClick={() => setShowAnnounceForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs">Cancel</button><button onClick={handlePostAnnouncement} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs">Post</button></div></div></div></div>}

      <div className="flex-1 flex flex-col md:flex-row min-w-0 overflow-hidden relative">
          <aside className={`bg-[#3E2723] text-amber-50 flex-col md:w-64 md:flex ${mobileMenuOpen ? 'fixed inset-0 z-50 w-64 shadow-2xl flex' : 'hidden'}`}>
            <div className="p-8 border-b border-amber-900/30 text-center"><img src={getDirectLink(ORG_LOGO_URL)} className="w-20 h-20 object-contain mx-auto mb-4" /><h1 className="font-serif font-black text-[10px] uppercase">LPU Baristas' Association</h1></div>
            <div className="md:hidden p-4 flex justify-end absolute top-2 right-2"><button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button></div>
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">{menuItems.map(item => { const active = view === item.id; const Icon = item.icon; return ( <button key={item.id} onClick={() => { setView(item.id); updateLastVisited(item.id); setMobileMenuOpen(false); }} className={active ? activeMenuClass : inactiveMenuClass}><Icon size={18}/><span className="uppercase text-[10px] font-black">{item.label}</span>{item.hasNotification && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm"></div>}</button>); })}</nav>
            <div className="p-6 border-t border-amber-900/30 space-y-4"><div className="flex justify-center gap-4"><a href={SOCIAL_LINKS.facebook} target="_blank" className="text-amber-200/60 hover:text-[#FDB813]"><Facebook size={18} /></a><a href={SOCIAL_LINKS.instagram} target="_blank" className="text-amber-200/60 hover:text-[#FDB813]"><Instagram size={18} /></a></div><button onClick={() => { localStorage.removeItem('lba_profile'); logout(); }} className="w-full flex items-center justify-center gap-2 text-red-400 font-black text-[10px] uppercase hover:text-red-300"><LogOut size={16} /> Exit Hub</button></div>
          </aside>
          {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>}

          <main className="flex-1 overflow-y-auto p-4 md:p-10 relative flex flex-col">
             {/* Mobile Header */}
             <div className="md:hidden flex items-center justify-between mb-6"><button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-[#3E2723] text-[#FDB813] rounded-xl"><Menu size={24}/></button><img src={getDirectLink(ORG_LOGO_URL)} className="w-8 h-8 object-contain" /></div>

             {/* Header with Settings Access */}
             <header className="flex justify-between items-center mb-10">
                <div className="hidden md:block">
                     <h2 className="font-serif text-3xl font-black uppercase text-[#3E2723]">KAPErata Hub</h2>
                     <p className="text-xs text-amber-600 font-bold uppercase tracking-widest">Official Member Portal</p>
                </div>
                
                {/* Profile Widget linking to Settings */}
                <div 
                    onClick={() => setView('settings')}
                    className="bg-white p-2 pr-6 rounded-full border border-amber-100 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-amber-50 transition-colors ml-auto"
                    title="Edit Profile"
                >
                    <img src={getDirectLink(profile.photoUrl) || `https://ui-avatars.com/api/?name=${profile.name}&background=FDB813&color=3E2723`} className="w-10 h-10 rounded-full object-cover" />
                    <div className="hidden sm:block text-right">
                        <p className="text-[10px] font-black uppercase text-[#3E2723]">{profile.nickname || profile.name.split(' ')[0]}</p>
                        <p className="text-[8px] font-black text-amber-500 uppercase">{profile.specificTitle}</p>
                    </div>
                    <Settings2 size={16} className="text-gray-400"/>
                </div>
             </header>

             {view === 'home' && (
                <div className="space-y-10 animate-fadeIn flex-1">
                    {/* UPDATED PROFILE CARD (Digital ID) */}
                    <div className="bg-[#3E2723] rounded-[48px] p-8 text-white relative overflow-hidden shadow-2xl border-4 border-[#FDB813] mb-8">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
                            <img src={getDirectLink(profile.photoUrl) || `https://ui-avatars.com/api/?name=${profile.name}&background=FDB813&color=3E2723`} className="w-24 h-24 rounded-full object-cover border-4 border-white/20" />
                            <div>
                                <h3 className="font-serif text-2xl sm:text-3xl font-black uppercase leading-tight">{profile.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-mono opacity-80 tracking-widest">{profile.memberId}</span>
                                    <p className="text-white/90 font-bold text-lg uppercase tracking-wide">"{profile.nickname || 'Barista'}"</p>
                                </div>
                                <p className="text-[#FDB813] font-black text-sm uppercase mt-1">{profile.specificTitle || 'Member'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                             {/* Notices */}
                            <div className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm">
                                <h3 className="font-black text-sm uppercase text-[#3E2723] mb-4 flex items-center gap-2"><Bell size={16} className="text-amber-500"/> Notices</h3>
                                {announcements.length === 0 ? <p className="text-gray-400 text-xs text-center py-4">No new notices.</p> : announcements.slice(0, 2).map(ann => (
                                    <div key={ann.id} className="border-b last:border-0 border-gray-100 pb-2 mb-2">
                                        <p className="font-bold text-xs text-[#3E2723] uppercase">{ann.title}</p>
                                        <p className="text-[10px] text-gray-500 line-clamp-1">{ann.content}</p>
                                    </div>
                                ))}
                            </div>
                             {/* Upcoming Events */}
                            <div className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm">
                                <h3 className="font-black text-sm uppercase text-[#3E2723] mb-4 flex items-center gap-2"><Calendar size={16} className="text-amber-500"/> Upcoming</h3>
                                {events.length === 0 ? <p className="text-gray-400 text-xs text-center py-4">No upcoming events.</p> : events.slice(0, 2).map(ev => {
                                     const { day, month } = getEventDateParts(ev.startDate, ev.endDate);
                                     return (
                                        <div key={ev.id} className="flex items-center gap-4 mb-3">
                                            <div className="bg-amber-50 text-amber-800 w-10 h-10 rounded-lg flex flex-col items-center justify-center font-black leading-none shrink-0"><span className="text-xs">{day}</span><span className="text-[8px] uppercase">{month}</span></div>
                                            <div><p className="font-bold text-xs uppercase text-[#3E2723]">{ev.name}</p><p className="text-[10px] text-gray-500">{ev.venue}</p></div>
                                        </div>
                                     )
                                })}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[32px] border border-amber-100 h-full">
                            <h3 className="font-black text-sm uppercase text-[#3E2723] mb-4 flex items-center gap-2">
                                <Trophy size={16} className="text-amber-500"/> Trophy Case
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {DEFAULT_MASTERCLASS_MODULES.map(mod => {
                                    if (masterclassData.moduleAttendees?.[mod.id]?.includes(profile.memberId)) {
                                        const iconToUse = masterclassData.moduleDetails?.[mod.id]?.icon || "☕";
                                        // TITLE LOGIC: Split by colon and take first part
                                        const categoryTitle = mod.title.split(':')[0] || mod.title;
                                        
                                        return (
                                            <div key={`mc-${mod.id}`} className="flex flex-col items-center gap-1">
                                                <div title={`Completed: ${mod.title}`} className="w-full aspect-square bg-green-50 rounded-2xl flex flex-col items-center justify-center text-center p-1 border border-green-100">
                                                    <div className="text-2xl mb-1">{iconToUse}</div>
                                                    {/* INCREASED FONT SIZE */}
                                                    <span className="text-[9px] font-black uppercase text-green-800 text-center leading-tight line-clamp-2">{categoryTitle}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    </div>
                </div>
             )}

             {view === 'about' && (
                 <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
                     <div className="relative h-64 md:h-96 rounded-[48px] overflow-hidden group">
                         <img src={getDirectLink(legacyForm.imageUrl) || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085"} className="w-full h-full object-cover" style={legacyForm.imageSettings} />
                         {isAdmin && <button onClick={() => setIsEditingLegacy(true)} className="absolute top-4 right-4 bg-white/80 p-3 rounded-full hover:bg-white"><Pen size={20}/></button>}
                         <div className="absolute inset-0 bg-gradient-to-t from-[#3E2723] via-transparent to-transparent flex items-end p-8"><h2 className="text-4xl md:text-6xl font-black text-[#FDB813] uppercase tracking-tighter">Legacy Story</h2></div>
                     </div>
                     {isEditingLegacy ? (
                         <div className="bg-white p-8 rounded-[32px] border border-amber-100 space-y-4">
                             <textarea className="w-full p-4 border rounded-xl" rows="6" value={legacyForm.body} onChange={e => setLegacyForm({...legacyForm, body: e.target.value})} />
                             <input type="text" placeholder="Image URL" className="w-full p-3 border rounded-xl" value={legacyForm.imageUrl} onChange={e => setLegacyForm({...legacyForm, imageUrl: e.target.value})} />
                             <input type="date" className="w-full p-3 border rounded-xl" value={legacyForm.establishedDate} onChange={e => setLegacyForm({...legacyForm, establishedDate: e.target.value})} />
                             <div className="flex gap-2"><input type="date" className="p-2 border rounded" value={tempAchievement.date} onChange={e => setTempAchievement({...tempAchievement, date: e.target.value})} /><input type="text" placeholder="Achievement" className="flex-1 p-2 border rounded" value={tempAchievement.text} onChange={e => setTempAchievement({...tempAchievement, text: e.target.value})} /><button onClick={handleAddAchievement} className="p-2 bg-green-100 rounded">+</button></div>
                             <ul>{legacyForm.achievements.map((a, i) => (<li key={i} className="flex justify-between items-center p-2 border-b"><span>{a.date}: {a.text}</span><button onClick={() => handleRemoveAchievement(i)} className="text-red-500">x</button></li>))}</ul>
                             <button onClick={handleSaveLegacy} className="w-full bg-[#3E2723] text-white py-3 rounded-xl font-bold">Save Changes</button>
                         </div>
                     ) : (
                         <div className="prose prose-amber max-w-none"><p className="text-lg leading-relaxed whitespace-pre-wrap">{legacyContent.body}</p><div className="mt-12 border-l-4 border-[#FDB813] pl-8 space-y-8">{legacyContent.achievements?.map((a, i) => (<div key={i} className="relative"><div className="absolute -left-[41px] top-1 w-5 h-5 bg-[#3E2723] rounded-full border-4 border-[#FDFBF7]"></div><span className="text-sm font-black text-amber-600 uppercase tracking-widest">{formatDate(a.date)}</span><p className="text-xl font-bold mt-1">{a.text}</p></div>))}</div></div>
                     )}
                 </div>
             )}

             {view === 'masterclass' && (
                 <div className="space-y-8 animate-fadeIn">
                     <div className="flex justify-between items-end"><div className="space-y-2"><h2 className="text-4xl font-black uppercase text-[#3E2723]">Masterclass</h2><p className="text-amber-800 font-medium">Coffee Education Program</p></div><button onClick={() => setShowCertificate(true)} className="bg-[#FDB813] text-[#3E2723] px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-yellow-400 shadow-lg flex items-center gap-2"><Trophy size={18}/> My Certificate</button></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                         {DEFAULT_MASTERCLASS_MODULES.map(mod => {
                             const isCompleted = masterclassData.moduleAttendees?.[mod.id]?.includes(profile.memberId);
                             const title = mod.title.split(':')[0];
                             return (
                                 <div key={mod.id} className={`p-6 rounded-[32px] border-2 flex flex-col items-center text-center transition-all ${isCompleted ? 'bg-[#3E2723] border-[#3E2723] text-white shadow-xl' : 'bg-white border-amber-100 text-gray-400'}`}>
                                     <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 ${isCompleted ? 'bg-[#FDB813] text-[#3E2723]' : 'bg-gray-100 grayscale'}`}>{masterclassData.moduleDetails?.[mod.id]?.icon || "☕"}</div>
                                     <h4 className="font-black uppercase text-sm mb-2 h-10 flex items-center justify-center">{title}</h4>
                                     <p className="text-[10px] opacity-80 line-clamp-3">{masterclassData.moduleDetails?.[mod.id]?.objectives || "Module objectives pending..."}</p>
                                     {isCompleted ? <div className="mt-4 bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle size={10}/> Completed</div> : <div className="mt-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-gray-200">Locked</div>}
                                 </div>
                             );
                         })}
                     </div>
                     {isAdmin && (
                         <div className="bg-white p-8 rounded-[32px] border border-amber-100 mt-8">
                             <h3 className="font-black text-lg uppercase mb-4 text-[#3E2723]">Admin Controls</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <div>
                                     <label className="text-xs font-bold uppercase text-gray-400">Select Module</label>
                                     <div className="flex gap-2 mt-2">{DEFAULT_MASTERCLASS_MODULES.map(m => (<button key={m.id} onClick={() => setAdminMcModule(m.id)} className={`w-10 h-10 rounded-lg font-black ${adminMcModule === m.id ? 'bg-[#3E2723] text-white' : 'bg-gray-100 text-gray-500'}`}>{m.id}</button>))}</div>
                                     <div className="mt-4">
                                         <label className="text-xs font-bold uppercase text-gray-400">Add Attendees</label>
                                         <div className="flex gap-2 mt-2"><input type="text" placeholder="Search Member..." className="flex-1 p-3 border rounded-xl text-xs" value={adminMcSearch} onChange={e => setAdminMcSearch(e.target.value)} /><button onClick={handleBulkAddMasterclass} className="bg-green-600 text-white px-4 rounded-xl text-xs font-bold">Add Selected</button></div>
                                         <div className="mt-2 max-h-40 overflow-y-auto border rounded-xl p-2">{members.filter(m => m.name.toLowerCase().includes(adminMcSearch.toLowerCase())).slice(0, 10).map(m => (<div key={m.id} onClick={() => setSelectedMcMembers(prev => prev.includes(m.memberId) ? prev.filter(id => id !== m.memberId) : [...prev, m.memberId])} className={`p-2 text-xs cursor-pointer flex justify-between ${selectedMcMembers.includes(m.memberId) ? 'bg-green-50 text-green-700 font-bold' : ''}`}><span>{m.name}</span><span>{m.memberId}</span></div>))}</div>
                                     </div>
                                 </div>
                                 <div className="space-y-4">
                                     <div><label className="text-xs font-bold uppercase text-gray-400">Module Icon (Emoji)</label><input type="text" className="w-full p-3 border rounded-xl mt-1" value={tempMcDetails.icon} onChange={e => setTempMcDetails({...tempMcDetails, icon: e.target.value})} /></div>
                                     <div><label className="text-xs font-bold uppercase text-gray-400">Objectives</label><textarea className="w-full p-3 border rounded-xl mt-1" rows="3" value={tempMcDetails.objectives} onChange={e => setTempMcDetails({...tempMcDetails, objectives: e.target.value})} /></div>
                                     <button onClick={handleSaveMcCurriculum} className="w-full bg-[#3E2723] text-white py-3 rounded-xl font-bold uppercase text-xs">Update Curriculum</button>
                                 </div>
                             </div>
                         </div>
                     )}
                 </div>
             )}

             {view === 'team' && (
                 <div className="space-y-12 animate-fadeIn text-center">
                     <div className="space-y-2"><h2 className="text-4xl font-black uppercase text-[#3E2723]">The Brew Crew</h2><p className="text-amber-800 font-medium">Meet the team behind the beans.</p></div>
                     <div className="flex justify-center flex-wrap gap-8">
                         {teamStructure.tier1.map(m => (<div key={m.id} className="flex flex-col items-center"><img src={getDirectLink(m.photoUrl) || `https://ui-avatars.com/api/?name=${m.name}`} className="w-32 h-32 rounded-full object-cover border-4 border-[#FDB813] mb-4 shadow-xl"/><h3 className="font-black text-xl text-[#3E2723] uppercase">{m.name}</h3><p className="text-amber-600 font-bold text-sm uppercase tracking-widest">{m.specificTitle}</p></div>))}
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                         {teamStructure.tier3.map(m => (<div key={m.id} className="flex flex-col items-center"><div className="w-24 h-24 rounded-full bg-white mb-3 flex items-center justify-center text-2xl font-black text-amber-200 border-2 border-amber-100 overflow-hidden"><img src={getDirectLink(m.photoUrl)} className="w-full h-full object-cover"/></div><h4 className="font-bold text-sm text-gray-800 uppercase text-center leading-tight">{m.name}</h4><p className="text-[10px] text-gray-500 font-black uppercase mt-1">{m.specificTitle}</p></div>))}
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                         {/* Corrected Committee List Rendering based on COMMITTEES_INFO */}
                         {COMMITTEES_INFO.map(comm => {
                             // Match members whose specific title includes the committee name (e.g., "Committee Member - Arts")
                             // This is a simple string match. Ensure your data follows this convention.
                             const heads = teamStructure.committees[comm.id].heads;
                             const members = teamStructure.committees[comm.id].members;
                             
                             // Show committee card even if empty to show structure, or hide if preferred. Showing for now.
                             return (
                                 <div key={comm.id} className="bg-white p-6 rounded-[32px] border border-amber-50">
                                     <h5 className="font-black text-[#3E2723] uppercase mb-4 border-b pb-2 border-amber-100">{comm.title}</h5>
                                     {heads.length > 0 && heads.map(h => (<div key={h.id} className="flex items-center gap-3 mb-4"><img src={getDirectLink(h.photoUrl) || `https://ui-avatars.com/api/?name=${h.name}`} className="w-10 h-10 rounded-full object-cover border-2 border-[#FDB813]"/><div><p className="font-bold text-xs uppercase">{h.name}</p><span className="text-[9px] bg-[#3E2723] text-white px-2 py-0.5 rounded-full">HEAD</span></div></div>))}
                                     {members.length > 0 ? (
                                        <ul className="space-y-2">{members.map(m => (<li key={m.id} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-100">{m.name}</li>))}</ul>
                                     ) : (
                                        <p className="text-[10px] text-gray-400 italic">Recruiting members...</p>
                                     )}
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             )}

             {view === 'events' && (
                 <div className="space-y-8 animate-fadeIn">
                     <div className="flex justify-between items-center"><h2 className="text-4xl font-black uppercase text-[#3E2723]">What's Brewing?</h2>{isAdmin && <button onClick={() => { setEditingEvent(null); setNewEvent({ name: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', description: '', attendanceRequired: false, evaluationLink: '', isVolunteer: false, registrationRequired: true, openForAll: true, volunteerTarget: { officer: 0, committee: 0, member: 0 }, shifts: [], masterclassModuleIds: [], scheduleType: 'WHOLE_DAY' }); setShowEventForm(true); }} className="bg-[#3E2723] text-white p-3 rounded-xl hover:bg-black"><Plus size={20}/></button>}</div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {events.length === 0 ? <p className="col-span-full text-center text-gray-400 py-10">No upcoming events.</p> : events.map(ev => (
                             <div key={ev.id} className="bg-white rounded-[32px] overflow-hidden border border-amber-100 shadow-sm hover:shadow-lg transition-all group relative flex flex-col">
                                 <div className="bg-[#3E2723] p-6 text-white relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10"><Calendar size={100}/></div><span className="bg-[#FDB813] text-[#3E2723] text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">{ev.venue}</span><h3 className="font-serif text-2xl font-black uppercase mt-2 leading-none mb-1">{ev.name}</h3><p className="text-amber-200 text-xs font-medium uppercase tracking-wide">{formatDate(ev.startDate)} • {ev.startTime}</p></div>
                                 <div className="p-6 flex-1 flex flex-col">
                                     <p className="text-gray-500 text-xs leading-relaxed mb-6 line-clamp-3">{ev.description}</p>
                                     {ev.isVolunteer ? (
                                         <div className="mt-auto space-y-2">
                                             <p className="text-[10px] font-black uppercase text-amber-800">Volunteer Shifts</p>
                                             {ev.shifts?.map(shift => {
                                                 const isVol = shift.volunteers?.includes(profile.memberId);
                                                 const isFull = (shift.volunteers?.length || 0) >= shift.capacity;
                                                 return (
                                                     <button key={shift.id} onClick={() => handleVolunteerSignup(ev, shift.id)} disabled={!isVol && isFull} className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex justify-between items-center transition-colors ${isVol ? 'bg-green-100 text-green-700' : isFull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}><span>{shift.session}</span><span>{isVol ? 'Joined' : isFull ? 'Full' : `${shift.volunteers?.length || 0}/${shift.capacity}`}</span></button>
                                                 );
                                             })}
                                         </div>
                                     ) : (
                                         <button onClick={() => handleRegisterEvent(ev)} className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-widest mt-auto transition-colors ${ev.registered?.includes(profile.memberId) ? 'bg-green-100 text-green-700' : 'bg-[#3E2723] text-white hover:bg-black'}`}>{ev.registered?.includes(profile.memberId) ? 'Registered' : 'Join Event'}</button>
                                     )}
                                     {isAdmin && (
                                         <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                             <button onClick={() => setAttendanceEvent(ev)} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-100">Attendance</button>
                                             <button onClick={() => handleEditEvent(ev)} className="p-2 text-gray-400 hover:text-amber-600"><Pen size={14}/></button>
                                             <button onClick={() => handleDeleteEvent(ev.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={14}/></button>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {view === 'announcements' && (
                 <div className="space-y-8 animate-fadeIn max-w-3xl mx-auto">
                     <div className="flex justify-between items-center"><h2 className="text-4xl font-black uppercase text-[#3E2723]">Grind Report</h2>{isAdmin && <button onClick={() => { setEditingAnnouncement(null); setNewAnnouncement({ title: '', content: '' }); setShowAnnounceForm(true); }} className="bg-[#3E2723] text-white p-3 rounded-xl hover:bg-black"><Plus size={20}/></button>}</div>
                     <div className="space-y-6">
                         {announcements.map(ann => (
                             <div key={ann.id} className="bg-white p-8 rounded-[40px] border border-amber-100 relative group">
                                 <div className="absolute top-8 right-8 text-amber-200 opacity-20"><Bell size={64}/></div>
                                 <span className="text-[10px] font-black bg-amber-50 text-amber-800 px-3 py-1 rounded-full uppercase tracking-widest">{formatDate(ann.date)}</span>
                                 <h3 className="font-serif text-2xl font-black text-[#3E2723] mt-4 mb-2 uppercase">{ann.title}</h3>
                                 <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                                 {isAdmin && <div className="flex gap-2 mt-6 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEditAnnouncement(ann)} className="text-xs font-bold text-amber-600 hover:underline">Edit</button><button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-xs font-bold text-red-500 hover:underline">Delete</button></div>}
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {view === 'members_corner' && (
                <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto flex-1">
                   <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-black uppercase text-[#3E2723]">Member's Corner</h2><button onClick={() => setShowPollForm(true)} className="bg-[#3E2723] text-white p-2 rounded-lg text-xs font-bold uppercase hover:bg-black">+ Poll</button></div>
                   <div className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm"><h3 className="font-bold text-sm uppercase text-gray-500 mb-4">Suggestion Box</h3><textarea className="w-full p-4 border border-gray-200 rounded-xl text-xs mb-3 bg-gray-50 focus:bg-white transition-colors" rows="3" placeholder="Share your thoughts anonymously..." value={suggestionText} onChange={e => setSuggestionText(e.target.value)} /><button onClick={handlePostSuggestion} className="w-full bg-amber-500 text-white py-3 rounded-xl font-black uppercase text-xs hover:bg-amber-600">Drop Suggestion</button></div>
                   <div className="space-y-4">
                       {polls.map(poll => (
                           <div key={poll.id} className="bg-white p-6 rounded-[32px] border border-amber-50 relative"><div className="flex justify-between items-start mb-4"><h4 className="font-bold text-[#3E2723]">{poll.question}</h4>{isAdmin && <button onClick={() => handleDeletePoll(poll.id)} className="text-gray-300 hover:text-red-500"><X size={14}/></button>}</div><div className="space-y-2">{poll.options.map(opt => { const totalVotes = poll.options.reduce((acc, o) => acc + o.votes.length, 0); const percent = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100); const hasVoted = opt.votes.includes(profile.memberId); return (<div key={opt.id} onClick={() => handleVotePoll(poll.id, opt.id)} className={`relative p-3 rounded-xl border cursor-pointer overflow-hidden ${hasVoted ? 'border-amber-500 bg-amber-50' : 'border-gray-100 hover:border-amber-200'}`}><div className="absolute inset-0 bg-amber-100 opacity-20 transition-all duration-500" style={{ width: `${percent}%` }}></div><div className="relative flex justify-between items-center text-xs"><span className={`font-bold ${hasVoted ? 'text-amber-900' : 'text-gray-600'}`}>{opt.text}</span><span className="font-mono text-gray-400">{percent}%</span></div></div>); })}</div><p className="text-[9px] text-gray-400 mt-4 text-right">Posted by {poll.createdBy} • {poll.options.reduce((acc, o) => acc + o.votes.length, 0)} votes</p></div>
                       ))}
                   </div>
                   {showPollForm && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"><div className="bg-white rounded-[32px] p-8 max-w-sm w-full border-b-[8px] border-[#3E2723]"><h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Create New Poll</h3><div className="space-y-4"><input type="text" placeholder="Question" className="w-full p-3 border rounded-xl text-xs font-bold" value={newPoll.question} onChange={e => setNewPoll({...newPoll, question: e.target.value})} /><div className="space-y-2 max-h-40 overflow-y-auto">{newPoll.options.map((opt, idx) => (<input key={idx} type="text" placeholder={`Option ${idx + 1}`} className="w-full p-3 border rounded-xl text-xs" value={opt} onChange={e => handlePollOptionChange(idx, e.target.value)} />))}<button onClick={handleAddPollOption} className="text-xs text-amber-600 font-bold hover:underline">+ Add Option</button></div><div className="flex gap-3 pt-2"><button onClick={() => setShowPollForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button><button onClick={handleCreatePoll} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">Post Poll</button></div></div></div></div>}
                </div>
             )}

             {view === 'series' && (
                <div className="space-y-8 animate-fadeIn flex-1">
                     <div className="flex justify-between items-center"><h2 className="text-4xl font-black uppercase text-[#3E2723]">Barista Diaries</h2>{(isAdmin || isOfficer) && <button onClick={() => { setEditingSeries(null); setNewSeriesPost({ title: '', imageUrl: '', caption: '' }); setShowSeriesForm(true); }} className="bg-[#3E2723] text-white p-3 rounded-xl hover:bg-black"><Plus size={20}/></button>}</div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                         {seriesPosts.length === 0 ? <p className="col-span-full text-center text-gray-400">No stories yet.</p> : seriesPosts.map(post => (
                                 <div key={post.id} className="bg-white rounded-[32px] overflow-hidden border border-amber-100 shadow-sm hover:shadow-lg transition-shadow group relative">
                                     <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">{(isAdmin || isOfficer) && <button onClick={() => handleEditSeries(post)} className="bg-white/80 p-2 rounded-full text-amber-600 hover:text-amber-800"><Pen size={16}/></button>}{(isAdmin || isOfficer) && <button onClick={() => handleDeleteSeries(post.id)} className="bg-white/80 p-2 rounded-full text-red-500 hover:text-red-700"><Trash2 size={16}/></button>}</div>
                                     <div className="h-64 bg-gray-100 relative group/image">{post.images && post.images.length > 1 && (<div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 z-20"><ImageIcon size={12}/> {post.images.length}</div>)}<img src={getDirectLink(post.imageUrl || (post.images ? post.images[0] : ''))} alt={post.title} className="w-full h-full object-cover" /></div>
                                     <div className="p-6"><h4 className="font-bold text-[#3E2723] uppercase mb-2">{post.title}</h4><p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{post.caption}</p><div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase"><span>{post.author}</span><span>{formatDate(post.createdAt?.toDate ? post.createdAt.toDate() : new Date())}</span></div></div>
                                 </div>
                             ))
                         }
                    </div>
                </div>
             )}

             {view === 'committee_hunt' && (
                 <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
                     <div className="text-center space-y-2"><h2 className="text-4xl font-black uppercase text-[#3E2723]">Committee Hunt</h2><p className="text-amber-800 font-medium">Join the team and brew your legacy.</p></div>
                     {isOfficer ? (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {['pending', 'for_interview', 'accepted', 'denied'].map(status => (
                                 <div key={status} className="bg-white p-4 rounded-3xl border border-gray-100"><h4 className="font-black text-xs uppercase text-gray-400 mb-4">{status.replace('_', ' ')}</h4><div className="space-y-3">{committeeApps.filter(a => a.status === status).map(app => (<div key={app.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200"><div className="flex justify-between items-start mb-2"><span className="font-bold text-xs text-[#3E2723]">{app.name}</span><button onClick={() => handleDeleteApp(app.id)} className="text-gray-300 hover:text-red-500"><X size={12}/></button></div><p className="text-[10px] text-gray-500 uppercase font-black mb-2">{app.committee}</p><div className="flex gap-1 flex-wrap">{status === 'pending' && <button onClick={() => initiateAppAction(app, 'for_interview')} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[9px] font-bold">Interview</button>}{status !== 'accepted' && <button onClick={() => initiateAppAction(app, 'accepted')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-[9px] font-bold">Accept</button>}{status !== 'denied' && <button onClick={() => initiateAppAction(app, 'denied')} className="px-2 py-1 bg-red-100 text-red-700 rounded text-[9px] font-bold">Deny</button>}</div></div>))}</div></div>
                             ))}
                         </div>
                     ) : (
                         <div className="bg-white p-8 rounded-[48px] border-4 border-amber-50 text-center">
                             {userApplications.length > 0 ? (
                                 <div className="space-y-4 max-w-md mx-auto"><h3 className="font-bold text-xl text-[#3E2723]">Application Status</h3>{userApplications.map(app => (<div key={app.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-200"><p className="font-black text-amber-600 uppercase tracking-widest text-xs mb-2">{app.committee}</p><div className="text-2xl font-black uppercase mb-2">{app.status.replace('_', ' ')}</div><p className="text-xs text-gray-500">Last update: {formatDate(app.statusUpdatedAt?.toDate())}</p></div>))}</div>
                             ) : (
                                 <div className="space-y-6">
                                     <p className="text-gray-600 max-w-lg mx-auto">Select a committee to apply for. Please ensure your profile is up to date.</p>
                                     <div className="flex justify-center gap-4 flex-wrap">
                                         {COMMITTEES_INFO.map(comm => (
                                             <button key={comm.id} onClick={(e) => { setCommitteeForm({role: 'Committee Member'}); handleApplyCommittee(e, comm.id); }} disabled={submittingApp} className="px-6 py-3 bg-[#3E2723] text-white rounded-xl font-bold uppercase text-xs hover:bg-amber-600 disabled:opacity-50">{comm.title}</button>
                                         ))}
                                     </div>
                                 </div>
                             )}
                         </div>
                     )}
                 </div>
             )}
             
             {view === 'reports' && isAdmin && (
                 <div className="space-y-8 animate-fadeIn">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="bg-white p-6 rounded-[32px] border border-green-100"><p className="text-[10px] font-black uppercase text-gray-400">Total Paid</p><p className="text-3xl font-black text-green-600">{financialStats.totalPaid}</p></div>
                         <div className="bg-white p-6 rounded-[32px] border border-blue-100"><p className="text-[10px] font-black uppercase text-gray-400">GCash</p><p className="text-3xl font-black text-blue-600">{financialStats.gcashCount}</p></div>
                         <div className="bg-white p-6 rounded-[32px] border border-amber-100"><p className="text-[10px] font-black uppercase text-gray-400">Cash</p><p className="text-3xl font-black text-amber-600">{financialStats.cashCount}</p></div>
                         <div className="bg-white p-6 rounded-[32px] border border-purple-100"><p className="text-[10px] font-black uppercase text-gray-400">Exempt</p><p className="text-3xl font-black text-purple-600">{financialStats.exemptCount}</p></div>
                     </div>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <div className="bg-white p-8 rounded-[32px] border border-gray-100">
                             <h3 className="font-bold text-[#3E2723] uppercase mb-4 flex items-center gap-2"><FileText size={16}/> System Logs</h3>
                             <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">{logs.map((log, i) => (<div key={i} className="text-xs p-2 hover:bg-gray-50 rounded border-b border-gray-50 flex justify-between"><span className="font-mono text-gray-400">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : ''}</span><span className="font-bold text-gray-700">{log.action}</span><span className="text-gray-500 truncate max-w-[100px]">{log.actor}</span></div>))}</div>
                         </div>
                         <div className="bg-white p-8 rounded-[32px] border border-gray-100 space-y-4">
                             <h3 className="font-bold text-[#3E2723] uppercase mb-4 flex items-center gap-2"><Layers size={16}/> Operations</h3>
                             <div className="grid grid-cols-2 gap-2">
                                 <button onClick={handleToggleRegistration} className={`p-3 rounded-xl text-xs font-bold uppercase ${hubSettings.registrationOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{hubSettings.registrationOpen ? 'Reg Open' : 'Reg Closed'}</button>
                                 <button onClick={handleToggleMaintenance} className={`p-3 rounded-xl text-xs font-bold uppercase ${hubSettings.maintenanceMode ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Maintenance</button>
                                 <button onClick={handleRotateSecurityKeys} className="p-3 rounded-xl bg-gray-800 text-white text-xs font-bold uppercase">Rotate Keys</button>
                                 <button onClick={handleSanitizeDatabase} className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold uppercase border border-red-100">Sanitize DB</button>
                                 <button onClick={handleDownloadFinancials} className="p-3 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold uppercase">Export Finance</button>
                                 <button onClick={handleDownloadSuggestions} className="p-3 rounded-xl bg-amber-50 text-amber-600 text-xs font-bold uppercase">Export Ideas</button>
                                 <button onClick={handleToggleIdLaceIssuing} className={`p-3 rounded-xl text-xs font-bold uppercase ${hubSettings.idLaceReady ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>{hubSettings.idLaceReady ? 'ID Lace Ready' : 'ID Lace Pending'}</button>
                             </div>
                             <div className="pt-4 border-t border-gray-100"><label className="text-[10px] font-bold uppercase text-gray-400">Update GCash</label><div className="flex gap-2 mt-1"><input type="text" className="flex-1 p-2 border rounded-lg text-xs" placeholder="09xxxxxxxxx" value={newGcashNumber} onChange={e => setNewGcashNumber(e.target.value)} /><button onClick={handleUpdateGcashNumber} className="bg-[#3E2723] text-white px-4 rounded-lg text-xs font-bold">Save</button></div></div>
                         </div>
                     </div>
                     <div className="bg-[#3E2723] p-10 rounded-[50px] border-4 border-[#FDB813] text-white shadow-xl">
                        <h4 className="font-serif text-2xl font-black uppercase mb-6 text-[#FDB813]">Security Vault</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between p-4 bg-white/5 rounded-2xl"><span className="text-[10px] font-black uppercase">Officer Key</span><span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.officerKey || "N/A"}</span></div>
                            <div className="flex justify-between p-4 bg-white/5 rounded-2xl"><span className="text-[10px] font-black uppercase">Head Key</span><span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.headKey || "N/A"}</span></div>
                            <div className="flex justify-between p-4 bg-white/5 rounded-2xl"><span className="text-[10px] font-black uppercase">Comm Key</span><span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.commKey || "N/A"}</span></div>
                            <div className="flex justify-between p-4 bg-white/5 rounded-2xl"><span className="text-[10px] font-black uppercase">Exempt Key</span><span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.exemptKey || "N/A"}</span></div>
                        </div>
                     </div>
                     
                     <div className="bg-white p-8 rounded-[40px] border-2 border-orange-100 shadow-sm">
                        <h4 className="font-black uppercase text-sm mb-4 flex items-center gap-2"><RefreshCcw size={16}/> Manual Renewal</h4>
                        <div className="grid grid-cols-2 gap-4 items-center">
                             <div className="text-xs text-gray-500">
                                 <p className="mb-2">Force renew current user (Debugging)</p>
                                 <p className="font-mono bg-gray-100 p-1 rounded inline-block">{currentDailyKey}</p>
                             </div>
                             <div className="flex flex-col gap-2">
                                <button onClick={handleMigrateToRenewal} className="p-3 bg-orange-100 text-orange-800 rounded-xl text-xs font-bold uppercase hover:bg-orange-200">Set All To Renewal</button>
                             </div>
                        </div>
                     </div>
                 </div>
             )}
             
             {view === 'members' && isOfficer && (
                 <div className="space-y-6 animate-fadeIn text-[#3E2723] flex-1">
                      <div className="flex flex-col md:flex-row gap-4 justify-between items-center"><div className="relative w-full md:w-96"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input type="text" placeholder="Search members..." className="w-full pl-12 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-[#FDB813] outline-none text-sm font-bold bg-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/></div><div className="flex gap-2"><button onClick={toggleSelectAll} className="bg-white p-3 rounded-xl text-gray-500 hover:text-[#3E2723] font-bold text-xs shadow-sm uppercase">{selectedBaristas.length === paginatedRegistry.length ? "Deselect All" : "Select Page"}</button><button onClick={handleBulkEmail} className="bg-[#3E2723] text-white px-6 py-3 rounded-xl font-black uppercase text-xs shadow-lg flex items-center gap-2"><Mail size={16}/> Email Selected</button></div></div>
                      <div className="bg-white p-6 rounded-[40px] border border-amber-100 overflow-hidden shadow-sm">
                          <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="border-b border-gray-100 text-gray-400 text-[10px] uppercase tracking-wider"><th className="p-4 w-10"></th><th className="p-4 cursor-pointer hover:text-[#3E2723]" onClick={() => setSortConfig({ key: 'name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>Name</th><th className="p-4 cursor-pointer hover:text-[#3E2723]" onClick={() => setSortConfig({ key: 'memberId', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>ID</th><th className="p-4">Position</th><th className="p-4">Status</th><th className="p-4 text-center">ID Lace</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="text-xs font-bold text-gray-700">{paginatedRegistry.map(m => (<tr key={m.memberId} className="hover:bg-amber-50/50 transition-colors border-b border-gray-50 last:border-0"><td className="p-4"><input type="checkbox" checked={selectedBaristas.includes(m.memberId)} onChange={() => toggleSelectBarista(m.memberId)} className="rounded text-[#3E2723] focus:ring-[#FDB813]"/></td><td className="p-4">{m.name}</td><td className="p-4 font-mono text-gray-500">{m.memberId}</td><td className="p-4">{m.specificTitle}</td><td className="p-4"><span onClick={() => isAdmin && handleToggleStatus(m.memberId, m.status)} className={`px-2 py-1 rounded-full text-[9px] uppercase tracking-widest cursor-pointer ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.status}</span></td><td className="p-4 text-center"><button onClick={() => isAdmin && handleToggleIdLaceReceived(m.memberId, m.idLaceReceived)} className={`p-1 rounded-full ${m.idLaceReceived ? 'text-green-600 bg-green-100' : 'text-gray-300 bg-gray-100'}`} title={m.idLaceReceived ? "Received" : "Not Received"}><CheckCircle2 size={16}/></button></td><td className="p-4 text-right flex justify-end gap-2">{isAdmin && <><button onClick={() => { setEditMemberForm({ joinedDate: m.joinedDate ? new Date(m.joinedDate).toISOString().split('T')[0] : '' }); setEditingMember(m); }} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600"><Pen size={14}/></button><button onClick={() => setShowAccoladeModal({...m, currentAccolades: m.accolades || []})} className="p-2 bg-yellow-100 rounded-lg hover:bg-yellow-200 text-yellow-700"><Trophy size={14}/></button><button onClick={() => handleResetPassword(m.memberId, m.email, m.name)} className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 text-blue-700"><RefreshCcw size={14}/></button><button onClick={() => initiateRemoveMember(m.memberId, m.name)} className="p-2 bg-red-100 rounded-lg hover:bg-red-200 text-red-700"><Trash2 size={14}/></button></>}</td></tr>))}</tbody></table></div>
                          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50"><span className="text-xs text-gray-400 font-bold uppercase">Page {currentPage} of {totalPages}</span><div className="flex gap-2"><button onClick={prevPage} disabled={currentPage === 1} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold uppercase disabled:opacity-50">Prev</button><button onClick={nextPage} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold uppercase disabled:opacity-50">Next</button></div></div>
                          <div className="mt-6 flex justify-end gap-2 items-center text-[10px] font-bold text-gray-400 uppercase"><span>Import CSV:</span><input type="file" ref={fileInputRef} onChange={handleBulkImportCSV} accept=".csv" className="hidden"/><button onClick={() => fileInputRef.current?.click()} className="text-amber-600 hover:underline">{isImporting ? 'Importing...' : 'Select File'}</button><span>|</span><button onClick={downloadImportTemplate} className="hover:text-[#3E2723]">Template</button><button onClick={() => alert("Bulk Import Guide:\n1. CSV Headers: Name, Email, Program, PositionCategory, SpecificTitle\n2. Default Password: 'LBA' + Last 5 digits of generated Member ID.\n3. Example: LBA24-20001 -> Password: LBA20001")} className="text-gray-400 hover:text-amber-600"><Info size={14}/></button></div>
                      </div>
                 </div>
             )}

             {view === 'daily_grind' && (isOfficer || isCommitteeHead) && (
                 <div className="space-y-8 animate-fadeIn">
                    <div className="flex justify-between items-center"><h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">The Task Bar</h3><button onClick={() => { setEditingProject(null); setNewProject({ title: '', description: '', deadline: '', projectHeadId: '', projectHeadName: '' }); setShowProjectForm(true); }} className="bg-[#3E2723] text-white p-3 rounded-xl hover:bg-black"><Plus size={20}/></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(proj => {
                            const isExpanded = expandedProjectId === proj.id;
                            const projectTasks = tasks.filter(t => t.projectId === proj.id);
                            const completedCount = projectTasks.filter(t => t.status === 'served').length;
                            const totalCount = projectTasks.length;
                            const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
                            return (
                                <div key={proj.id} className={`bg-white rounded-[32px] border transition-all ${isExpanded ? 'col-span-full border-[#3E2723] shadow-xl' : 'border-amber-100 shadow-sm hover:shadow-md'}`}>
                                    <div className="p-6 cursor-pointer" onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}><div className="flex justify-between items-start mb-4"><div><h4 className="font-black text-lg text-[#3E2723] uppercase leading-tight">{proj.title}</h4><p className="text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1"><UserCheck size={12}/> Head: {proj.projectHeadName || 'Unassigned'}</p></div><div className="text-right"><span className={`text-[9px] font-black px-2 py-1 rounded-full ${progress === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{progress}% Done</span><p className="text-[9px] text-gray-400 mt-1">{completedCount}/{totalCount} Tasks</p></div></div><div className="w-full bg-gray-100 rounded-full h-1.5 mb-4"><div className="bg-[#3E2723] h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div><div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-500 flex items-center gap-1"><Clock size={12}/> Due: {new Date(proj.deadline).toLocaleDateString()}</span><button className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-1 hover:underline">{isExpanded ? 'Close Board' : 'Open Board'} <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}/></button></div></div>
                                    {isExpanded && (
                                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-[32px] animate-fadeIn">
                                            <div className="flex justify-between items-center mb-6">
                                                <p className="text-xs text-gray-500 max-w-2xl italic">{proj.description}</p>
                                                <div className="flex gap-2">
                                                    {(canManageProjects || profile.memberId === proj.projectHeadId) && <button onClick={(e) => { e.stopPropagation(); setEditingProject(proj); setNewProject({ title: proj.title, description: proj.description, deadline: proj.deadline, projectHeadId: proj.projectHeadId, projectHeadName: proj.projectHeadName }); setShowProjectForm(true); }} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-gray-200">Edit Project</button>}
                                                    {(canManageProjects || profile.memberId === proj.projectHeadId) && <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }} className="bg-red-100 text-red-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-200">Delete</button>}
                                                    {(canManageProjects || profile.memberId === proj.projectHeadId) && <button onClick={(e) => { e.stopPropagation(); setEditingTask(null); setNewTask({ title: '', description: '', deadline: '', link: '', status: 'pending', notes: '', projectId: proj.id, assigneeId: '', assigneeName: '', outputLink: '', outputCaption: '' }); setShowTaskForm(true); }} className="bg-white border border-amber-200 text-[#3E2723] px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-amber-50">+ Add Task</button>}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{['pending', 'brewing', 'served'].map(status => (<div key={status} className="bg-white/50 p-3 rounded-2xl border border-gray-200"><h5 className="font-black uppercase text-[10px] text-gray-400 mb-3 flex items-center gap-2">{status === 'pending' ? <Coffee size={12}/> : status === 'brewing' ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle size={12}/>}{status === 'pending' ? 'To Roast' : status === 'brewing' ? 'Brewing' : 'Served'}</h5><div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">{projectTasks.filter(t => t.status === status).map(task => (<div key={task.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-amber-200 group"><div className="flex justify-between items-start mb-1"><div className="flex flex-col"><span className="font-bold text-xs text-[#3E2723]">{task.title}</span>{task.assigneeName && <span className="text-[8px] text-gray-500 font-bold uppercase mt-0.5 flex items-center gap-1"><User size={8}/> {task.assigneeName}</span>}</div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEditTask(task)} className="text-amber-500"><Pen size={10}/></button><button onClick={() => handleDeleteTask(task.id)} className="text-red-400"><Trash2 size={10}/></button></div></div>{task.link && <a href={task.link} target="_blank" className="text-[9px] text-blue-500 hover:underline flex items-center gap-1 mb-1"><Link2 size={8}/> Ref Link</a>}{task.outputLink && <a href={task.outputLink} target="_blank" className="text-[9px] text-green-600 hover:underline flex items-center gap-1 mb-1 font-bold"><Link size={8}/> Output Submitted</a>}{task.notes && <div className="bg-amber-50 p-1.5 rounded text-[8px] text-amber-900 mb-2 italic">"{task.notes}"</div>}<div className="flex gap-1 border-t border-gray-50 pt-1">{status !== 'pending' && <button onClick={() => handleUpdateTaskStatus(task.id, 'pending')} className="flex-1 bg-gray-100 text-[8px] rounded py-1 hover:bg-gray-200">←</button>}{status !== 'brewing' && <button onClick={() => handleUpdateTaskStatus(task.id, 'brewing')} className="flex-1 bg-amber-50 text-[8px] rounded py-1 hover:bg-amber-100 text-amber-700">Brew</button>}{status !== 'served' && <button onClick={() => handleUpdateTaskStatus(task.id, 'served')} className="flex-1 bg-green-50 text-[8px] rounded py-1 hover:bg-green-100 text-green-700">✓</button>}</div></div>))}</div></div>))}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                 </div>
            )}

            {view === 'settings' && (
                  <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
                      <div className="flex items-center gap-4 mb-8">
                          <div className="p-4 bg-amber-100 text-amber-700 rounded-2xl"><Settings2 size={32} /></div>
                          <div><h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Settings</h3><p className="text-gray-500 font-bold text-xs uppercase">Manage your barista profile</p></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-white p-8 rounded-[40px] border-2 border-amber-100 shadow-sm">
                              <h4 className="font-black text-lg uppercase text-[#3E2723] mb-6 flex items-center gap-2"><User size={20} className="text-amber-500"/> Personal Details</h4>
                              <form onSubmit={handleUpdateProfile} className="space-y-4">
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Full Name</label><input type="text" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm uppercase" value={settingsForm.name || ''} onChange={e => setSettingsForm({...settingsForm, name: e.target.value.toUpperCase()})} placeholder="LAST, FIRST MI." /></div>
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nickname / Display Name</label><input type="text" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={settingsForm.nickname || ''} onChange={e => setSettingsForm({...settingsForm, nickname: e.target.value})} placeholder="How should we call you?" /></div>
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email Address</label><input type="email" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={settingsForm.email || ''} onChange={e => setSettingsForm({...settingsForm, email: e.target.value})} placeholder="email@example.com" /></div>
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Profile Photo URL</label><input type="text" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={settingsForm.photoUrl || ''} onChange={e => setSettingsForm({...settingsForm, photoUrl: e.target.value})} placeholder="https://..." /><p className="text-[9px] text-gray-400 mt-1 ml-1">Paste a direct link to an image (Google Drive/Photos links supported).</p></div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Birth Month</label><select className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={settingsForm.birthMonth || ''} onChange={e => setSettingsForm({...settingsForm, birthMonth: e.target.value})}><option value="">Month</option>{MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
                                      <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Birth Day</label><input type="number" min="1" max="31" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={settingsForm.birthDay || ''} onChange={e => setSettingsForm({...settingsForm, birthDay: e.target.value})} /></div>
                                  </div>
                                  <div className="pt-4"><button type="submit" disabled={savingSettings} className="w-full py-4 bg-[#3E2723] text-[#FDB813] rounded-2xl font-black uppercase text-xs hover:bg-black transition-colors disabled:opacity-50">{savingSettings ? "Saving..." : "Update Profile"}</button></div>
                              </form>
                          </div>
                          <div className="bg-white p-8 rounded-[40px] border-2 border-amber-100 shadow-sm">
                              <h4 className="font-black text-lg uppercase text-[#3E2723] mb-6 flex items-center gap-2"><Lock size={20} className="text-red-500"/> Security</h4>
                              <form onSubmit={handleChangePassword} className="space-y-4">
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Current Password</label><input type="password" required className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} /></div>
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">New Password</label><input type="password" required className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} /></div>
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Confirm New Password</label><input type="password" required className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} /></div>
                                  <div className="pt-4"><button type="submit" className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-xs hover:bg-red-600 transition-colors">Change Password</button></div>
                              </form>
                          </div>
                      </div>
                      <div className="bg-[#3E2723] p-8 rounded-[40px] text-white/50 text-center text-xs"><p>Member ID: <span className="font-mono text-white font-bold">{profile.memberId}</span></p><p className="mt-2">Need help with your account? Contact the PR Committee.</p></div>
                  </div>
              )}

             <div className="mt-auto pt-8"><DataPrivacyFooter /></div>
          </main>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => { try { return JSON.parse(localStorage.getItem('lba_profile')); } catch (e) { return null; } });
  const [authError, setAuthError] = useState('');
  useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => { setUser(u); }); return () => unsub(); }, []);
  const handleLoginSuccess = (userProfile) => { setProfile(userProfile); setAuthError(''); };
  const handleLogout = async () => { await signOut(auth); setProfile(null); localStorage.removeItem('lba_profile'); };
  if (!profile) { return <Login user={user} onLoginSuccess={handleLoginSuccess} initialError={authError} />; }
  return <Dashboard user={user} profile={profile} setProfile={setProfile} logout={handleLogout} />;
}
