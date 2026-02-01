import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, signOut
} from 'firebase/auth';
import { 
  getFirestore, collection, query, where, onSnapshot, doc, setDoc, 
  updateDoc, addDoc, serverTimestamp, getDocs, limit, deleteDoc, 
  orderBy, writeBatch, arrayUnion, arrayRemove
} from 'firebase/firestore'; 
import { 
  Users, Calendar, Award, Bell, LogOut, UserCircle, BarChart3, Plus, 
  ShieldCheck, Menu, X, Sparkles, Loader2, Coffee, Star, Users2, 
  Download, Lock, ShieldAlert, BadgeCheck, MapPin, Edit3, Send, 
  Megaphone, Ticket, ToggleLeft, ToggleRight, MessageSquare, 
  TrendingUp, Mail, Trash2, Search, ArrowUpDown, CheckCircle2, 
  Settings2, ChevronLeft, ChevronRight, Facebook, Instagram, 
  LifeBuoy, FileUp, Banknote, AlertTriangle, AlertCircle,
  History, BrainCircuit, FileText, Cake, Camera, User, Trophy, Clock, FileBarChart, Briefcase, ClipboardCheck, ChevronDown, ChevronUp, CheckSquare, Music, Database, ExternalLink
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

// FIX: Sanitize appId to ensure it is a valid Firestore document ID
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'lba-portal-v13';
const appId = rawAppId.replace(/[\/.]/g, '_'); 

// --- Global Constants ---
const ORG_LOGO_URL = "https://lh3.googleusercontent.com/d/1aYqARgJoEpHjqWJONprViSsEUAYHNqUL";
const OFFICER_TITLES = ["President", "Vice President", "Secretary", "Assistant Secretary", "Treasurer", "Auditor", "Business Manager", "P.R.O.", "Overall Committee Head"];
const COMMITTEE_TITLES = ["Committee Head", "Committee Member"];
const PROGRAMS = ["CAKO", "CLOCA", "CLOHS", "HRA", "ITM/ITTM"];
const POSITION_CATEGORIES = ["Member", "Officer", "Committee", "Execomm", "Blacklisted"];
const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
  { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
  { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" }
];
const COMMITTEES_INFO = [
  { 
    id: "Arts Committee", 
    title: "Arts & Design", 
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80",
    description: "The creative soul of LBA. We handle all visual assets, stage decorations, and artistic direction for major events.",
    roles: ["Create event pubmats & posters", "Design merchandise & t-shirts", "Execute venue styling & decoration"]
  },
  { 
    id: "PR Committee", 
    title: "Public Relations", 
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80", 
    description: "The voice of the association. We manage social media presence, student engagement, and external communications.",
    roles: ["Manage social media pages", "Write engaging captions & copies", "Coordinate with external partners"]
  },
  { 
    id: "Events Committee", 
    title: "Events & Logistics", 
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    description: "The backbone of operations. We plan flows, manage logistics, and ensure every LBA gathering runs smoothly.",
    roles: ["Plan detailed event programs", "Coordinate with venues & suppliers", "Manage on-the-day flow & crowd control"]
  }
];

const SOCIAL_LINKS = { 
  facebook: "https://fb.com/lpubaristas.official", 
  instagram: "https://instagram.com/lpubaristas.official", 
  tiktok: "https://tiktok.com/@lpubaristas.official",
  email: "lpubaristas.official@gmail.com" 
};
const SEED_OFFICER_KEY = "KAPERATA_OFFICER_2024";
const SEED_HEAD_KEY = "KAPERATA_HEAD_2024";
const SEED_COMM_KEY = "KAPERATA_COMM_2024";

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

// Robust CSV Generator using Blob
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

// Fixed Missing Helpers
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

const StatIcon = ({ icon: Icon, variant = 'default' }) => {
  // Use explicit returns to avoid string interpolation issues in some environments
  if (variant === 'amber') return <div className="p-3 rounded-2xl bg-amber-100 text-amber-600"><Icon size={24} /></div>;
  if (variant === 'indigo') return <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600"><Icon size={24} /></div>;
  if (variant === 'green') return <div className="p-3 rounded-2xl bg-green-100 text-green-600"><Icon size={24} /></div>;
  if (variant === 'blue') return <div className="p-3 rounded-2xl bg-blue-100 text-blue-600"><Icon size={24} /></div>;
  if (variant === 'red') return <div className="p-3 rounded-2xl bg-red-100 text-red-600"><Icon size={24} /></div>;
  return <div className="p-3 rounded-2xl bg-gray-100 text-gray-600"><Icon size={24} /></div>;
};

// Moved MemberCard outside Dashboard to prevent re-declaration
// Updated to have fixed width for better centering in flex layout
const MemberCard = ({ m }) => (
    <div key={m.memberId || m.name} className="bg-white p-6 rounded-[32px] border border-amber-100 flex flex-col items-center text-center shadow-sm w-full sm:w-64">
       <img src={getDirectLink(m.photoUrl) || `https://ui-avatars.com/api/?name=${m.name}&background=FDB813&color=3E2723`} className="w-20 h-20 rounded-full border-4 border-[#3E2723] mb-4 object-cover"/>
       <h4 className="font-black text-xs uppercase mb-1">{m.name}</h4>
       {m.nickname && <p className="text-[10px] text-gray-500 mb-2">"{m.nickname}"</p>}
       <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[8px] font-black uppercase">{m.specificTitle}</span>
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
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(''); 
  const [pendingProfile, setPendingProfile] = useState(null);
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true });
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
                    if (inputKey) {
                        const uk = inputKey.trim().toUpperCase();
                        if (uk === (secureKeys?.officerKey || "KAPERATA_OFFICER_2024").toUpperCase()) { pc = 'Officer'; role = 'admin'; pay = 'exempt'; }
                        else if (uk === (secureKeys?.headKey || "KAPERATA_HEAD_2024").toUpperCase()) { pc = 'Committee'; st = 'Committee Head'; pay = 'exempt'; }
                        else if (uk === (secureKeys?.commKey || "KAPERATA_COMM_2024").toUpperCase()) { pc = 'Committee'; st = 'Committee Member'; pay = 'exempt'; }
                        else throw new Error("Invalid key.");
                    }

                    setStatusMessage('Checking registry...');
                    let currentCount = 0;
                    try {
                        const q = query(
                            collection(db, 'artifacts', appId, 'public', 'data', 'registry'),
                            orderBy('joinedDate', 'desc'),
                            limit(1)
                        );
                        const snapshot = await getDocs(q);
                        
                        if (!snapshot.empty) {
                            const lastMember = snapshot.docs[0].data();
                            const match = lastMember.memberId.match(/-(\d)(\d{4,})C?$/);
                            if (match) {
                                currentCount = parseInt(match[2], 10);
                            } else {
                                const allDocs = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'registry'));
                                currentCount = allDocs.size;
                            }
                        }
                    } catch (fetchErr) {
                        if (fetchErr.code === 'permission-denied' || fetchErr.message.includes("insufficient permission")) {
                            throw fetchErr;
                        }
                        const allDocs = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'registry'));
                        currentCount = allDocs.size;
                    }
                    
                    const assignedId = generateLBAId(pc, currentCount);
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
                        joinedDate: new Date().toISOString() 
                    };
                    
                    if (pc !== 'Member') {
                        setStatusMessage('Creating profile...');
                        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', assignedId), profileData);
                        localStorage.setItem('lba_profile', JSON.stringify(profileData));
                        onLoginSuccess(profileData);
                    } else { 
                        setPendingProfile(profileData); 
                        setAuthMode('payment'); 
                    }
                } else if (authMode === 'payment') {
                    setStatusMessage('Processing...');
                    if (paymentMethod === 'cash' && cashOfficerKey.trim().toUpperCase() !== getDailyCashPasskey().toUpperCase()) throw new Error("Invalid Cash Key.");
                    const final = { ...pendingProfile, paymentStatus: 'paid', paymentDetails: { method: paymentMethod, refNo } };
                    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', final.memberId), final);
                    localStorage.setItem('lba_profile', JSON.stringify(final));
                    onLoginSuccess(final);
                } else {
                    setStatusMessage('Logging in...');
                    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), where('memberId', '==', memberIdInput.trim().toUpperCase()), limit(1));
                    const snap = await getDocs(q);
                    if (snap.empty) throw new Error("ID not found.");
                    const docSnap = snap.docs[0];
                    const userData = docSnap.data();
                    if (userData.password !== password) throw new Error("Incorrect password.");

                    // IMPORTANT: Update the UID on the existing record to match the current session
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
        if (err.message.includes("database (default) does not exist")) {
            setError("Database missing: Please create a Firestore Database in your Firebase Console.");
        } else if (err.code === 'permission-denied' || err.message.includes("insufficient permission")) {
            setError("Access Denied: Go to Firebase Console > Firestore > Rules and set to 'allow read, write: if true;' (Test Mode).");
        } else {
            setError(err.message); 
        }
    } finally { setLoading(false); setStatusMessage(''); }
  };

  const activeBtnClass = "flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] bg-[#3E2723] text-[#FDB813]";
  const inactiveBtnClass = "flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] bg-amber-50 text-amber-900";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4 text-[#3E2723]">
      {showForgotModal && (
         <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[40px] max-w-sm w-full p-10 shadow-2xl border-t-[12px] border-[#FDB813] text-center">
               <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6"><LifeBuoy size={32}/></div>
               <h4 className="font-serif text-2xl font-black uppercase">Account Recovery</h4>
               <p className="text-sm font-medium text-amber-950 mt-4">Contact an officer at:</p>
               <a href={`mailto:${SOCIAL_LINKS.email}`} className="text-[#3E2723] font-black underline block mt-2">{SOCIAL_LINKS.email}</a>
               <button onClick={() => setShowForgotModal(false)} className="w-full mt-8 bg-[#3E2723] text-[#FDB813] py-4 rounded-2xl font-black uppercase text-[10px]">Close</button>
            </div>
         </div>
      )}
      <div className="bg-white p-10 rounded-[48px] shadow-2xl max-w-md w-full border-t-[12px] border-[#3E2723]">
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
              <select required className="w-full p-3 border border-amber-200 rounded-xl text-xs font-black uppercase" value={program} onChange={(e) => setProgram(e.target.value)}>
                <option value="">Select Program</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              
              {/* Birthday Fields */}
              <div className="grid grid-cols-2 gap-2">
                <select required className="p-3 border border-amber-200 rounded-xl text-xs font-black uppercase" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                    <option value="">Birth Month</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <input type="number" required min="1" max="31" placeholder="Day" className="p-3 border border-amber-200 rounded-xl text-xs font-bold" value={birthDay} onChange={(e) => setBirthDay(e.target.value)} />
              </div>

              <input type="password" required placeholder="Password" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input type="password" required placeholder="Confirm Password" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <input type="text" placeholder="Leader Key (Optional)" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold uppercase" value={inputKey} onChange={(e) => setInputKey(e.target.value.toUpperCase())} />
            </div>
          )}
          {authMode === 'payment' && (
            <div className="space-y-4">
               <div className="flex gap-2">
                  <button type="button" onClick={() => setPaymentMethod('gcash')} className={paymentMethod === 'gcash' ? activeBtnClass : inactiveBtnClass}>GCash</button>
                  <button type="button" onClick={() => setPaymentMethod('cash')} className={paymentMethod === 'cash' ? activeBtnClass : inactiveBtnClass}>Cash</button>
               </div>
               <div className="p-4 bg-amber-50 rounded-2xl text-[10px] font-black text-amber-900 text-center uppercase">
                  {/* Updated GCash number */}
                  {paymentMethod === 'gcash' ? "GCash: +639063751402" : "Provide Daily Cash Key"}
               </div>
               <input type="text" required placeholder={paymentMethod === 'gcash' ? "Reference No." : "Daily Cash Key"} className="w-full p-3 border border-amber-200 rounded-xl outline-none text-xs uppercase" value={paymentMethod === 'gcash' ? refNo : cashOfficerKey} onChange={e => paymentMethod === 'gcash' ? setRefNo(e.target.value) : setCashOfficerKey(e.target.value.toUpperCase())} />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-[#3E2723] text-[#FDB813] py-5 rounded-2xl hover:bg-black transition-all font-black uppercase flex justify-center items-center gap-2 text-xs">
            {loading ? <div className="flex items-center gap-2"><Loader2 className="animate-spin" size={20}/><span className="text-[10px]">{statusMessage}</span></div> : (authMode === 'payment' ? 'Complete' : authMode === 'register' ? 'Register' : 'Enter Hub')}
          </button>
        </form>
        {authMode !== 'payment' && (
          <p className="text-center mt-6 text-[10px] text-amber-800 uppercase font-black">
            {authMode === 'login' ? (
              <button onClick={() => setAuthMode('register')} className="ml-2 text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Brew With Us</button>
            ) : <button onClick={() => setAuthMode('login')} className="ml-2 text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Back to Login</button>}
          </p>
        )}
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
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true, renewalOpen: true });
  const [secureKeys, setSecureKeys] = useState({ officerKey: '', headKey: '', commKey: '' });
  const [legacyContent, setLegacyContent] = useState({ body: "Loading association history..." });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
  const [savingSettings, setSavingSettings] = useState(false);
  const [expandedCommittee, setExpandedCommittee] = useState(null);
  const [financialFilter, setFinancialFilter] = useState('all');
  const [expandedEventId, setExpandedEventId] = useState(null); 
  
  // Interactive Feature States
  const [suggestionText, setSuggestionText] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', description: '', attendanceRequired: false, evaluationLink: '' });
  const [editingEvent, setEditingEvent] = useState(null); 
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [isEditingLegacy, setIsEditingLegacy] = useState(false);
  const [legacyForm, setLegacyForm] = useState({ body: '', imageUrl: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  
  // Committee Hunt State
  const [committeeForm, setCommitteeForm] = useState({ role: 'Committee Member' });
  const [submittingApp, setSubmittingApp] = useState(false);
  
  // Attendance Check State
  const [attendanceEvent, setAttendanceEvent] = useState(null);

  // New States for Accolades & Bulk Email
  const [showAccoladeModal, setShowAccoladeModal] = useState(null); // { memberId }
  const [accoladeText, setAccoladeText] = useState("");
  const [exportFilter, setExportFilter] = useState('all');

  // FIX: Case-insensitive check for officer role
  const isOfficer = useMemo(() => {
     if (!profile?.positionCategory) return false;
     const pc = String(profile.positionCategory).toUpperCase();
     return ['OFFICER', 'EXECOMM', 'COMMITTEE'].includes(pc);
  }, [profile?.positionCategory]);

  // FIX: Stricter check for Terminal access (Officers/Execomm only, no Committee)
  const isAdmin = useMemo(() => {
     if (!profile?.positionCategory) return false;
     const pc = String(profile.positionCategory).toUpperCase();
     return ['OFFICER', 'EXECOMM'].includes(pc);
  }, [profile?.positionCategory]);

  // Birthday Logic
  const isBirthday = useMemo(() => {
    if (!profile.birthMonth || !profile.birthDay) return false;
    const today = new Date();
    return parseInt(profile.birthMonth) === (today.getMonth() + 1) && parseInt(profile.birthDay) === today.getDate();
  }, [profile]);

  // Financial Stats
  const financialStats = useMemo(() => {
    if (!members) return { totalPaid: 0, cashCount: 0, gcashCount: 0, exemptCount: 0 };
    
    let filtered = members;
    if (financialFilter !== 'all') {
        const [sy, sem] = financialFilter.split('-');
        filtered = members.filter(m => m.lastRenewedSY === sy && m.lastRenewedSem === sem);
    }
    
    // Exempt logic: Officers, Execomm, Committee are exempt from cash/revenue reports
    const payingMembers = filtered.filter(m => {
        const isExempt = ['Officer', 'Execomm', 'Committee'].includes(m.positionCategory) || m.paymentStatus === 'exempt';
        return !isExempt && m.paymentStatus === 'paid';
    });

    const cashPayments = payingMembers.filter(m => m.paymentDetails?.method === 'cash').length;
    const gcashPayments = payingMembers.filter(m => m.paymentDetails?.method === 'gcash').length;
    
    return { 
        totalPaid: payingMembers.length,
        cashCount: cashPayments,
        gcashCount: gcashPayments,
        exemptCount: filtered.length - payingMembers.length
    };
  }, [members, financialFilter]);

  // Unique Semesters for filter
  const semesterOptions = useMemo(() => {
    if(!members) return [];
    const sems = new Set(members.map(m => `${m.lastRenewedSY}-${m.lastRenewedSem}`));
    return Array.from(sems).filter(s => s !== "undefined-undefined").sort().reverse();
  }, [members]);

  // Team Hierarchy Filtering
  const teamStructure = useMemo(() => {
    if (!members) return { tier1: [], tier2: [], tier3: [], committees: { heads: [], members: [] } };
    
    const sortedMembers = [...members].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    
    // Helper to check title case-insensitively with safety
    const hasTitle = (m, title) => (m.specificTitle || "").toUpperCase().includes(title.toUpperCase());
    const isCat = (m, cat) => (m.positionCategory || "").toUpperCase() === cat.toUpperCase();

    return {
        tier1: sortedMembers.filter(m => hasTitle(m, "President") && isCat(m, "Officer")),
        tier2: sortedMembers.filter(m => hasTitle(m, "Secretary") && isCat(m, "Officer")),
        tier3: sortedMembers.filter(m => 
            !hasTitle(m, "President") && !hasTitle(m, "Secretary") && isCat(m, "Officer")
        ),
        committees: {
            heads: sortedMembers.filter(m => isCat(m, "Committee") && hasTitle(m, "Head")),
            members: sortedMembers.filter(m => isCat(m, "Committee") && !hasTitle(m, "Head"))
        }
    };
  }, [members]);

  useEffect(() => {
    if (!user) return;
    const unsubReg = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), (s) => setMembers(s.docs.map(d => ({ id: d.id, ...d.data() }))), (e) => console.error("Registry sync error:", e));
    const unsubEvents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'events'), (s) => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))), (e) => console.error("Events sync error:", e));
    const unsubAnn = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), (s) => setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() }))), (e) => console.error("Announcements sync error:", e));
    const unsubSug = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions')), (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setSuggestions(data);
    }, (e) => console.error("Suggestions sync error:", e));
    
    // Fetch committee applications for officers
    let unsubApps;
    if (isAdmin) {
        unsubApps = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'applications')), (s) => {
             const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
             setCommitteeApps(data);
        }, (e) => console.error("Apps sync error:", e));
    }

    // Fetch user's own applications
    const unsubUserApps = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), where('memberId', '==', profile.memberId)), (s) => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
        setUserApplications(data);
    });

    const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (s) => s.exists() && setHubSettings(s.data()), (e) => {});
    const unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (s) => s.exists() && setSecureKeys(s.data()), (e) => {});
    const unsubLegacy = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), (s) => {
         if(s.exists()) {
             setLegacyContent(s.data());
             setLegacyForm(s.data());
         }
    }, (e) => {});
    
    return () => { 
        unsubReg(); unsubEvents(); unsubAnn(); unsubSug(); unsubOps(); unsubKeys(); unsubLegacy(); 
        if (unsubApps) unsubApps();
        unsubUserApps();
    };
  }, [user, isAdmin, profile.memberId]);

  // Real-time Sync for Attendance Event
  useEffect(() => {
    if (attendanceEvent && events.length > 0) {
      const liveEvent = events.find(e => e.id === attendanceEvent.id);
      if (liveEvent) {
        setAttendanceEvent(liveEvent);
      }
    }
  }, [events]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
        const updated = { ...profile, ...settingsForm, birthMonth: parseInt(settingsForm.birthMonth), birthDay: parseInt(settingsForm.birthDay) };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), updated);
        setProfile(updated);
        // Update local storage too
        localStorage.setItem('lba_profile', JSON.stringify(updated));
        alert("Profile updated successfully!");
    } catch(err) {
        console.error(err);
        alert("Failed to update profile.");
    } finally {
        setSavingSettings(false);
    }
  };

  const handlePostSuggestion = async (e) => {
      e.preventDefault();
      if (!suggestionText.trim()) return;
      try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), {
              text: suggestionText,
              authorId: profile.memberId,
              authorName: profile.nickname || profile.name,
              createdAt: serverTimestamp()
          });
          setSuggestionText("");
      } catch (err) { console.error(err); }
  };

  const handleAddEvent = async (e) => {
      e.preventDefault();
      try {
          if (editingEvent) {
             await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEvent.id), { ...newEvent });
             setEditingEvent(null);
          } else {
             await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { ...newEvent, createdAt: serverTimestamp(), attendees: [], registered: [] });
          }
          setShowEventForm(false);
          setNewEvent({ name: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', description: '', attendanceRequired: false, evaluationLink: '' });
      } catch (err) { console.error(err); }
  };

  const handleEditEvent = (ev) => {
      setNewEvent({
          name: ev.name,
          startDate: ev.startDate,
          endDate: ev.endDate,
          startTime: ev.startTime,
          endTime: ev.endTime,
          venue: ev.venue,
          description: ev.description,
          attendanceRequired: ev.attendanceRequired || false,
          evaluationLink: ev.evaluationLink || ''
      });
      setEditingEvent(ev);
      setShowEventForm(true);
  };

  const handleDeleteEvent = async (id) => {
      if(!confirm("Delete this event?")) return;
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id));
      } catch(err) { console.error(err); }
  };

  const handleToggleAttendance = async (memberId) => {
      if (!attendanceEvent || !memberId) return;
      
      const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', attendanceEvent.id);
      const isPresent = attendanceEvent.attendees?.includes(memberId);
      
      try {
          if (isPresent) {
              await updateDoc(eventRef, { attendees: arrayRemove(memberId) });
          } else {
              await updateDoc(eventRef, { attendees: arrayUnion(memberId) });
          }
          // Update local state to reflect change immediately (optimistic UI)
          setAttendanceEvent(prev => ({
              ...prev,
              attendees: isPresent 
                  ? prev.attendees.filter(id => id !== memberId)
                  : [...(prev.attendees || []), memberId]
          }));
      } catch(err) {
          console.error("Attendance update failed", err);
      }
  };

  const handleDownloadAttendance = () => {
    if (!attendanceEvent) return;
    const presentMembers = members.filter(m => attendanceEvent.attendees?.includes(m.memberId));
    
    // Robust CSV generation using Blob
    const headers = ["Name", "ID", "Position"];
    const rows = presentMembers.sort((a,b) => (a.name || "").localeCompare(b.name || "")).map(m => [m.name, m.memberId, m.specificTitle]);
    
    generateCSV(headers, rows, `${attendanceEvent.name.replace(/\s+/g, '_')}_Attendance.csv`);
  };
  
  const handleRegisterEvent = async (ev) => {
      const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', ev.id);
      const isRegistered = ev.registered?.includes(profile.memberId);
      try {
          if (isRegistered) {
              await updateDoc(eventRef, { registered: arrayRemove(profile.memberId) });
          } else {
              await updateDoc(eventRef, { registered: arrayUnion(profile.memberId) });
          }
      } catch (err) { console.error(err); }
  };


  const handlePostAnnouncement = async (e) => {
      e.preventDefault();
      try {
          if (editingAnnouncement) {
             await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'announcements', editingAnnouncement.id), {
                 ...newAnnouncement,
                 lastEdited: serverTimestamp()
             });
             setEditingAnnouncement(null);
          } else {
             await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), { 
                 ...newAnnouncement, 
                 date: new Date().toISOString(),
                 createdAt: serverTimestamp() 
             });
          }
          setShowAnnounceForm(false);
          setNewAnnouncement({ title: '', content: '' });
      } catch (err) { console.error(err); }
  };
  
  const handleDeleteAnnouncement = async (id) => {
      if(!confirm("Delete this announcement?")) return;
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'announcements', id));
      } catch(err) { console.error(err); }
  };

  const handleEditAnnouncement = (ann) => {
      setNewAnnouncement({ title: ann.title, content: ann.content });
      setEditingAnnouncement(ann);
      setShowAnnounceForm(true);
  };

  const handleSaveLegacy = async () => {
      try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), legacyForm);
          setIsEditingLegacy(false);
      } catch(err) { console.error(err); }
  };

  const handleApplyCommittee = async (e, targetCommittee) => {
      e.preventDefault();
      setSubmittingApp(true);
      try {
          // Check for existing application to prevent duplicates
          const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), where('memberId', '==', profile.memberId));
          const snap = await getDocs(q);
          if(!snap.empty) {
              alert("You already have a pending application.");
              setSubmittingApp(false);
              return;
          }

          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), {
              memberId: profile.memberId,
              name: profile.name,
              email: profile.email,
              committee: targetCommittee,
              role: committeeForm.role,
              status: 'pending',
              createdAt: serverTimestamp()
          });
          alert("Application submitted successfully!");
      } catch(err) {
          console.error(err);
          alert("Failed to submit application.");
      } finally {
          setSubmittingApp(false);
      }
  };

  // --- NEW ACTIONS FOR TERMINAL ---
  const handleUpdateAppStatus = async (app, status) => {
      try {
          const batch = writeBatch(db);
          const appRef = doc(db, 'artifacts', appId, 'public', 'data', 'applications', app.id);
          batch.update(appRef, { status });

          if (status === 'accepted') {
              const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', app.memberId);
              batch.update(memberRef, {
                  accolades: arrayUnion(`${app.committee} - ${app.role}`)
              });
          }

          await batch.commit();
      } catch (err) { console.error(err); }
  };

  const handleDeleteApp = async (id) => {
      if (!confirm("Delete this application?")) return;
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', id));
      } catch (err) { console.error(err); }
  };

  const handleToggleRegistration = async () => {
      try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), {
              ...hubSettings,
              registrationOpen: !hubSettings.registrationOpen
          });
      } catch (err) { console.error(err); }
  };

  const handleDownloadFinancials = () => {
      let filtered = members;
      if (financialFilter !== 'all') {
          const [sy, sem] = financialFilter.split('-');
          filtered = members.filter(m => m.lastRenewedSY === sy && m.lastRenewedSem === sem);
      }

      // Logic: Include everyone, but mark exempt
      const headers = ["Name", "ID", "Category", "Payment Status", "Method", "Ref No"];
      const rows = filtered.map(m => {
          const isExempt = ['Officer', 'Execomm', 'Committee'].includes(m.positionCategory) || m.paymentStatus === 'exempt';
          const status = isExempt ? 'EXEMPT' : (m.paymentStatus === 'paid' ? 'PAID' : 'UNPAID');
          return [m.name, m.memberId, m.positionCategory, status, m.paymentDetails?.method || '', m.paymentDetails?.refNo || ''];
      });

      generateCSV(headers, rows, `LBA_Financials_${financialFilter}.csv`);
  };
  
  const handleSanitizeDatabase = async () => {
      if (!confirm("This will REMOVE DUPLICATES (by Name) and RE-GENERATE Member IDs. Are you sure?")) return;
      const batch = writeBatch(db);
      try {
          const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), orderBy('joinedDate', 'asc'));
          const snapshot = await getDocs(q);
          
          let count = 0;
          snapshot.docs.forEach((docSnap) => {
             const data = docSnap.data();
             const category = data.positionCategory || "Member";
             const meta = getMemberIdMeta(); 
             
             count++;
             const padded = String(count).padStart(4, '0');
             const isLeader = ['Officer', 'Execomm', 'Committee'].includes(category);
             const newId = `LBA${meta.sy}-${meta.sem}${padded}${isLeader ? "C" : ""}`;
             
             batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'registry', docSnap.id), { memberId: newId });
          });
          
          await batch.commit();
          alert(`Database sanitized! ${count} records updated.`);
      } catch (err) {
          console.error("Sanitize error", err);
          alert("Failed to sanitize: " + err.message);
      }
  };

  // --- NEW FEATURES ---
  const handleExportCSV = () => {
      let dataToExport = [...members];
      if (exportFilter === 'active') dataToExport = dataToExport.filter(m => m.status === 'active');
      else if (exportFilter === 'inactive') dataToExport = dataToExport.filter(m => m.status !== 'active');
      else if (exportFilter === 'officers') dataToExport = dataToExport.filter(m => ['Officer', 'Execomm'].includes(m.positionCategory));
      else if (exportFilter === 'committee') dataToExport = dataToExport.filter(m => m.positionCategory === 'Committee');
      
      const headers = ["Name", "ID", "Email", "Program", "Position", "Status"];
      const rows = dataToExport.map(e => [e.name, e.memberId, e.email, e.program, e.specificTitle, e.status]);

      generateCSV(headers, rows, `LBA_Registry_${exportFilter}.csv`);
  };

  const handleBulkEmail = () => {
    const recipients = selectedBaristas.length > 0 
        ? members.filter(m => selectedBaristas.includes(m.memberId))
        : filteredRegistry;
    
    const emails = recipients
        .map(m => m.email)
        .filter(e => e)
        .join(',');
        
    if (!emails) return alert("No valid emails found.");
    window.location.href = `mailto:?bcc=${emails}`;
  };

  const handleGiveAccolade = async () => {
      if (!accoladeText.trim() || !showAccoladeModal) return;
      try {
          const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', showAccoladeModal.memberId);
          await updateDoc(memberRef, {
              accolades: arrayUnion(accoladeText)
          });
          setAccoladeText("");
          setShowAccoladeModal(null);
          alert("Accolade awarded!");
      } catch (err) {
          console.error("Error giving accolade:", err);
          alert("Failed to award accolade.");
      }
  };

  // Registry Helpers
  const filteredRegistry = useMemo(() => {
    let res = [...members];
    if (searchQuery) res = res.filter(m => (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())) || (m.memberId && m.memberId.toLowerCase().includes(searchQuery.toLowerCase())));
    res.sort((a, b) => (a[sortConfig.key] || "").localeCompare(b[sortConfig.key] || "") * (sortConfig.direction === 'asc' ? 1 : -1));
    return res;
  }, [members, searchQuery, sortConfig]);

  const paginatedRegistry = filteredRegistry.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => setSelectedBaristas(selectedBaristas.length === paginatedRegistry.length ? [] : paginatedRegistry.map(m => m.memberId));
  const toggleSelectBarista = (mid) => setSelectedBaristas(prev => prev.includes(mid) ? prev.filter(id => id !== mid) : [...prev, mid]);

  const handleUpdatePosition = async (targetId, cat, specific = "") => {
    if (!isAdmin) return; // RESTRICTED: Only Admins (Officer/Execomm) can update positions
    const target = members.find(m => m.memberId === targetId);
    if (!target) return;
    
    let newId = target.memberId;
    const isL = ['Officer', 'Execomm', 'Committee'].includes(cat);
    const baseId = newId.endsWith('C') ? newId.slice(0, -1) : newId;
    newId = baseId + (isL ? 'C' : '');
    const updates = { positionCategory: cat, specificTitle: specific || cat, memberId: newId, role: ['Officer', 'Execomm'].includes(cat) ? 'admin' : 'member', paymentStatus: isL ? 'exempt' : target.paymentStatus };
    if (newId !== targetId) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', targetId));
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', newId), { ...target, ...updates });
  };

  const initiateRemoveMember = (mid, name) => {
    setConfirmDelete({ mid, name });
  };

  const confirmRemoveMember = async () => {
    if (!confirmDelete) return;
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', confirmDelete.mid));
    } catch(e) { console.error(e); } finally { setConfirmDelete(null); }
  };
  
  const handleBulkImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
       try {
          const text = evt.target.result;
          const rows = text.split('\n').filter(r => r.trim().length > 0);
          const batch = writeBatch(db);
          let count = members.length;
          for (let i = 1; i < rows.length; i++) {
             const [name, email, prog, pos, title] = rows[i].split(',').map(s => s.trim());
             if (!name || !email) continue;
             const mid = generateLBAId(pos, count++);
             const meta = getMemberIdMeta();
             const data = { name: name.toUpperCase(), email: email.toLowerCase(), program: prog || "UNSET", positionCategory: pos || "Member", specificTitle: title || pos || "Member", memberId: mid, role: pos === 'Officer' ? 'admin' : 'member', status: 'active', paymentStatus: pos !== 'Member' ? 'exempt' : 'unpaid', lastRenewedSem: meta.sem, lastRenewedSY: meta.sy, password: "LBA" + mid.slice(-5), joinedDate: new Date().toISOString() };
             batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'registry', mid), data);
          }
          await batch.commit();
       } catch (err) {} finally { setIsImporting(false); e.target.value = ""; }
    };
    reader.readAsText(file);
  };
  
  const downloadImportTemplate = () => {
    const headers = ["Name", "Email", "Program", "PositionCategory", "SpecificTitle"];
    const rows = [["JUAN DELA CRUZ", "juan@lpu.edu.ph", "BSIT", "Member", "Member"]];
    generateCSV(headers, rows, "LBA_Import_Template.csv");
  };

  const handleRotateSecurityKeys = async () => {
    const newKeys = {
        officerKey: "OFF" + Math.random().toString(36).slice(-6).toUpperCase(),
        headKey: "HEAD" + Math.random().toString(36).slice(-6).toUpperCase(),
        commKey: "COMM" + Math.random().toString(36).slice(-6).toUpperCase()
    };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), newKeys);
  };


  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: BarChart3 },
    // Removed Settings from menu
    { id: 'about', label: 'Legacy Story', icon: History },
    { id: 'team', label: 'Brew Crew', icon: Users2 },
    { id: 'events', label: "What's Brewing?", icon: Calendar },
    { id: 'announcements', label: 'Grind Report', icon: Bell },
    { id: 'suggestions', label: 'Suggestion Box', icon: MessageSquare },
    { id: 'committee_hunt', label: 'Committee Hunt', icon: Briefcase }, // Added new tab
    ...(isOfficer ? [{ id: 'members', label: 'Registry', icon: Users }] : []),
    ...(isAdmin ? [{ id: 'reports', label: 'Terminal', icon: FileText }] : [])
  ];

  const activeMenuClass = "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all bg-[#FDB813] text-[#3E2723] shadow-lg font-black";
  const inactiveMenuClass = "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-amber-200/40 hover:bg-white/5";

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row text-[#3E2723] font-sans relative">
      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center border-b-[8px] border-[#3E2723]">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
                <h3 className="text-xl font-black uppercase text-[#3E2723] mb-2">Confirm Deletion</h3>
                <p className="text-sm text-gray-600 mb-8">Are you sure you want to remove <span className="font-bold text-[#3E2723]">{confirmDelete.name}</span>?</p>
                <div className="flex gap-3">
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                    <button onClick={confirmRemoveMember} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold uppercase text-xs hover:bg-red-700">Delete</button>
                </div>
            </div>
        </div>
      )}
      
      {/* Attendance Modal */}
      {attendanceEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 w-full max-w-2xl h-[80vh] flex flex-col border-b-[8px] border-[#3E2723]">
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-amber-100">
                    <div>
                        <h3 className="text-xl font-black uppercase text-[#3E2723]">Attendance Check</h3>
                        <p className="text-xs text-amber-600 font-bold mt-1">{attendanceEvent.name} • {getEventDay(attendanceEvent.startDate)} {getEventMonth(attendanceEvent.startDate)}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleDownloadAttendance} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200" title="Download List"><Download size={20}/></button>
                        <button onClick={() => setAttendanceEvent(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                    </div>
                </div>
                
                {(() => {
                    // Filter members who registered for this event
                    const registeredMembers = members.filter(m => attendanceEvent.registered?.includes(m.memberId));
                    const sortedMembers = [...registeredMembers].sort((a,b) => (a.name || "").localeCompare(b.name || ""));

                    return (
                        <>
                            <div className="flex justify-between items-center mb-4 px-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Registered List</span>
                                <span className="text-xs font-bold bg-[#3E2723] text-[#FDB813] px-3 py-1 rounded-full">
                                    Present: {attendanceEvent.attendees?.length || 0} / {registeredMembers.length}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {sortedMembers.length > 0 ? (
                                    sortedMembers.map(m => {
                                        const isPresent = attendanceEvent.attendees?.includes(m.memberId);
                                        return (
                                            <div key={m.id} 
                                                 onClick={() => handleToggleAttendance(m.memberId)}
                                                 className={`p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${isPresent ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent hover:bg-amber-50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isPresent ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
                                                        {m.name ? m.name.charAt(0) : "?"}
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-bold uppercase ${isPresent ? 'text-green-900' : 'text-gray-600'}`}>{m.name}</p>
                                                        <p className="text-[9px] text-gray-400">{m.memberId}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isPresent ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                                    {isPresent && <CheckCircle2 size={14} className="text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-10 opacity-50">
                                        <p className="text-sm font-bold">No registered members found.</p>
                                        <p className="text-xs">Members must register for the event to appear here.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
      )}

      {/* Accolade Modal */}
      {showAccoladeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center border-b-[8px] border-[#3E2723]">
                <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trophy size={32} /></div>
                <h3 className="text-xl font-black uppercase text-[#3E2723] mb-2">Award Accolade</h3>
                <input type="text" placeholder="Achievement Title" className="w-full p-3 border rounded-xl text-xs mb-6" value={accoladeText} onChange={e => setAccoladeText(e.target.value)} />
                <div className="flex gap-3">
                    <button onClick={() => setShowAccoladeModal(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                    <button onClick={handleGiveAccolade} className="flex-1 py-3 rounded-xl bg-yellow-500 text-white font-bold uppercase text-xs hover:bg-yellow-600">Award</button>
                </div>
            </div>
        </div>
      )}

      <aside className={`
          bg-[#3E2723] text-amber-50 flex-col 
          md:w-64 md:flex 
          ${mobileMenuOpen ? 'fixed inset-0 z-50 w-64 shadow-2xl flex' : 'hidden'}
      `}>
        <div className="p-8 border-b border-amber-900/30 text-center">
           <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-20 h-20 object-contain mx-auto mb-4" />
           <h1 className="font-serif font-black text-[10px] uppercase">LPU Baristas' Association</h1>
        </div>
        
        {/* Mobile Close Button */}
        <div className="md:hidden p-4 flex justify-end absolute top-2 right-2">
            <button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map(item => {
             const active = view === item.id;
             const Icon = item.icon; // Cap variable for JSX
             return (
                <button key={item.id} onClick={() => { setView(item.id); setMobileMenuOpen(false); }} className={active ? activeMenuClass : inactiveMenuClass}>
                  <Icon size={18}/><span className="uppercase text-[10px] font-black">{item.label}</span>
                </button>
             );
          })}
        </nav>
        
        {/* Social Media Links */}
        <div className="p-6 border-t border-amber-900/30 space-y-4">
            <div className="flex justify-center gap-4">
                <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" className="text-amber-200/60 hover:text-[#FDB813] transition-colors"><Facebook size={18} /></a>
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" className="text-amber-200/60 hover:text-[#FDB813] transition-colors"><Instagram size={18} /></a>
                <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noreferrer" className="text-amber-200/60 hover:text-[#FDB813] transition-colors"><Music size={18} /></a>
                <a href={`mailto:${SOCIAL_LINKS.email}`} className="text-amber-200/60 hover:text-[#FDB813] transition-colors"><Mail size={18} /></a>
            </div>
            <button onClick={() => { 
                localStorage.removeItem('lba_profile'); 
                logout(); 
            }} className="w-full flex items-center justify-center gap-2 text-red-400 font-black text-[10px] uppercase hover:text-red-300"><LogOut size={16} /> Exit Hub</button>
        </div>
      </aside>
      
      {/* Overlay for mobile menu */}
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>}

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
              {/* Mobile Menu Toggle */}
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-[#3E2723]"><Menu size={24}/></button>
              <h2 className="font-serif text-3xl font-black uppercase text-[#3E2723]">KAPErata Hub</h2>
          </div>
          
          {/* Made profile clickable for settings */}
          <div 
            onClick={() => setView('settings')}
            className="bg-white p-2 pr-6 rounded-full border border-amber-100 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-amber-50 transition-colors"
            title="Edit Profile"
          >
            <img src={getDirectLink(profile.photoUrl) || `https://ui-avatars.com/api/?name=${profile.name}&background=FDB813&color=3E2723`} className="w-10 h-10 rounded-full object-cover" />
            <div className="hidden sm:block"><p className="text-[10px] font-black uppercase text-[#3E2723]">{profile.nickname || profile.name.split(' ')[0]}</p><p className="text-[8px] font-black text-amber-500 uppercase">{profile.specificTitle}</p></div>
          </div>
        </header>

        {view === 'home' && (
           <div className="space-y-10 animate-fadeIn">
              {/* Birthday Banner */}
              {isBirthday && (
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 rounded-[40px] shadow-xl mb-8 flex items-center gap-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><Cake size={120} /></div>
                      <div className="bg-white/20 p-4 rounded-full text-white"><Cake size={40} /></div>
                      <div className="text-white z-10">
                          <h3 className="font-serif text-3xl font-black uppercase">Happy Birthday!</h3>
                          <p className="font-medium text-white/90">Wishing you the happiest of days, {profile.nickname || profile.name.split(' ')[0]}! 🎂</p>
                      </div>
                  </div>
              )}

              {/* Applicant Dashboard: Status Card */}
              {userApplications.length > 0 && (
                  <div className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm mb-8">
                      <h4 className="font-black text-sm uppercase text-[#3E2723] mb-4 flex items-center gap-2">
                          <Briefcase size={16} className="text-amber-500"/> Your Applications
                      </h4>
                      <div className="space-y-3">
                          {userApplications.map(app => (
                              <div key={app.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                                  <div>
                                      <p className="font-bold text-xs uppercase text-[#3E2723]">{app.committee}</p>
                                      <p className="text-[10px] text-gray-500">{app.role}</p>
                                  </div>
                                  <div className="text-right">
                                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                          app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                          app.status === 'denied' ? 'bg-red-100 text-red-700' :
                                          app.status === 'for_interview' ? 'bg-blue-100 text-blue-700' :
                                          'bg-yellow-100 text-yellow-700'
                                      }`}>
                                          {app.status === 'for_interview' ? 'For Interview - Check Email' : (app.status || 'Submitted - For Review')}
                                      </span>
                                      <p className="text-[8px] text-gray-400 mt-1">{formatDate(app.createdAt?.toDate ? app.createdAt.toDate() : new Date())}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Profile Card & Notices Grid */}
              <div className="bg-[#3E2723] rounded-[48px] p-8 text-white relative overflow-hidden shadow-2xl border-4 border-[#FDB813] mb-8">
                  {/* ... (Existing Profile Header) ... */}
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
                      <img src={getDirectLink(profile.photoUrl) || `https://ui-avatars.com/api/?name=${profile.name}&background=FDB813&color=3E2723`} className="w-24 h-24 rounded-full object-cover border-4 border-white/20" />
                      <div>
                          {/* Updated Layout: Full Name, Nickname, Title */}
                          <h3 className="font-serif text-2xl sm:text-3xl font-black uppercase leading-tight">{profile.name}</h3>
                          <p className="text-white/90 font-bold text-lg uppercase tracking-wide">"{profile.nickname || 'Barista'}"</p>
                          <p className="text-[#FDB813] font-black text-sm uppercase mt-1">{profile.specificTitle || 'Member'}</p>
                      </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     <div className="bg-[#FDB813] text-[#3E2723] px-5 py-2 rounded-full font-black text-[9px] uppercase">{profile.memberId}</div>
                     <div className="bg-green-500 text-white px-5 py-2 rounded-full font-black text-[9px] uppercase">Active</div>
                     <div className="bg-white/20 text-white px-5 py-2 rounded-full font-black text-[9px] uppercase">{profile.positionCategory}</div>
                     <div className="bg-orange-500 text-white px-5 py-2 rounded-full font-black text-[9px] uppercase">10% B'CAFE</div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Left Column: Notices & Upcoming Events */}
                 <div className="lg:col-span-2 space-y-6">
                    {/* Latest Notices */}
                    <div>
                        <h3 className="font-serif text-xl font-black uppercase text-[#3E2723] mb-4 flex items-center gap-2">
                          <Bell size={20} className="text-amber-600"/> Latest Notices
                        </h3>
                        <div className="space-y-4">
                           {announcements.length === 0 ? <p className="text-xs text-gray-500">No new notices.</p> : announcements.slice(0, 2).map(ann => (
                             <div key={ann.id} className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-black text-sm uppercase text-[#3E2723]">{ann.title}</h4>
                                  <span className="text-[8px] font-bold text-gray-400 uppercase">{formatDate(ann.date)}</span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2">{ann.content}</p>
                             </div>
                           ))}
                        </div>
                    </div>

                    {/* Upcoming Events */}
                    <div>
                        <h3 className="font-serif text-xl font-black uppercase text-[#3E2723] mb-4 flex items-center gap-2">
                          <Calendar size={20} className="text-amber-600"/> Upcoming Events
                        </h3>
                        <div className="space-y-4">
                           {events.length === 0 ? <p className="text-xs text-gray-500">No upcoming events.</p> : events.slice(0, 3).map(ev => {
                               const { day, month } = getEventDateParts(ev.startDate, ev.endDate);
                               return (
                                 <div key={ev.id} className="bg-white p-4 rounded-3xl border border-amber-100 flex items-center gap-4">
                                    <div className="bg-[#3E2723] text-[#FDB813] w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black leading-tight shrink-0">
                                       <span className="text-xs font-black">{day}</span>
                                       <span className="text-[8px] uppercase">{month}</span>
                                    </div>
                                    <div className="min-w-0">
                                       <h4 className="font-black text-xs uppercase truncate">{ev.name}</h4>
                                       <p className="text-[10px] text-gray-500 truncate">{ev.venue} • {ev.startTime}</p>
                                    </div>
                                 </div>
                               );
                           })}
                        </div>
                    </div>
                 </div>

                 {/* Right Column: Achievements & History */}
                 <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[32px] border border-amber-100 h-full">
                       <h3 className="font-black text-sm uppercase text-[#3E2723] mb-4 flex items-center gap-2">
                         <Trophy size={16} className="text-amber-500"/> Trophy Case
                       </h3>
                       <div className="grid grid-cols-3 gap-3">
                          {/* Dynamic Badges */}
                          <div className="flex flex-col items-center gap-1">
                             <div title="Member" className="w-full aspect-square bg-amber-50 rounded-2xl flex items-center justify-center text-2xl">☕</div>
                             <span className="text-[8px] font-black uppercase text-amber-900/60 text-center">Member</span>
                          </div>
                          
                          {isOfficer && (
                              <div className="flex flex-col items-center gap-1">
                                  <div title="Officer" className="w-full aspect-square bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">🛡️</div>
                                  <span className="text-[8px] font-black uppercase text-indigo-900/60 text-center">Officer</span>
                              </div>
                          )}
                          
                          {/* Safe check for memberId before calculation */}
                          {profile.memberId && (new Date().getFullYear() - 2000 - parseInt(profile.memberId.substring(3,5))) >= 1 && (
                              <div className="flex flex-col items-center gap-1">
                                  <div title="Veteran" className="w-full aspect-square bg-yellow-50 rounded-2xl flex items-center justify-center text-2xl">🏅</div>
                                  <span className="text-[8px] font-black uppercase text-yellow-900/60 text-center">Veteran</span>
                              </div>
                          )}
                          
                          {/* Added Custom Accolades */}
                          {profile.accolades?.map((acc, i) => (
                             <div key={i} className="flex flex-col items-center gap-1">
                                <div title={acc} className="w-full aspect-square bg-purple-50 rounded-2xl flex items-center justify-center text-2xl cursor-help">🏆</div>
                                <span className="text-[8px] font-black uppercase text-purple-900/60 text-center leading-tight line-clamp-2">{acc}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[32px] border border-amber-100">
                       <h3 className="font-black text-sm uppercase text-[#3E2723] mb-4 flex items-center gap-2">
                         <Clock size={16} className="text-blue-500"/> Activity Log
                       </h3>
                       <ul className="space-y-3">
                          <li className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-green-500"></div>
                             <div>
                               <p className="text-[10px] font-bold">Logged In</p>
                               <p className="text-[8px] text-gray-400">Just now</p>
                             </div>
                          </li>
                          <li className="flex items-center gap-3 opacity-50">
                             <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                             <div>
                               <p className="text-[10px] font-bold">Joined Association</p>
                               <p className="text-[8px] text-gray-400">{formatDate(profile.joinedDate)}</p>
                             </div>
                          </li>
                       </ul>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {view === 'about' && (
           <div className="bg-white p-10 rounded-[48px] border border-amber-100 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-amber-100">
                 <div className="flex items-center gap-4">
                    <StatIcon icon={History} variant="amber" />
                    <h3 className="font-serif text-3xl font-black uppercase">Legacy Story</h3>
                 </div>
                 {isOfficer && <button onClick={() => setIsEditingLegacy(!isEditingLegacy)} className="text-amber-500 text-xs font-bold uppercase underline">Edit</button>}
              </div>
              {isEditingLegacy ? (
                  <div className="space-y-4">
                      <input type="text" placeholder="Image URL" className="w-full p-3 border rounded-xl text-xs" value={legacyForm.imageUrl} onChange={e => setLegacyForm({...legacyForm, imageUrl: e.target.value})} />
                      <p className="text-[10px] text-gray-400">Preferred Image Size: 16:9 (Landscape)</p>
                      <textarea className="w-full p-3 border rounded-xl text-xs h-64" value={legacyForm.body} onChange={e => setLegacyForm({...legacyForm, body: e.target.value})}></textarea>
                      <button onClick={handleSaveLegacy} className="bg-[#3E2723] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase">Save Story</button>
                  </div>
              ) : (
                  <>
                    {legacyContent?.imageUrl && <img src={getDirectLink(legacyContent.imageUrl)} className="w-full h-64 object-cover rounded-3xl mb-4" />}
                    <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{legacyContent?.body || "History not yet written."}</p>
                  </>
              )}
           </div>
        )}

        {view === 'team' && (
           <div className="space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-amber-100 text-center">
                 <h3 className="font-serif text-3xl font-black uppercase text-[#3E2723] mb-2">The Brew Crew</h3>
                 <p className="text-amber-500 font-bold text-xs uppercase tracking-widest">Officers & Committee</p>
              </div>
              
              {/* Hierarchy Display */}
              <div className="space-y-8">
                  {/* Tier 1: Pres & VP */}
                  {teamStructure.tier1.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-6 max-w-2xl mx-auto">
                          {teamStructure.tier1.map(m => <MemberCard key={m.id || m.memberId} m={m} />)}
                      </div>
                  )}
                  
                  {/* Tier 2: Secretaries */}
                  {teamStructure.tier2.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-6 max-w-2xl mx-auto">
                          {teamStructure.tier2.map(m => <MemberCard key={m.id || m.memberId} m={m} />)}
                      </div>
                  )}
                  
                  {/* Tier 3: Other Officers */}
                  {teamStructure.tier3.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-6">
                          {teamStructure.tier3.map(m => <MemberCard key={m.id || m.memberId} m={m} />)}
                      </div>
                  )}
                  
                  {/* Committees Section */}
                  {(teamStructure.committees.heads.length > 0 || teamStructure.committees.members.length > 0) && (
                      <div className="pt-8 border-t border-amber-200">
                          <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723] text-center mb-6">Committees</h4>
                          
                          {/* Heads Row */}
                          {teamStructure.committees.heads.length > 0 && (
                              <div className="mb-6">
                                  <p className="text-center text-amber-600 font-bold uppercase text-xs mb-4 tracking-widest">Heads</p>
                                  <div className="flex flex-wrap justify-center gap-4">
                                      {teamStructure.committees.heads.map(m => <MemberCard key={m.id || m.memberId} m={m} />)}
                                  </div>
                              </div>
                          )}
                          
                          {/* Members Row */}
                          {teamStructure.committees.members.length > 0 && (
                              <div>
                                  <p className="text-center text-amber-600 font-bold uppercase text-xs mb-4 tracking-widest">Members</p>
                                  <div className="flex flex-wrap justify-center gap-4">
                                      {teamStructure.committees.members.map(m => <MemberCard key={m.id || m.memberId} m={m} />)}
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>
           </div>
        )}

        {view === 'committee_hunt' && (
           <div className="space-y-6 animate-fadeIn">
              <h3 className="font-serif text-3xl font-black uppercase text-center mb-8">Join the Team</h3>
              
              {/* Applicant Dashboard: Status Card */}
              {userApplications.length > 0 && (
                  <div className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm mb-8">
                      <h4 className="font-black text-sm uppercase text-[#3E2723] mb-4 flex items-center gap-2">
                          <Briefcase size={16} className="text-amber-500"/> Your Applications
                      </h4>
                      <div className="space-y-3">
                          {userApplications.map(app => (
                              <div key={app.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                                  <div>
                                      <p className="font-bold text-xs uppercase text-[#3E2723]">{app.committee}</p>
                                      <p className="text-[10px] text-gray-500">{app.role}</p>
                                  </div>
                                  <div className="text-right">
                                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                          app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                          app.status === 'denied' ? 'bg-red-100 text-red-700' :
                                          app.status === 'for_interview' ? 'bg-blue-100 text-blue-700' :
                                          'bg-yellow-100 text-yellow-700'
                                      }`}>
                                          {app.status === 'for_interview' ? 'For Interview - Check Email' : (app.status || 'Submitted - For Review')}
                                      </span>
                                      <p className="text-[8px] text-gray-400 mt-1">{formatDate(app.createdAt?.toDate ? app.createdAt.toDate() : new Date())}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <div className="space-y-4">
                 {COMMITTEES_INFO.map((comm) => (
                    <div key={comm.id} className="bg-white rounded-[32px] border border-amber-100 overflow-hidden shadow-sm transition-all">
                       <button 
                           onClick={() => setExpandedCommittee(expandedCommittee === comm.id ? null : comm.id)}
                           className="w-full p-6 flex items-center justify-between bg-white hover:bg-amber-50 transition-colors"
                       >
                           <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                                  <Briefcase size={20} />
                               </div>
                               <div className="text-left">
                                   <h4 className="font-black text-lg uppercase text-[#3E2723]">{comm.title}</h4>
                                   <p className="text-[10px] text-gray-500 font-medium">Click to view details</p>
                               </div>
                           </div>
                           {expandedCommittee === comm.id ? <ChevronUp className="text-amber-400"/> : <ChevronDown className="text-amber-400"/>}
                       </button>
                       
                       {expandedCommittee === comm.id && (
                           <div className="p-6 pt-0 border-t border-amber-50">
                               <div className="w-full h-48 bg-gray-200 rounded-2xl mb-6 overflow-hidden relative group">
                                   <img src={comm.image} className="w-full h-full object-cover" />
                                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                               </div>
                               
                               <div className="mb-6">
                                   <h5 className="font-bold text-sm uppercase text-amber-600 mb-2">About</h5>
                                   <p className="text-xs text-gray-600 leading-relaxed">{comm.description}</p>
                               </div>

                               <div className="mb-8">
                                   <h5 className="font-bold text-sm uppercase text-amber-600 mb-2">Roles & Responsibilities</h5>
                                   <ul className="space-y-2">
                                       {comm.roles.map((role, idx) => (
                                           <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                                               <CheckSquare size={14} className="text-green-500 shrink-0 mt-0.5"/>
                                               <span>{role}</span>
                                           </li>
                                       ))}
                                   </ul>
                               </div>

                               <div className="bg-amber-50 p-6 rounded-2xl">
                                   <h5 className="font-bold text-sm uppercase text-[#3E2723] mb-4">Apply for {comm.title}</h5>
                                   <div className="flex gap-2">
                                       <select 
                                           className="flex-1 p-3 border border-amber-200 rounded-xl text-xs bg-white outline-none"
                                           value={committeeForm.role}
                                           onChange={e => setCommitteeForm({...committeeForm, role: e.target.value})}
                                       >
                                           <option value="Committee Member">Committee Member</option>
                                           <option value="Committee Head">Committee Head</option>
                                       </select>
                                       <button 
                                           onClick={(e) => handleApplyCommittee(e, comm.id)}
                                           disabled={submittingApp}
                                           className="bg-[#3E2723] text-[#FDB813] px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-black transition-colors"
                                       >
                                           {submittingApp ? "Sending..." : "Submit"}
                                       </button>
                                   </div>
                               </div>
                           </div>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        )}

        {view === 'events' && (
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="font-serif text-3xl font-black uppercase">Events</h3>
                 {isOfficer && <button onClick={() => setShowEventForm(true)} className="bg-[#3E2723] text-[#FDB813] px-5 py-3 rounded-xl font-black uppercase text-[10px]">Create Event</button>}
              </div>
              {showEventForm && (
                  <form onSubmit={handleAddEvent} className="bg-white p-6 rounded-[32px] border-2 border-amber-200 mb-6 space-y-3">
                      <input type="text" placeholder="Event Name" required className="w-full p-3 border rounded-xl text-xs" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value.toUpperCase()})} />
                      <textarea placeholder="Description" className="w-full p-3 border rounded-xl text-xs h-20" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})}></textarea>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Start</label>
                            <input type="date" required className="p-2 border rounded-xl text-xs w-full" value={newEvent.startDate} onChange={e => setNewEvent({...newEvent, startDate: e.target.value})} />
                            <input type="time" required className="p-2 border rounded-xl text-xs w-full mt-1" value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">End</label>
                            <input type="date" required className="p-2 border rounded-xl text-xs w-full" value={newEvent.endDate} onChange={e => setNewEvent({...newEvent, endDate: e.target.value})} />
                            <input type="time" required className="p-2 border rounded-xl text-xs w-full mt-1" value={newEvent.endTime} onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} />
                        </div>
                      </div>
                      <input type="text" placeholder="Venue" required className="w-full p-3 border rounded-xl text-xs" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value.toUpperCase()})} />
                      <input type="text" placeholder="Evaluation Link (Optional)" className="w-full p-3 border rounded-xl text-xs" value={newEvent.evaluationLink} onChange={e => setNewEvent({...newEvent, evaluationLink: e.target.value})} />
                      <div className="flex items-center gap-2 p-2">
                          <input type="checkbox" id="req" checked={newEvent.attendanceRequired} onChange={e => setNewEvent({...newEvent, attendanceRequired: e.target.checked})} />
                          <label htmlFor="req" className="text-xs font-bold text-gray-600">Attendance Required</label>
                      </div>
                      <div className="flex gap-2">
                          <button type="button" onClick={() => setShowEventForm(false)} className="flex-1 p-3 bg-gray-100 rounded-xl text-xs font-bold text-gray-500">Cancel</button>
                          <button type="submit" className="flex-1 p-3 bg-[#3E2723] text-white rounded-xl text-xs font-bold">Save Event</button>
                      </div>
                  </form>
              )}
              {events.length === 0 ? <p className="text-center opacity-50 py-10">No upcoming events.</p> : events.map(ev => {
                 const { day, month } = getEventDateParts(ev.startDate, ev.endDate);
                 const isRegistered = ev.registered?.includes(profile.memberId);
                 const isExpanded = expandedEventId === ev.id;
                 const registeredCount = ev.registered?.length || 0;
                 
                 return (
                 <div key={ev.id} className="bg-white p-6 rounded-[32px] border border-amber-100 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#3E2723] text-[#FDB813] w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black leading-tight">
                                <span className="text-xl font-bold">{day}</span>
                                <span className="text-[10px] uppercase font-bold">{month}</span>
                            </div>
                            <div>
                                <h4 className="font-black text-lg uppercase">{ev.name}</h4>
                                <p className="text-xs opacity-60 font-bold">{ev.venue}</p>
                                <p className="text-[10px] opacity-50">{ev.startTime} - {ev.endTime}</p>
                            </div>
                        </div>
                        {ev.attendanceRequired && <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-[8px] font-black uppercase">Attendance Req.</span>}
                    </div>
                    {/* Render with whitespace-pre-wrap to preserve formatting */}
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{ev.description}</p>
                    
                    {/* Registration Toggle Section */}
                    <div className="border-t border-gray-100 pt-2">
                        <button 
                            onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                            className="w-full flex justify-between items-center text-xs font-bold text-gray-500 hover:text-amber-600"
                        >
                            <span>Registered: {registeredCount}</span>
                            {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        </button>
                        
                        {isExpanded && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-xl max-h-32 overflow-y-auto custom-scrollbar">
                                {registeredCount > 0 ? (
                                    <ul className="space-y-1">
                                        {members
                                            .filter(m => ev.registered?.includes(m.memberId))
                                            .sort((a,b) => (a.name || "").localeCompare(b.name || ""))
                                            .map(m => (
                                                <li key={m.memberId} className="text-[10px] text-gray-600 truncate">• {m.name}</li>
                                            ))
                                        }
                                    </ul>
                                ) : (
                                    <p className="text-[10px] text-gray-400 italic">No one registered yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Event Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 items-center justify-between">
                        <div className="flex gap-2">
                            {/* Registration Button for All Users */}
                            {ev.attendanceRequired && (
                                <button 
                                    onClick={() => handleRegisterEvent(ev)} 
                                    className={`py-2 px-4 rounded-xl text-[10px] font-bold uppercase transition-colors ${isRegistered ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-[#3E2723] text-[#FDB813] hover:bg-black'}`}
                                >
                                    {isRegistered ? "Unregister" : "Register"}
                                </button>
                            )}

                            {ev.evaluationLink && (
                                <a href={ensureAbsoluteUrl(ev.evaluationLink)} target="_blank" rel="noreferrer" className="bg-green-100 text-green-700 py-2 px-4 rounded-xl text-[10px] font-bold uppercase inline-block hover:bg-green-200 transition-colors flex items-center gap-1">
                                    <ExternalLink size={12}/> Post-Event Evaluation
                                </a>
                            )}
                        </div>
                        {isOfficer && (
                            <div className="flex gap-2">
                                {ev.attendanceRequired && (
                                    <button onClick={() => setAttendanceEvent(ev)} className="bg-blue-100 text-blue-700 py-2 px-4 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-200 transition-colors">Attendance Check</button>
                                )}
                                <button onClick={() => handleEditEvent(ev)} className="text-blue-500 text-xs underline">Edit</button>
                                <button onClick={() => handleDeleteEvent(ev.id)} className="text-red-500 text-xs underline">Delete</button>
                            </div>
                        )}
                    </div>
                 </div>
                 );
              })}
           </div>
        )}

        {view === 'announcements' && (
           <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-3xl font-black uppercase">Grind Report</h3>
                {isOfficer && <button onClick={() => setShowAnnounceForm(true)} className="bg-[#3E2723] text-[#FDB813] px-5 py-3 rounded-xl font-black uppercase text-[10px]">Post Notice</button>}
              </div>
              {showAnnounceForm && (
                  <form onSubmit={handlePostAnnouncement} className="bg-white p-6 rounded-[32px] border-2 border-amber-200 mb-6 space-y-3">
                      <input type="text" placeholder="Title" required className="w-full p-3 border rounded-xl text-xs font-bold" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value.toUpperCase()})} />
                      <textarea placeholder="Announcement content..." required className="w-full p-3 border rounded-xl text-xs h-24" value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}></textarea>
                      <div className="flex gap-2">
                          <button type="button" onClick={() => { setShowAnnounceForm(false); setEditingAnnouncement(null); setNewAnnouncement({title:'', content:''}); }} className="flex-1 p-3 bg-gray-100 rounded-xl text-xs font-bold text-gray-500">Cancel</button>
                          <button type="submit" className="flex-1 p-3 bg-[#3E2723] text-white rounded-xl text-xs font-bold">Post Now</button>
                      </div>
                  </form>
              )}
              {announcements.length === 0 ? <p className="text-center opacity-50">No announcements.</p> : announcements.map(ann => (
                 <div key={ann.id} className="bg-white p-8 rounded-[40px] border border-amber-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Megaphone size={64}/></div>
                    <div className="relative z-10">
                       <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black text-xl uppercase text-[#3E2723]">{ann.title}</h4>
                            {isOfficer && (
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditAnnouncement(ann)} className="text-blue-500 text-xs underline">Edit</button>
                                    <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-red-500 text-xs underline">Delete</button>
                                </div>
                            )}
                       </div>
                       <p className="text-xs text-gray-600 leading-relaxed mb-4">{ann.content}</p>
                       <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest">{formatDate(ann.date)}</span>
                    </div>
                 </div>
              ))}
           </div>
        )}

        {view === 'suggestions' && (
           <div className="space-y-6 animate-fadeIn">
              <h3 className="font-serif text-3xl font-black uppercase">Suggestion Box</h3>
              <div className="bg-white p-8 rounded-[40px] border border-amber-100 text-center">
                 <form onSubmit={handlePostSuggestion} className="space-y-4">
                     <MessageSquare size={48} className="mx-auto text-amber-300 mb-4" />
                     <p className="text-sm text-gray-500 font-medium">Drop your thoughts here.</p>
                     <textarea required value={suggestionText} onChange={e => setSuggestionText(e.target.value)} className="w-full p-4 border border-amber-100 rounded-2xl text-xs bg-gray-50 outline-none focus:border-amber-400" placeholder="Type your suggestion anonymously..."></textarea>
                     <button type="submit" className="bg-[#3E2723] text-[#FDB813] px-8 py-3 rounded-xl font-black uppercase text-xs hover:bg-black transition-colors">Submit</button>
                 </form>
              </div>
              <div className="space-y-4 mt-8">
                  {suggestions.map(s => (
                      <div key={s.id} className="bg-white p-6 rounded-3xl border border-amber-50 shadow-sm">
                          <p className="text-sm font-medium text-gray-700">"{s.text}"</p>
                          <p className="text-[10px] text-amber-400 font-black mt-2 uppercase text-right">- {s.authorName}</p>
                      </div>
                  ))}
              </div>
           </div>
        )}

        {view === 'settings' && (
            <div className="bg-white p-10 rounded-[48px] border border-amber-100 shadow-xl space-y-8 animate-fadeIn">
                <div className="flex items-center gap-4 border-b pb-4 border-amber-100">
                    <button onClick={() => setView('home')} className="md:hidden mr-2 text-gray-500 hover:bg-gray-100 p-2 rounded-full"><Users size={20}/></button> {/* Using Users icon as a placeholder for back arrow since ChevronLeft is not imported, or just reuse Users temporarily. Actually, I can use ChevronLeft if I import it, which I did.*/}
                    {/* Better: Use ChevronLeft since it is imported now */}
                    <div className="flex items-center gap-4 w-full">
                         <button onClick={() => setView('home')} className="text-gray-400 hover:text-amber-600 transition-colors">
                             <ChevronLeft size={24} />
                         </button>
                         <div>
                            <h3 className="font-serif text-3xl font-black uppercase">Profile Settings</h3>
                            <button onClick={() => setView('home')} className="text-[10px] font-bold text-gray-400 uppercase hover:text-amber-600 underline decoration-2 underline-offset-4">Back to Dashboard</button>
                         </div>
                    </div>
                </div>
                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                    {/* Read-Only Member ID & Role */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black uppercase mb-2 text-gray-400">Member ID</label>
                            <input type="text" disabled className="w-full p-4 bg-gray-100 rounded-xl font-mono font-bold uppercase text-xs text-gray-500 cursor-not-allowed" value={profile.memberId} />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase mb-2 text-gray-400">Role / Position</label>
                            <input type="text" disabled className="w-full p-4 bg-gray-100 rounded-xl font-mono font-bold uppercase text-xs text-gray-500 cursor-not-allowed" value={profile.positionCategory} />
                        </div>
                    </div>

                    {/* Nickname & Avatar */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black uppercase mb-2 text-gray-500">Nickname</label>
                            <input type="text" className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs" placeholder="Call sign..." value={settingsForm.nickname || ""} onChange={e => setSettingsForm({...settingsForm, nickname: e.target.value})} />
                        </div>
                        <div>
                             <label className="block text-xs font-black uppercase mb-2 text-gray-500">Photo URL</label>
                             <div className="relative">
                                <input type="text" className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs pl-10 truncate" placeholder="https://..." value={settingsForm.photoUrl || ""} onChange={e => setSettingsForm({...settingsForm, photoUrl: e.target.value})} />
                                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                             </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase mb-2 text-gray-500">Full Name</label>
                        <input type="text" className="w-full p-4 bg-gray-50 rounded-xl font-bold uppercase text-xs" value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value.toUpperCase()})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black uppercase mb-2 text-gray-500">Birth Month</label>
                            <select className="w-full p-4 bg-gray-50 rounded-xl font-bold uppercase text-xs" value={settingsForm.birthMonth || ""} onChange={e => setSettingsForm({...settingsForm, birthMonth: e.target.value})}>
                                <option value="">Select</option>
                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase mb-2 text-gray-500">Birth Day</label>
                            <input type="number" min="1" max="31" className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs" value={settingsForm.birthDay || ""} onChange={e => setSettingsForm({...settingsForm, birthDay: e.target.value})} />
                        </div>
                    </div>
                    <div>
                         <label className="block text-xs font-black uppercase mb-2 text-gray-500">Email Address</label>
                         <input type="email" className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xs" value={settingsForm.email} onChange={e => setSettingsForm({...settingsForm, email: e.target.value})} />
                    </div>
                    <button type="submit" disabled={savingSettings} className="bg-[#3E2723] text-[#FDB813] px-8 py-4 rounded-xl font-black uppercase hover:bg-black transition-colors text-xs">
                        {savingSettings ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            </div>
        )}
        
        {view === 'reports' && isAdmin && (
           <div className="space-y-10 animate-fadeIn text-[#3E2723]">
              <div className="flex items-center gap-4 border-b-4 border-[#3E2723] pb-6">
                 <StatIcon icon={TrendingUp} variant="amber" />
                 <div><h3 className="font-serif text-4xl font-black uppercase">Terminal</h3><p className="text-amber-500 font-black uppercase text-[10px]">The Control Roaster</p></div>
              </div>

              {/* Membership Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                      <p className="text-2xl font-black text-[#3E2723]">{financialStats.totalPaid + financialStats.exemptCount}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Paid</p>
                      <p className="text-2xl font-black text-green-600">{financialStats.totalPaid}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Exempt</p>
                      <p className="text-2xl font-black text-blue-600">{financialStats.exemptCount}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Apps</p>
                      <p className="text-2xl font-black text-purple-600">{committeeApps.filter(a => !['accepted','denied'].includes(a.status)).length}</p>
                  </div>
              </div>

              <div className="bg-[#FDB813] p-8 rounded-[40px] border-4 border-[#3E2723] shadow-xl flex items-center justify-between">
                 <div className="flex items-center gap-6"><Banknote size={32}/><div className="leading-tight"><h4 className="font-serif text-2xl font-black uppercase">Daily Cash Key</h4><p className="text-[10px] font-black uppercase opacity-60">Verification Code</p></div></div>
                 <div className="bg-white/40 px-8 py-4 rounded-3xl border-2 border-dashed border-[#3E2723]/20 font-mono text-4xl font-black">{currentDailyKey}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* OPERATIONS & FINANCIALS */}
                 <div className="space-y-6">
                     <div className="bg-white p-8 rounded-[40px] border-2 border-amber-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                             <h4 className="font-black uppercase text-sm">Registration Status</h4>
                             <button onClick={handleToggleRegistration} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase text-white ${hubSettings.registrationOpen ? 'bg-green-500' : 'bg-red-500'}`}>
                                 {hubSettings.registrationOpen ? "OPEN" : "CLOSED"}
                             </button>
                        </div>
                        <hr className="border-amber-100 my-4"/>
                        <h4 className="font-black uppercase text-sm mb-4">Financial Reports</h4>
                        <div className="flex gap-2 mb-4">
                            <select className="flex-1 p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none" value={financialFilter} onChange={e => setFinancialFilter(e.target.value)}>
                                <option value="all">All Semesters</option>
                                {semesterOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="p-3 bg-gray-50 rounded-xl text-center">
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Cash</p>
                                <p className="text-lg font-black text-gray-700">{financialStats.cashCount}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl text-center">
                                <p className="text-[9px] text-gray-400 font-bold uppercase">GCash</p>
                                <p className="text-lg font-black text-gray-700">{financialStats.gcashCount}</p>
                            </div>
                        </div>
                        <button onClick={handleDownloadFinancials} className="w-full bg-[#3E2723] text-[#FDB813] py-3 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2">
                            <FileBarChart size={14}/> Download Report
                        </button>
                     </div>

                     <div className="bg-[#3E2723] p-10 rounded-[50px] border-4 border-[#FDB813] text-white">
                        <h4 className="font-serif text-2xl font-black uppercase mb-6 text-[#FDB813]">Security Vault</h4>
                        {/* Fixed: Use safe access for keys to prevent crashes if undefined */}
                        <div className="space-y-2">
                            <div className="flex justify-between p-4 bg-white/5 rounded-2xl">
                                <span className="text-[10px] font-black uppercase">Officer Key</span>
                                <span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.officerKey || "N/A"}</span>
                            </div>
                            <div className="flex justify-between p-4 bg-white/5 rounded-2xl">
                                <span className="text-[10px] font-black uppercase">Head Key</span>
                                <span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.headKey || "N/A"}</span>
                            </div>
                            <div className="flex justify-between p-4 bg-white/5 rounded-2xl">
                                <span className="text-[10px] font-black uppercase">Comm Key</span>
                                <span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.commKey || "N/A"}</span>
                            </div>
                        </div>
                        <button onClick={handleRotateSecurityKeys} className="w-full mt-4 bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Rotate Keys</button>
                        {/* New Sanitize Button */}
                        <button onClick={handleSanitizeDatabase} className="w-full mt-4 bg-yellow-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2"><Database size={14}/> Sanitize Database</button>
                     </div>
                 </div>
                 
                 {/* Committee Applications Viewer */}
                 <div className="bg-white p-10 rounded-[50px] border border-amber-100 shadow-xl">
                    <h4 className="font-serif text-xl font-black uppercase mb-4 text-[#3E2723]">Committee Applications</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {committeeApps && committeeApps.filter(app => !['accepted','denied'].includes(app.status)).length > 0 ? (
                            committeeApps.filter(app => !['accepted','denied'].includes(app.status)).map(app => (
                                <div key={app.id} className="p-4 bg-amber-50 rounded-2xl text-xs border border-amber-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-black text-sm text-[#3E2723]">{app.name}</p>
                                            <p className="text-[10px] font-mono text-gray-500">{app.memberId}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${
                                            app.status === 'for_interview' ? 'bg-blue-100 text-blue-700' : 
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {app.status === 'for_interview' ? 'Interview' : 'Pending'}
                                        </span>
                                    </div>
                                    <p className="text-amber-700 font-bold mb-3">{app.committee} • {app.role}</p>
                                    <div className="flex gap-2 pt-3 border-t border-amber-200/50">
                                        <button onClick={() => handleUpdateAppStatus(app, 'for_interview')} className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 transition-colors">Interview</button>
                                        <button onClick={() => handleUpdateAppStatus(app, 'accepted')} className="flex-1 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors">Accept</button>
                                        <button onClick={() => handleUpdateAppStatus(app, 'denied')} className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-300 transition-colors">Deny</button>
                                        <button onClick={() => handleDeleteApp(app.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                        <a href={`mailto:${app.email}`} className="p-2 text-blue-400 hover:text-blue-600" title="Email Applicant"><Mail size={14}/></a>
                                    </div>
                                    <p className="text-[8px] text-gray-400 uppercase mt-2 text-right">Applied: {formatDate(app.createdAt?.toDate ? app.createdAt.toDate() : new Date())}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 italic">No pending applications.</p>
                        )}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* MEMBERS VIEW (Registry) */}
        {view === 'members' && isOfficer && (
           <div className="space-y-6 animate-fadeIn text-[#3E2723]">
              <div className="bg-white p-6 rounded-[40px] border border-amber-100 flex justify-between items-center flex-col md:flex-row gap-4">
                 <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl w-full md:w-auto"><Search size={16}/><input type="text" placeholder="Search..." className="bg-transparent outline-none text-[10px] font-black uppercase w-full" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/></div>
                 {/* Added Bulk Email & Export Buttons */}
                 <div className="flex gap-2 w-full md:w-auto justify-end">
                    {/* Filter Dropdown */}
                    <select className="bg-white border border-amber-100 text-[9px] font-black uppercase px-2 rounded-xl outline-none" value={exportFilter} onChange={e => setExportFilter(e.target.value)}>
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="officers">Officers</option>
                        <option value="committee">Committee</option>
                    </select>

                    <button onClick={handleExportCSV} className="bg-green-600 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase flex items-center gap-1"><FileBarChart size={12}/> CSV</button>
                    <button onClick={handleBulkEmail} className="bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase">Email</button>
                    
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleBulkImportCSV} />
                    <button onClick={()=>fileInputRef.current.click()} className="bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase">Import</button>
                 </div>
              </div>
              <div className="bg-white rounded-[40px] border border-amber-100 shadow-xl overflow-x-auto">
                 <table className="w-full text-left uppercase table-fixed min-w-[600px]">
                    <thead className="bg-[#3E2723] text-white font-serif tracking-widest">
                        <tr className="text-[10px]">
                            <th className="p-4 w-12 text-center"><button onClick={toggleSelectAll}>{selectedBaristas.length === paginatedRegistry.length ? <CheckCircle2 size={16} className="text-[#FDB813]"/> : <Plus size={16}/>}</button></th>
                            <th className="p-4 w-1/3">Barista</th>
                            <th className="p-4 w-24 text-center">ID</th>
                            <th className="p-4 w-32 text-center">Designation</th>
                            <th className="p-4 w-24 text-right">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="text-[#3E2723] divide-y divide-amber-50">
                       {paginatedRegistry.map(m => (
                          <tr key={m.id || m.memberId} className="hover:bg-amber-50/50">
                             <td className="p-4 text-center"><button onClick={()=>toggleSelectBarista(m.memberId)}>{selectedBaristas.includes(m.memberId) ? <CheckCircle2 size={18} className="text-[#FDB813]"/> : <div className="w-4 h-4 border-2 border-amber-100 rounded-md mx-auto"></div>}</button></td>
                             <td className="py-4 px-4">
                                {/* FIX: Move div inside td properly */}
                                <div className="flex items-center gap-4">
                                  <img src={getDirectLink(m.photoUrl) || `https://ui-avatars.com/api/?name=${m.name}&background=FDB813&color=3E2723`} className="w-8 h-8 rounded-full object-cover border-2 border-[#3E2723]" />
                                  <div className="min-w-0">
                                      <p className="font-black text-xs truncate">{m.name}</p>
                                      <p className="text-[8px] opacity-60 truncate">"{m.nickname || m.program}"</p>
                                      {/* Added Accolades Display in Row */}
                                      <div className="flex flex-wrap gap-1 mt-1">
                                          {m.accolades?.map((acc, i) => (
                                              <span key={i} title={acc} className="text-[8px] bg-yellow-100 text-yellow-700 px-1 rounded cursor-help">🏆</span>
                                          ))}
                                      </div>
                                  </div>
                                </div>
                             </td>
                             <td className="text-center font-mono font-black text-xs">{m.memberId}</td>
                             <td className="text-center">
                                <div className="flex flex-col gap-1 items-center">
                                    <select className="bg-amber-50 text-[8px] font-black p-1 rounded outline-none w-24 disabled:opacity-50" value={m.positionCategory || "Member"} onChange={e=>handleUpdatePosition(m.memberId, e.target.value, m.specificTitle)} disabled={!isAdmin}>{POSITION_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
                                    <select className="bg-white border border-amber-100 text-[8px] font-black p-1 rounded outline-none w-24 disabled:opacity-50" value={m.specificTitle || "Member"} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, e.target.value)} disabled={!isAdmin}><option value="Member">Member</option>{OFFICER_TITLES.map(t=><option key={t} value={t}>{t}</option>)}{COMMITTEE_TITLES.map(t=><option key={t} value={t}>{t}</option>)}</select>
                                </div>
                             </td>
                             <td className="text-right p-4">
                                 <div className="flex items-center justify-end gap-1">
                                     <button onClick={() => { setAccoladeText(""); setShowAccoladeModal({ memberId: m.memberId }); }} className="text-yellow-500 p-2 hover:bg-yellow-50 rounded-lg" title="Award Accolade"><Trophy size={14}/></button>
                                     {isAdmin && <button onClick={()=>initiateRemoveMember(m.memberId, m.name)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>}
                                 </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

      </main>
    </div>
  );
};

const App = () => {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check local storage first
    const storedProfile = localStorage.getItem('lba_profile');
    if (storedProfile) {
        try {
            setProfile(JSON.parse(storedProfile));
            setLoading(false);
        } catch (e) {
            console.error("Storage parse error", e);
            localStorage.removeItem('lba_profile');
        }
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           await signInWithCustomToken(auth, __initial_auth_token);
        } else {
           await signInAnonymously(auth);
        }
      } catch (err) {}
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
         // Auto-fetch profile if user is already logged in
         try {
             const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), where('uid', '==', currentUser.uid));
             const snap = await getDocs(q);
             if (!snap.empty) {
                 const userData = snap.docs[0].data();
                 setProfile(userData);
                 localStorage.setItem('lba_profile', JSON.stringify(userData));
             } else if (!storedProfile) {
                 // If no profile found and no local storage, maybe this is a new anonymous session or cleared data
             }
         } catch (e) {
             console.warn("Profile fetch error", e); // Use warn instead of error to avoid clutter
             if (e.code === 'permission-denied') {
                 setAuthError("Database Locked: Please go to Firebase Console > Firestore > Rules and change 'allow read, write: if false;' to 'if true;'.");
                 await signOut(auth);
                 localStorage.removeItem('lba_profile');
             } else {
                 setAuthError("Connection Error: " + e.message);
             }
         }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-[#3E2723]"><Loader2 size={40} className="animate-spin mb-4" /><p className="font-black uppercase tracking-widest text-xs animate-pulse">Establishing Secure Connection...</p></div>;
  return profile ? <Dashboard user={user} profile={profile} setProfile={setProfile} logout={() => { setProfile(null); localStorage.removeItem('lba_profile'); signOut(auth); }} /> : <Login user={user} onLoginSuccess={setProfile} initialError={authError} />;
};

export default App;
