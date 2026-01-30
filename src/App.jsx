import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, signOut
} from 'firebase/auth';
import { 
  getFirestore, collection, query, where, onSnapshot, doc, setDoc, 
  updateDoc, addDoc, serverTimestamp, getDocs, limit, deleteDoc, 
  orderBy, writeBatch
} from 'firebase/firestore'; 
import { 
  Users, Calendar, Award, Bell, LogOut, UserCircle, BarChart3, Plus, 
  ShieldCheck, Menu, X, Sparkles, Loader2, Coffee, Star, Users2, 
  Download, Lock, ShieldAlert, BadgeCheck, MapPin, Edit3, Send, 
  Megaphone, Ticket, ToggleLeft, ToggleRight, MessageSquare, 
  TrendingUp, Mail, Trash2, Search, ArrowUpDown, CheckCircle2, 
  Settings2, ChevronLeft, ChevronRight, Facebook, Instagram, 
  LifeBuoy, FileUp, Banknote, AlertTriangle, AlertCircle,
  History, BrainCircuit, FileText, Cake, Camera, User
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
  if (!url) return "";
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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  // FIX: Case-insensitive check for officer role
  const isOfficer = useMemo(() => {
     if (!profile?.positionCategory) return false;
     const pc = profile.positionCategory.toUpperCase();
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
    const unsubLegacy = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), (s) => s.exists() && setLegacyContent(s.data()), (e) => {});
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
      <aside className="w-64 bg-[#3E2723] text-amber-50 md:flex flex-col hidden">
        <div className="p-8 border-b border-amber-900/30 text-center">
           <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-20 h-20 object-contain mx-auto mb-4" />
           <h1 className="font-serif font-black text-[10px] uppercase">LPU Baristas' Association</h1>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={view === item.id ? activeMenuClass : inactiveMenuClass}>
              <item.icon size={18}/><span className="uppercase text-[10px] font-black">{item.label}</span>
            </button>
          ))}
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
              {isBirthday && (
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden flex items-center justify-between mb-8">
                    <div>
                        <h3 className="font-black text-3xl uppercase mb-2">Happy Birthday!</h3>
                        <p className="text-pink-100 font-medium">Wishing you a brew-tiful day filled with joy and coffee! 🎉</p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-full animate-bounce">
                        <Cake size={40} />
                    </div>
                </div>
              )}
              <div className="bg-[#3E2723] rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl border-4 border-[#FDB813]">
                {/* Updated to show nickname and avatar on the main card as requested */}
                <div className="flex items-center gap-6 mb-4">
                     <img src={getDirectLink(profile.photoUrl) || `https://ui-avatars.com/api/?name=${profile.name}&background=FDB813&color=3E2723`} className="w-24 h-24 rounded-full object-cover border-4 border-white/20" />
                     <div>
                        <h3 className="font-serif text-3xl font-black uppercase mb-1">{profile.nickname ? `${profile.nickname}` : profile.name}</h3>
                        <p className="text-[#FDB813] font-black text-lg">"{profile.specificTitle || 'Barista'}"</p>
                     </div>
                </div>
                
                <div className="mt-6 flex flex-wrap gap-2">
                   <div className="bg-[#FDB813] text-[#3E2723] px-5 py-2 rounded-full font-black text-[9px] uppercase">{profile.memberId}</div>
                   <div className="bg-green-500 text-white px-5 py-2 rounded-full font-black text-[9px] uppercase">Active</div>
                   <div className="bg-white/20 text-white px-5 py-2 rounded-full font-black text-[9px] uppercase">{profile.positionCategory}</div>
                   <div className="bg-orange-500 text-white px-5 py-2 rounded-full font-black text-[9px] uppercase">10% B'CAFE</div>
                </div>
              </div>
           </div>
        )}

        {view === 'about' && (
           <div className="bg-white p-10 rounded-[48px] border border-amber-100 shadow-xl space-y-6">
              <div className="flex items-center gap-4 border-b pb-4 border-amber-100">
                 <StatIcon icon={History} variant="amber" />
                 <h3 className="font-serif text-3xl font-black uppercase">Legacy Story</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{legacyContent?.body || "History not yet written."}</p>
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
              </div>
              {events.length === 0 ? <p className="text-center opacity-50 py-10">No upcoming events.</p> : events.map(ev => (
                 <div key={ev.id} className="bg-white p-6 rounded-[32px] border border-amber-100 flex items-center gap-6">
                    <div className="bg-[#3E2723] text-[#FDB813] w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black leading-tight">
                       <span className="text-xl">{new Date(ev.date).getDate()}</span>
                       <span className="text-[8px] uppercase">{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div>
                       <h4 className="font-black text-lg uppercase">{ev.name}</h4>
                       <p className="text-xs opacity-60">{ev.venue} • {ev.time}</p>
                    </div>
                 </div>
              ))}
           </div>
        )}

        {view === 'announcements' && (
           <div className="space-y-6 animate-fadeIn">
              <h3 className="font-serif text-3xl font-black uppercase">Grind Report</h3>
              {announcements.length === 0 ? <p className="text-center opacity-50">No announcements.</p> : announcements.map(ann => (
                 <div key={ann.id} className="bg-white p-8 rounded-[40px] border border-amber-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Megaphone size={64}/></div>
                    <div className="relative z-10">
                       <h4 className="font-black text-xl uppercase text-[#3E2723] mb-2">{ann.title}</h4>
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
                 <MessageSquare size={48} className="mx-auto text-amber-300 mb-4" />
                 <p className="text-sm text-gray-500 font-medium">Drop your thoughts here.</p>
                 <p className="text-xs text-gray-400 mt-2">(Feature coming soon)</p>
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
                    {[{l:'Officer', v:secureKeys?.officerKey||SEED_OFFICER_KEY}, {l:'Head', v:secureKeys?.headKey||SEED_HEAD_KEY}, {l:'Comm', v:secureKeys?.commKey||SEED_COMM_KEY}].map((k,i)=>(<div key={i} className="flex justify-between p-4 bg-white/5 rounded-2xl mb-2"><span className="text-[10px] font-black uppercase">{k.l} Key</span><span className="font-mono text-xl font-black text-[#FDB813]">{k.v}</span></div>))}
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
                 <div className="flex gap-2">
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
                          <tr key={m.memberId} className="hover:bg-amber-50/50">
                             <td className="p-8 text-center"><button onClick={()=>toggleSelectBarista(m.memberId)}>{selectedBaristas.includes(m.memberId) ? <CheckCircle2 size={18} className="text-[#FDB813]"/> : <div className="w-4 h-4 border-2 border-amber-100 rounded-md mx-auto"></div>}</button></td>
                             <td className="py-8">
                                <div className="flex items-center gap-4">
                                  <img src={getDirectLink(m.photoUrl) || `https://ui-avatars.com/api/?name=${m.name}&background=FDB813&color=3E2723`} className="w-10 h-10 rounded-full object-cover border-2 border-[#3E2723]" />
                                  <div><p className="font-black text-xs">{m.name}</p><p className="text-[8px] opacity-60">"{m.nickname || m.program}"</p></div>
                                </div>
                             </td>
                             <td className="text-center font-mono font-black">{m.memberId}</td>
                             <td className="text-center">
                                <select className="bg-amber-50 text-[8px] font-black p-2 rounded-lg outline-none mb-1 block mx-auto" value={m.positionCategory} onChange={e=>handleUpdatePosition(m.memberId, e.target.value, m.specificTitle)}>{POSITION_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
                                <select className="bg-white border border-amber-100 text-[8px] font-black p-2 rounded-lg outline-none block mx-auto" value={m.specificTitle} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, e.target.value)}><option value="Member">Member</option>{OFFICER_TITLES.map(t=><option key={t} value={t}>{t}</option>)}{COMMITTEE_TITLES.map(t=><option key={t} value={t}>{t}</option>)}</select>
                             </td>
                             <td className="text-right pr-8"><button onClick={()=>initiateRemoveMember(m.memberId, m.name)} className="text-red-500 p-2"><Trash2 size={16}/></button></td>
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
