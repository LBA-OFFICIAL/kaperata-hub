import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, signOut
} from 'firebase/auth';
import { 
  getFirestore, collection, query, where, onSnapshot, doc, setDoc, 
  updateDoc, addDoc, serverTimestamp, getDocs, limit, deleteDoc, 
  orderBy, writeBatch, arrayUnion
} from 'firebase/firestore'; 
import { 
  Users, Calendar, Award, Bell, LogOut, UserCircle, BarChart3, Plus, 
  ShieldCheck, Menu, X, Sparkles, Loader2, Coffee, Star, Users2, 
  Download, Lock, ShieldAlert, BadgeCheck, MapPin, Edit3, Send, 
  Megaphone, Ticket, ToggleLeft, ToggleRight, MessageSquare, 
  TrendingUp, Mail, Trash2, Search, ArrowUpDown, CheckCircle2, 
  Settings2, ChevronLeft, ChevronRight, Facebook, Instagram, 
  LifeBuoy, FileUp, Banknote, AlertTriangle, AlertCircle,
  History, BrainCircuit, FileText, Cake, Camera, User, Trophy, Clock
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

// --- Helper Logic ---
const getDirectLink = (url) => {
  if (!url || typeof url !== 'string') return "";
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/[-\w]{25,}/);
    if (idMatch) return `https://lh3.googleusercontent.com/d/${idMatch[0]}`;
  }
  return url;
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
  const padded = String(currentCount + 1).padStart(4, '0');
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
  if (isNaN(d.getTime())) return ""; // Safe check for invalid dates
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Safe date helpers for event rendering
const getEventDay = (dateStr) => {
    if (!dateStr) return "?";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "?" : d.getDate();
};

const getEventMonth = (dateStr) => {
    if (!dateStr) return "???";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "???" : d.toLocaleString('default', { month: 'short' });
};

// --- Components ---

const StatIcon = ({ icon: Icon, variant = 'default' }) => {
  let className = "p-3 rounded-2xl ";
  switch (variant) {
    case 'amber': className += "bg-amber-100 text-amber-600"; break;
    case 'indigo': className += "bg-indigo-100 text-indigo-600"; break;
    case 'green': className += "bg-green-100 text-green-600"; break;
    case 'blue': className += "bg-blue-100 text-blue-600"; break;
    case 'red': className += "bg-red-100 text-red-600"; break;
    default: className += "bg-gray-100 text-gray-600";
  }
  return <div className={className}><Icon size={24} /></div>;
};

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
                            const match = lastMember.memberId.match(/(\d{4,})C?$/);
                            if (match) {
                                currentCount = parseInt(match[1], 10);
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
                    onLoginSuccess(final);
                } else {
                    setStatusMessage('Logging in...');
                    const snap = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), where('memberId', '==', memberIdInput.trim().toUpperCase()), limit(1)));
                    if (snap.empty) throw new Error("ID not found.");
                    const userData = snap.docs[0].data();
                    if (userData.password !== password) throw new Error("Incorrect password.");
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
                  {paymentMethod === 'gcash' ? "GCash: 09XX XXX XXXX" : "Provide Daily Cash Key"}
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
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true, renewalOpen: true });
  const [secureKeys, setSecureKeys] = useState({ officerKey: '', headKey: '', commKey: '' });
  const [legacyContent, setLegacyContent] = useState({ body: "Loading association history..." });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedBaristas, setSelectedBaristas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isImporting, setIsImporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); 
  const fileInputRef = useRef(null);
  const currentDailyKey = getDailyCashPasskey();
  const [settingsForm, setSettingsForm] = useState({ ...profile });
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Interactive Feature States
  const [suggestionText, setSuggestionText] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', description: '', attendanceRequired: false, evaluationLink: '' });
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [isEditingLegacy, setIsEditingLegacy] = useState(false);
  const [legacyForm, setLegacyForm] = useState({ body: '', imageUrl: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  
  // New States for Accolades & Bulk Email
  const [showAccoladeModal, setShowAccoladeModal] = useState(null); // { memberId }
  const [accoladeText, setAccoladeText] = useState("");

  // FIX: Case-insensitive check for officer role
  const isOfficer = useMemo(() => {
     if (!profile?.positionCategory) return false;
     const pc = String(profile.positionCategory).toUpperCase();
     return ['OFFICER', 'EXECOMM', 'COMMITTEE'].includes(pc);
  }, [profile?.positionCategory]);

  // Birthday Logic
  const isBirthday = useMemo(() => {
    if (!profile.birthMonth || !profile.birthDay) return false;
    const today = new Date();
    return parseInt(profile.birthMonth) === (today.getMonth() + 1) && parseInt(profile.birthDay) === today.getDate();
  }, [profile]);

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
    const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (s) => s.exists() && setHubSettings(s.data()), (e) => {});
    const unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (s) => s.exists() && setSecureKeys(s.data()), (e) => {});
    const unsubLegacy = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), (s) => {
         if(s.exists()) {
             setLegacyContent(s.data());
             setLegacyForm(s.data());
         }
    }, (e) => {});
    return () => { unsubReg(); unsubEvents(); unsubAnn(); unsubSug(); unsubOps(); unsubKeys(); unsubLegacy(); };
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
        const updated = { ...profile, ...settingsForm, birthMonth: parseInt(settingsForm.birthMonth), birthDay: parseInt(settingsForm.birthDay) };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), updated);
        setProfile(updated);
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
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { ...newEvent, createdAt: serverTimestamp() });
          setShowEventForm(false);
          setNewEvent({ name: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', description: '', attendanceRequired: false, evaluationLink: '' });
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

  // --- NEW FEATURES ---
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
    if (!isOfficer) return;
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
    // ... Existing bulk import logic ...
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
      // ... same as before
    const headers = "Name,Email,Program,PositionCategory,SpecificTitle";
    const sample = "JUAN DELA CRUZ,juan@lpu.edu.ph,BSIT,Member,Member";
    const blob = new Blob([headers + "\n" + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "LBA_Import_Template.csv";
    a.click();
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
    ...(isOfficer ? [{ id: 'members', label: 'Registry', icon: Users }, { id: 'reports', label: 'Terminal', icon: FileText }] : [])
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

      <aside className="w-64 bg-[#3E2723] text-amber-50 md:flex flex-col hidden">
        <div className="p-8 border-b border-amber-900/30 text-center">
           <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-20 h-20 object-contain mx-auto mb-4" />
           <h1 className="font-serif font-black text-[10px] uppercase">LPU Baristas' Association</h1>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map(item => {
             const active = view === item.id;
             const Icon = item.icon; // Cap variable for JSX
             return (
                <button key={item.id} onClick={() => setView(item.id)} className={active ? activeMenuClass : inactiveMenuClass}>
                  <Icon size={18}/><span className="uppercase text-[10px] font-black">{item.label}</span>
                </button>
             );
          })}
        </nav>
        <div className="p-6 border-t border-amber-900/30"><button onClick={logout} className="flex items-center gap-2 text-red-400 font-black text-[10px] uppercase hover:text-red-300"><LogOut size={16} /> Exit Hub</button></div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h2 className="font-serif text-3xl font-black uppercase text-[#3E2723]">KAPErata Hub</h2>
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
              {/* Profile Card & Notices Grid */}
              <div className="bg-[#3E2723] rounded-[48px] p-8 text-white relative overflow-hidden shadow-2xl border-4 border-[#FDB813] mb-8">
                  {/* ... (Existing Profile Header) ... */}
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
                      <img src={getDirectLink(profile.photoUrl) || `https://ui-avatars.com/api/?name=${profile.name}&background=FDB813&color=3E2723`} className="w-24 h-24 rounded-full object-cover border-4 border-white/20" />
                      <div>
                          <h3 className="font-serif text-3xl font-black uppercase mb-1">{profile.nickname ? `${profile.nickname}` : profile.name}</h3>
                          <p className="text-[#FDB813] font-black text-lg">"{profile.specificTitle || 'Barista'}"</p>
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
                           {events.length === 0 ? <p className="text-xs text-gray-500">No upcoming events.</p> : events.slice(0, 3).map(ev => (
                             <div key={ev.id} className="bg-white p-4 rounded-3xl border border-amber-100 flex items-center gap-4">
                                <div className="bg-[#3E2723] text-[#FDB813] w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black leading-tight shrink-0">
                                   <span className="text-sm">{getEventDay(ev.startDate)}</span>
                                   <span className="text-[8px] uppercase">{getEventMonth(ev.startDate)}</span>
                                </div>
                                <div className="min-w-0">
                                   <h4 className="font-black text-xs uppercase truncate">{ev.name}</h4>
                                   <p className="text-[10px] text-gray-500 truncate">{ev.venue} • {ev.startTime}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                    </div>
                 </div>

                 {/* Right Column: Achievements & History */}
                 <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[32px] border border-amber-100 h-full">
                       <h3 className="font-black text-sm uppercase text-[#3E2723] mb-4 flex items-center gap-2">
                         <Trophy size={16} className="text-amber-500"/> Trophy Case
                       </h3>
                       <div className="grid grid-cols-3 gap-2">
                          {/* Dynamic Badges */}
                          <div title="Member" className="aspect-square bg-amber-50 rounded-2xl flex items-center justify-center text-2xl">☕</div>
                          {isOfficer && <div title="Officer" className="aspect-square bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">🛡️</div>}
                          {/* Safe check for memberId before calculation */}
                          {profile.memberId && (new Date().getFullYear() - 2000 - parseInt(profile.memberId.substring(3,5))) >= 1 && <div title="Veteran" className="aspect-square bg-yellow-50 rounded-2xl flex items-center justify-center text-2xl">🏅</div>}
                          
                          {/* Added Custom Accolades */}
                          {profile.accolades?.map((acc, i) => (
                             <div key={i} title={acc} className="aspect-square bg-purple-50 rounded-2xl flex items-center justify-center text-2xl cursor-help">🏆</div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                 {members.filter(m => ['Officer', 'Execomm', 'Committee'].includes(m.positionCategory)).map(m => (
                    <div key={m.memberId} className="bg-white p-6 rounded-[32px] border border-amber-100 flex flex-col items-center text-center shadow-sm">
                       <img src={`https://ui-avatars.com/api/?name=${m.name}&background=FDB813&color=3E2723`} className="w-20 h-20 rounded-full border-4 border-[#3E2723] mb-4"/>
                       <h4 className="font-black text-xs uppercase mb-1">{m.name}</h4>
                       <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[8px] font-black uppercase">{m.specificTitle}</span>
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
              {events.length === 0 ? <p className="text-center opacity-50 py-10">No upcoming events.</p> : events.map(ev => (
                 <div key={ev.id} className="bg-white p-6 rounded-[32px] border border-amber-100 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#3E2723] text-[#FDB813] w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black leading-tight">
                                <span className="text-xl">{getEventDay(ev.startDate)}</span>
                                <span className="text-[8px] uppercase">{getEventMonth(ev.startDate)}</span>
                            </div>
                            <div>
                                <h4 className="font-black text-lg uppercase">{ev.name}</h4>
                                <p className="text-xs opacity-60 font-bold">{ev.venue}</p>
                                <p className="text-[10px] opacity-50">{ev.startTime} - {ev.endTime}</p>
                            </div>
                        </div>
                        {ev.attendanceRequired && <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-[8px] font-black uppercase">Mandatory</span>}
                    </div>
                    <p className="text-xs text-gray-600">{ev.description}</p>
                    
                    {/* Event Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                        {ev.evaluationLink && (
                            <a href={ev.evaluationLink} target="_blank" rel="noreferrer" className="flex-1 text-center bg-green-100 text-green-700 py-2 rounded-xl text-[10px] font-bold uppercase">Evaluate</a>
                        )}
                        {isOfficer && (
                            <button onClick={() => alert("Attendance report generation coming soon.")} className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-xl text-[10px] font-bold uppercase">Report</button>
                        )}
                    </div>
                 </div>
              ))}
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
                    <StatIcon icon={Settings2} variant="blue" />
                    <h3 className="font-serif text-3xl font-black uppercase">Profile Settings</h3>
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
        
        {view === 'reports' && isOfficer && (
           <div className="space-y-10 animate-fadeIn text-[#3E2723]">
              <div className="flex items-center gap-4 border-b-4 border-[#3E2723] pb-6">
                 <StatIcon icon={TrendingUp} variant="amber" />
                 <div><h3 className="font-serif text-4xl font-black uppercase">Terminal</h3><p className="text-amber-500 font-black uppercase text-[10px]">The Control Roaster</p></div>
              </div>
              <div className="bg-[#FDB813] p-8 rounded-[40px] border-4 border-[#3E2723] shadow-xl flex items-center justify-between">
                 <div className="flex items-center gap-6"><Banknote size={32}/><div className="leading-tight"><h4 className="font-serif text-2xl font-black uppercase">Daily Cash Key</h4><p className="text-[10px] font-black uppercase opacity-60">Verification Code</p></div></div>
                 <div className="bg-white/40 px-8 py-4 rounded-3xl border-2 border-dashed border-[#3E2723]/20 font-mono text-4xl font-black">{currentDailyKey}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-[#3E2723] p-10 rounded-[50px] border-4 border-[#FDB813] text-white">
                    <h4 className="font-serif text-2xl font-black uppercase mb-6 text-[#FDB813]">Security Vault</h4>
                    {/* Fixed: Use safe access for keys to prevent crashes if undefined */}
                    <div className="space-y-2">
                        <div className="flex justify-between p-4 bg-white/5 rounded-2xl">
                            <span className="text-[10px] font-black uppercase">Officer Key</span>
                            <span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.officerKey || SEED_OFFICER_KEY}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-white/5 rounded-2xl">
                            <span className="text-[10px] font-black uppercase">Head Key</span>
                            <span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.headKey || SEED_HEAD_KEY}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-white/5 rounded-2xl">
                            <span className="text-[10px] font-black uppercase">Comm Key</span>
                            <span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.commKey || SEED_COMM_KEY}</span>
                        </div>
                    </div>
                    <button onClick={handleRotateSecurityKeys} className="w-full mt-4 bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Rotate Keys</button>
                 </div>
              </div>
           </div>
        )}

        {/* MEMBERS VIEW (Registry) */}
        {view === 'members' && isOfficer && (
           <div className="space-y-6 animate-fadeIn text-[#3E2723]">
              <div className="bg-white p-6 rounded-[40px] border border-amber-100 flex justify-between items-center">
                 <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl"><Search size={16}/><input type="text" placeholder="Search..." className="bg-transparent outline-none text-[10px] font-black uppercase" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/></div>
                 {/* Added Bulk Email Button */}
                 <div className="flex gap-2">
                    <button onClick={handleBulkEmail} className="bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase">Email</button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleBulkImportCSV} />
                    <button onClick={()=>fileInputRef.current.click()} className="bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase">Import</button>
                    <button onClick={downloadImportTemplate} className="bg-amber-100 px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase">Template</button>
                 </div>
              </div>
              <div className="bg-white rounded-[40px] border border-amber-100 shadow-xl overflow-hidden">
                 <table className="w-full text-left uppercase">
                    <thead className="bg-[#3E2723] text-white font-serif tracking-widest"><tr className="text-[10px]"><th className="p-8 w-12"><button onClick={toggleSelectAll}>{selectedBaristas.length === paginatedRegistry.length ? <CheckCircle2 size={16} className="text-[#FDB813]"/> : <Plus size={16}/>}</button></th><th>Barista</th><th className="text-center">ID</th><th className="text-center">Designation</th><th className="text-right">Manage</th></tr></thead>
                    <tbody className="text-[#3E2723] divide-y divide-amber-50">
                       {paginatedRegistry.map(m => (
                          <tr key={m.id || m.memberId} className="hover:bg-amber-50/50">
                             <td className="p-8 text-center"><button onClick={()=>toggleSelectBarista(m.memberId)}>{selectedBaristas.includes(m.memberId) ? <CheckCircle2 size={18} className="text-[#FDB813]"/> : <div className="w-4 h-4 border-2 border-amber-100 rounded-md mx-auto"></div>}</button></td>
                             <td className="py-8">
                                {/* FIX: Move div inside td properly */}
                                <div className="flex items-center gap-4">
                                  <img src={getDirectLink(m.photoUrl) || `https://ui-avatars.com/api/?name=${m.name}&background=FDB813&color=3E2723`} className="w-10 h-10 rounded-full object-cover border-2 border-[#3E2723]" />
                                  <div>
                                      <p className="font-black text-xs">{m.name}</p>
                                      <p className="text-[8px] opacity-60">"{m.nickname || m.program}"</p>
                                      {/* Added Accolades Display in Row */}
                                      <div className="flex gap-1 mt-1">
                                          {m.accolades?.map((acc, i) => (
                                              <span key={i} title={acc} className="text-[8px] bg-yellow-100 text-yellow-700 px-1 rounded">🏆</span>
                                          ))}
                                      </div>
                                  </div>
                                </div>
                             </td>
                             <td className="text-center font-mono font-black">{m.memberId}</td>
                             <td className="text-center">
                                <select className="bg-amber-50 text-[8px] font-black p-2 rounded-lg outline-none mb-1 block mx-auto" value={m.positionCategory || "Member"} onChange={e=>handleUpdatePosition(m.memberId, e.target.value, m.specificTitle)}>{POSITION_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
                                <select className="bg-white border border-amber-100 text-[8px] font-black p-2 rounded-lg outline-none block mx-auto" value={m.specificTitle || "Member"} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, e.target.value)}><option value="Member">Member</option>{OFFICER_TITLES.map(t=><option key={t} value={t}>{t}</option>)}{COMMITTEE_TITLES.map(t=><option key={t} value={t}>{t}</option>)}</select>
                             </td>
                             <td className="text-right pr-8">
                                 <div className="flex items-center justify-end gap-2">
                                     <button onClick={() => { setAccoladeText(""); setShowAccoladeModal({ memberId: m.memberId }); }} className="text-yellow-500 p-2" title="Award Accolade"><Trophy size={16}/></button>
                                     <button onClick={()=>initiateRemoveMember(m.memberId, m.name)} className="text-red-500 p-2"><Trash2 size={16}/></button>
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
                 setProfile(snap.docs[0].data());
             }
         } catch (e) {
             console.warn("Profile fetch error", e); // Use warn instead of error to avoid clutter
             if (e.code === 'permission-denied') {
                 setAuthError("Database Locked: Please go to Firebase Console > Firestore > Rules and change 'allow read, write: if false;' to 'if true;'.");
                 await signOut(auth);
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
  return profile ? <Dashboard user={user} profile={profile} setProfile={setProfile} logout={() => { setProfile(null); signOut(auth); }} /> : <Login user={user} onLoginSuccess={setProfile} initialError={authError} />;
};

export default App;
