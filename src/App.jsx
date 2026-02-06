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
  TrendingUp, Mail, Trash2, Search, ArrowUpDown, CheckCircle2, 
  Settings2, ChevronLeft, ChevronRight, Facebook, Instagram, 
  LifeBuoy, FileUp, Banknote, AlertTriangle, AlertCircle,
  History, Cake, Camera, User, Trophy, Clock, 
  Briefcase, ClipboardCheck, ChevronDown, ChevronUp, 
  CheckSquare, Music, Database, ExternalLink, Hand, Image as ImageIcon, 
  Link as LinkIcon, RefreshCcw, GraduationCap, PenTool, BookOpen, 
  AlertOctagon, Power, FileText, FileBarChart, MoreVertical
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
// Icon for homescreen shortcut / favicon
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
    { id: 1, title: "Basic Coffee Knowledge & History", short: "Basics" },
    { id: 2, title: "Equipment Familiarization", short: "Equipment" },
    { id: 3, title: "Manual Brewing", short: "Brewing" },
    { id: 4, title: "Espresso Machine", short: "Espresso" },
    { id: 5, title: "Signature Beverage (Advanced)", short: "Sig Bev" }
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

const formatJoinedDate = (dateStr) => {
    if (!dateStr) return "Brewing with LBA";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Brewing with LBA";
    return `Brewing with LBA since ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
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

const MaintenanceBanner = () => (
    <div className="w-full bg-red-600 text-white text-center py-2 px-4 flex items-center justify-center gap-2 font-bold text-xs uppercase animate-pulse z-[100] relative">
        <AlertOctagon size={16} />
        <span>System Under Maintenance</span>
    </div>
);

const StatIcon = ({ icon: Icon, variant = 'default' }) => {
  if (variant === 'amber') return <div className="p-3 rounded-2xl bg-amber-100 text-amber-600"><Icon size={24} /></div>;
  if (variant === 'indigo') return <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600"><Icon size={24} /></div>;
  if (variant === 'green') return <div className="p-3 rounded-2xl bg-green-100 text-green-600"><Icon size={24} /></div>;
  if (variant === 'blue') return <div className="p-3 rounded-2xl bg-blue-100 text-blue-600"><Icon size={24} /></div>;
  if (variant === 'red') return <div className="p-3 rounded-2xl bg-red-100 text-red-600"><Icon size={24} /></div>;
  return <div className="p-3 rounded-2xl bg-gray-100 text-gray-600"><Icon size={24} /></div>;
};

const MemberCard = ({ m }) => (
    <div key={m.memberId || m.name} className="bg-white p-6 rounded-[32px] border border-amber-100 flex flex-col items-center text-center shadow-sm w-full sm:w-64">
       <img src={getDirectLink(m.photoUrl) || `https://ui-avatars.com/api/?name=${m.name}&background=FDB813&color=3E2723`} className="w-20 h-20 rounded-full border-4 border-[#3E2723] mb-4 object-cover"/>
       <h4 className="font-black text-xs uppercase mb-1">{m.name}</h4>
       {m.nickname && <p className="text-[10px] text-gray-500 mb-2">"{m.nickname}"</p>}
       <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[8px] font-black uppercase">{m.specificTitle}</span>
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
  const [membershipType, setMembershipType] = useState('new'); // 'new' or 'renewal'
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(''); 
  const [pendingProfile, setPendingProfile] = useState(null);
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true, maintenanceMode: false });
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
                    let finalMembershipType = membershipType; // Default to selection

                    if (inputKey) {
                        const uk = inputKey.trim().toUpperCase();
                        if (uk === (secureKeys?.officerKey || "KAPERATA_OFFICER_2024").toUpperCase()) { pc = 'Officer'; role = 'admin'; pay = 'exempt'; }
                        else if (uk === (secureKeys?.headKey || "KAPERATA_HEAD_2024").toUpperCase()) { pc = 'Committee'; st = 'Committee Head'; pay = 'exempt'; }
                        else if (uk === (secureKeys?.commKey || "KAPERATA_COMM_2024").toUpperCase()) { pc = 'Committee'; st = 'Committee Member'; pay = 'exempt'; }
                        else throw new Error("Invalid key.");
                        
                        // Officers/Committees are always Renewal
                        finalMembershipType = 'renewal';
                    }

                    // --- TRANSACTION BLOCK FOR SAFE ID GENERATION ---
                    setStatusMessage('Finalizing registration...');
                    
                    const registryRef = collection(db, 'artifacts', appId, 'public', 'data', 'registry');
                    const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters');
                    
                    // Pre-calculate fallback count by scanning for max ID in registry
                    let fallbackCount = 0;
                    try {
                        const allDocs = await getDocs(registryRef);
                        if (!allDocs.empty) {
                             let maxIdNum = 0;
                             allDocs.forEach(d => {
                                 const mId = d.data().memberId;
                                 // Robust regex to capture numeric part: LBAyy-sem[XXXX]suffix
                                 const match = mId.match(/-(\d)(\d{4,})C?$/); 
                                 if (match && match[2]) {
                                     const num = parseInt(match[2], 10);
                                     if (num > maxIdNum) maxIdNum = num;
                                 }
                             });
                             fallbackCount = maxIdNum;
                        }
                    } catch(e) { console.warn("Fallback count fetch failed", e); }

                    // Transaction
                    const newProfile = await runTransaction(db, async (transaction) => {
                         const counterSnap = await transaction.get(counterRef);
                         let nextCount;
                         
                         // Determine start count: Max of (stored counter, actual registry max)
                         const storedCount = counterSnap.exists() ? (counterSnap.data().memberCount || 0) : 0;
                         const baseCount = Math.max(storedCount, fallbackCount);
                         nextCount = baseCount + 1;

                         // Generate ID and check for collision
                         let assignedId = generateLBAId(pc, nextCount - 1); 
                         let memberRef = doc(registryRef, assignedId);
                         let memberSnap = await transaction.get(memberRef);
                         
                         // Retry loop for collisions (increased to 20 for safety)
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

                        // Write
                        if (pc !== 'Member') {
                             transaction.set(memberRef, profileData);
                             transaction.set(counterRef, { memberCount: nextCount }, { merge: true });
                             return profileData; // Return fully created profile
                        } else {
                             return profileData;
                        }
                    });

                    // Post-Transaction Handling
                    if (pc !== 'Member') {
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
                    
                    // Fallback count again (Robust Max Finding)
                    let fallbackCount = 0;
                    try {
                        const allDocs = await getDocs(registryRef);
                        if (!allDocs.empty) {
                             let maxIdNum = 0;
                             allDocs.forEach(d => {
                                 const mId = d.data().memberId;
                                 const match = mId.match(/-(\d)(\d{4,})C?$/); 
                                 if (match && match[2]) {
                                     const num = parseInt(match[2], 10);
                                     if (num > maxIdNum) maxIdNum = num;
                                 }
                             });
                             fallbackCount = maxIdNum;
                        }
                    } catch(e) {}

                    const finalProfile = await runTransaction(db, async (transaction) => {
                         const counterSnap = await transaction.get(counterRef);
                         let nextCount;
                         const storedCount = counterSnap.exists() ? (counterSnap.data().memberCount || 0) : 0;
                         const baseCount = Math.max(storedCount, fallbackCount);
                         nextCount = baseCount + 1;

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
                             memberId: assignedId, // Update ID to the safely generated one
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
  const feeAmount = pendingProfile?.membershipType === 'renewal' ? "50.00" : "100.00";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4 text-[#3E2723] relative">
      {hubSettings.maintenanceMode && <MaintenanceBanner />}
      {showForgotModal && (
         <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[40px] max-w-sm w-full p-10 shadow-2xl border-t-[12px] border-[#FDB813] text-center">
               <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6"><LifeBuoy size={32}/></div>
               <h4 className="font-serif text-2xl font-black uppercase">Account Recovery</h4>
               <p className="text-sm font-medium text-amber-950 mt-4">Contact an officer at:</p>
               <a href={`mailto:${SOCIAL_LINKS.pr_email}`} className="text-[#3E2723] font-black underline block mt-2 text-xs">{SOCIAL_LINKS.pr_email}</a>
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
               <p className="text-center font-black text-sm uppercase text-[#3E2723]">Total Fee: ₱{feeAmount}</p>
               <div className="flex gap-2">
                  <button type="button" onClick={() => setPaymentMethod('gcash')} className={paymentMethod === 'gcash' ? activeBtnClass : inactiveBtnClass}>GCash</button>
                  <button type="button" onClick={() => setPaymentMethod('cash')} className={paymentMethod === 'cash' ? activeBtnClass : inactiveBtnClass}>Cash</button>
               </div>
               <div className="p-4 bg-amber-50 rounded-2xl text-[10px] font-black text-amber-900 text-center uppercase">
                  {/* Updated GCash number */}
                  {paymentMethod === 'gcash' ? "GCash: +639063751402" : "Provide Daily Cash Key"}
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
      <DataPrivacyFooter />
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
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true, renewalOpen: true, maintenanceMode: false });
  const [secureKeys, setSecureKeys] = useState({ officerKey: '', headKey: '', commKey: '' });
  const [legacyContent, setLegacyContent] = useState({ body: "Loading association history...", achievements: [], imageSettings: { objectFit: 'cover', objectPosition: 'center' } });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Masterclass State
  const [masterclassData, setMasterclassData] = useState({ certTemplate: '', moduleAttendees: { 1: [], 2: [], 3: [], 4: [], 5: [] }, moduleDetails: {} });
  const [showCertificate, setShowCertificate] = useState(false);
  const [adminMcModule, setAdminMcModule] = useState(1);
  const [adminMcInput, setAdminMcInput] = useState('');
  const [editingMcCurriculum, setEditingMcCurriculum] = useState(false);
  const [tempMcDetails, setTempMcDetails] = useState({ title: '', objectives: '', topics: '' });

  // Anniversary State
  const [isAnniversary, setIsAnniversary] = useState(false);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({ joinedDate: '' });

  // Email Modal State (NEW)
  const [emailModal, setEmailModal] = useState({ isOpen: false, app: null, type: '', subject: '', body: '' });

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
  
  // Password Change State
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  // Temp Shift State for Event Creation
  const [tempShift, setTempShift] = useState({ 
    date: '', 
    type: 'WHOLE_DAY', // 'WHOLE DAY' or 'SHIFT'
    name: '', // e.g. 'AM', 'PM', '10:00-12:00'
    capacity: 5 
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [expandedCommittee, setExpandedCommittee] = useState(null);
  const [financialFilter, setFinancialFilter] = useState('all');
  const [expandedEventId, setExpandedEventId] = useState(null); 
  
  // Legacy Editing State
  const [isEditingLegacy, setIsEditingLegacy] = useState(false);
  const [legacyForm, setLegacyForm] = useState({ body: '', imageUrl: '', galleryUrl: '', achievements: [], establishedDate: '', imageSettings: { objectFit: 'cover', objectPosition: 'center' } });
  const [tempAchievement, setTempAchievement] = useState({ date: '', text: '' });

  // Interactive Feature States
  const [suggestionText, setSuggestionText] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  // Updated newEvent state to include volunteer-specific fields
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

  // Volunteer Stats
  const volunteerCount = useMemo(() => {
    if (!events || !profile.memberId) return 0;
    return events.reduce((acc, ev) => {
        if (!ev.isVolunteer || !ev.shifts) return acc;
        // Count how many shifts in this event the user volunteered for
        const shiftCount = ev.shifts.filter(s => s.volunteers?.includes(profile.memberId)).length;
        return acc + shiftCount;
    }, 0);
  }, [events, profile.memberId]);

  // Notifications Logic
  const notifications = useMemo(() => {
      const hasNew = (items, pageKey) => {
          if (!items || items.length === 0) return false;
          const lastVisit = lastVisited[pageKey];
          if (!lastVisit) return true; // Never visited -> show dot
          // Check if any item created AFTER last visit
          return items.some(i => {
              const d = i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt || 0);
              return d > new Date(lastVisit);
          });
      };

      // Committee Hunt Logic
      let huntNotify = false;
      if (isOfficer) {
          // Officers see dot if pending apps exist
          huntNotify = committeeApps.some(a => a.status === 'pending');
      } else {
          // Members see dot if their app status updated recently
          huntNotify = userApplications.some(a => {
             const updated = a.statusUpdatedAt?.toDate ? a.statusUpdatedAt.toDate() : null;
             const lastVisit = lastVisited['committee_hunt'];
             if (!updated) return false;
             return !lastVisit || updated > new Date(lastVisit);
          });
      }

      // Registry Logic (Officers only)
      let regNotify = false;
      if (isOfficer) {
          regNotify = hasNew(members.map(m => ({ createdAt: m.joinedDate })), 'members');
      }

      return {
          events: hasNew(events, 'events'),
          announcements: hasNew(announcements, 'announcements'),
          suggestions: hasNew(suggestions, 'suggestions'),
          committee_hunt: huntNotify,
          members: regNotify
      };
  }, [events, announcements, suggestions, members, committeeApps, userApplications, lastVisited, isOfficer]);

  useEffect(() => {
    if (!user) return;
    const unsubReg = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), (s) => {
        const list = s.docs.map(d => ({ id: d.id, ...d.data() }));
        setMembers(list);
        
        // Sync current user profile if it exists in the registry fetch
        const myData = list.find(m => m.memberId === profile.memberId);
        if (myData) {
            // Compare timestamps or critical fields to avoid unnecessary renders if possible
            if (JSON.stringify(myData) !== JSON.stringify(profile)) {
                setProfile(myData);
                localStorage.setItem('lba_profile', JSON.stringify(myData));
            }
        }
    }, (e) => console.error("Registry sync error:", e));

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

    // --- ADDED: Set Icons in Head ---
    const setIcons = () => {
        const head = document.head;
        let linkIcon = document.querySelector("link[rel~='icon']");
        if (!linkIcon) {
            linkIcon = document.createElement('link');
            linkIcon.rel = 'icon';
            head.appendChild(linkIcon);
        }
        linkIcon.href = APP_ICON_URL;

        let linkApple = document.querySelector("link[rel='apple-touch-icon']");
        if (!linkApple) {
            linkApple = document.createElement('link');
            linkApple.rel = 'apple-touch-icon';
            head.appendChild(linkApple);
        }
        linkApple.href = APP_ICON_URL;
    };
    setIcons();
    // --------------------------------

    const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (s) => s.exists() && setHubSettings(s.data()), (e) => {});
    const unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (s) => s.exists() && setSecureKeys(s.data()), (e) => {});
    const unsubLegacy = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), (s) => {
         if(s.exists()) {
             setLegacyContent(s.data());
             const data = s.data();
             setLegacyForm({ 
                 ...data, 
                 achievements: data.achievements || [], // Ensure array exists
                 imageUrl: data.imageUrl || '',
                 galleryUrl: data.galleryUrl || '',
                 imageSettings: data.imageSettings || { objectFit: 'cover', objectPosition: 'center' }
             });
             
             // Check Anniversary
             if (data.establishedDate) {
                 const today = new Date();
                 const est = new Date(data.establishedDate);
                 if (today.getMonth() === est.getMonth() && today.getDate() === est.getDate()) {
                     setIsAnniversary(true);
                 }
             }
         }
    }, (e) => {});
    
    // Masterclass Data
    const unsubMC = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), (s) => {
        if(s.exists()) {
            setMasterclassData(s.data());
        } else {
            // Init if not exists
            const initData = { certTemplate: '', moduleAttendees: { 1: [], 2: [], 3: [], 4: [], 5: [] }, moduleDetails: {} };
            setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), initData);
        }
    });

    return () => { 
        unsubReg(); unsubEvents(); unsubAnn(); unsubSug(); unsubOps(); unsubKeys(); unsubLegacy(); unsubMC();
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
        // Note: setProfile is also called by the real-time listener in Dashboard
        setProfile(updated);
        localStorage.setItem('lba_profile', JSON.stringify(updated));
        alert("Profile updated successfully!");
    } catch(err) {
        console.error(err);
        alert("Failed to update profile.");
    } finally {
        setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e) => {
      e.preventDefault();
      if (passwordForm.new !== passwordForm.confirm) {
          alert("New passwords do not match.");
          return;
      }
      if (passwordForm.current !== profile.password) {
          alert("Incorrect current password.");
          return;
      }
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), {
              password: passwordForm.new
          });
          const updatedProfile = { ...profile, password: passwordForm.new };
          setProfile(updatedProfile);
          localStorage.setItem('lba_profile', JSON.stringify(updatedProfile));
          setPasswordForm({ current: '', new: '', confirm: '' });
          alert("Password changed successfully.");
      } catch (err) {
          console.error(err);
          alert("Failed to change password.");
      }
  };

  const handleDeleteSuggestion = async (id) => {
    if(!confirm("Are you sure you want to delete this suggestion?")) return;
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', id));
    } catch(err) { console.error(err); }
  };

  const handlePostSuggestion = async (e) => {
      e.preventDefault();
      if (!suggestionText.trim()) return;
      try {
          // Use 'Anonymous' as authorName
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), {
              text: suggestionText,
              authorId: profile.memberId,
              authorName: "Anonymous",
              createdAt: serverTimestamp()
          });
          setSuggestionText("");
          alert("Suggestion submitted anonymously!");
      } catch (err) { console.error(err); }
  };

  // Form handling for shifts
  const addShift = () => {
    if (!tempShift.date) return;
    const sessionName = tempShift.type === 'WHOLE_DAY' ? 'Whole Day' : (tempShift.name || 'Shift');
    
    setNewEvent(prev => ({
        ...prev,
        shifts: [...prev.shifts, { 
            id: crypto.randomUUID(), 
            date: tempShift.date,
            session: sessionName,
            capacity: tempShift.capacity,
            volunteers: [] 
        }]
    }));
    // Keep date for convenience, reset name
    setTempShift(prev => ({ ...prev, name: '' })); 
  };
  
  const removeShift = (id) => {
    setNewEvent(prev => ({
        ...prev,
        shifts: prev.shifts.filter(s => s.id !== id)
    }));
  };

  // Legacy Achievements Handling
  const handleAddAchievement = () => {
      if (!tempAchievement.text.trim()) return;
      const newAch = { 
          text: tempAchievement.text.trim(),
          date: tempAchievement.date || new Date().toISOString().split('T')[0]
      };
      // Sort immediately
      const updatedList = [...(legacyForm.achievements || []), newAch].sort((a,b) => new Date(a.date) - new Date(b.date));
      
      setLegacyForm(prev => ({
          ...prev,
          achievements: updatedList
      }));
      setTempAchievement({ date: '', text: '' });
  };

  const handleUpdateAchievement = (index, field, value) => {
      const updated = [...legacyForm.achievements];
      updated[index] = { ...updated[index], [field]: value };
      // Resort
      updated.sort((a,b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
      setLegacyForm(prev => ({ ...prev, achievements: updated }));
  };

  const handleRemoveAchievement = (index) => {
      setLegacyForm(prev => ({
          ...prev,
          achievements: prev.achievements.filter((_, i) => i !== index)
      }));
  };

  const handleAddEvent = async (e) => {
      e.preventDefault();
      try {
          // Prepare payload
          const eventPayload = { 
              ...newEvent, 
              name: newEvent.name.toUpperCase(),
              venue: newEvent.venue.toUpperCase(),
              createdAt: serverTimestamp(), 
              attendees: [], 
              registered: [] 
          };

          if (editingEvent) {
             delete eventPayload.createdAt; // Don't overwrite creation time
             await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEvent.id), eventPayload);
             setEditingEvent(null);
          } else {
             await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), eventPayload);
          }
          setShowEventForm(false);
          // Reset form including volunteer fields
          setNewEvent({ name: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', description: '', attendanceRequired: false, evaluationLink: '', isVolunteer: false, openForAll: true, volunteerTarget: { officer: 0, committee: 0, member: 0 }, shifts: [], masterclassModuleIds: [], scheduleType: 'WHOLE_DAY' });
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
          evaluationLink: ev.evaluationLink || '',
          isVolunteer: ev.isVolunteer || false,
          openForAll: ev.openForAll !== undefined ? ev.openForAll : true,
          volunteerTarget: ev.volunteerTarget || { officer: 0, committee: 0, member: 0 },
          shifts: ev.shifts || [],
          masterclassModuleIds: ev.masterclassModuleIds || (ev.masterclassModuleId ? [ev.masterclassModuleId] : []),
          scheduleType: ev.scheduleType || 'WHOLE_DAY'
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
          // 1. Update Event Attendance
          if (isPresent) {
              await updateDoc(eventRef, { attendees: arrayRemove(memberId) });
          } else {
              await updateDoc(eventRef, { attendees: arrayUnion(memberId) });
          }

          // 2. Sync with Masterclass Tracker if applicable
          if (attendanceEvent.masterclassModuleIds && attendanceEvent.masterclassModuleIds.length > 0) {
             const trackerRef = doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker');
             const updates = {};
             attendanceEvent.masterclassModuleIds.forEach(modId => {
                 const fieldPath = `moduleAttendees.${modId}`;
                 updates[fieldPath] = isPresent ? arrayRemove(memberId) : arrayUnion(memberId);
             });
             await updateDoc(trackerRef, updates);
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

  // Volunteer Shift Signup
  const handleVolunteerSignup = async (ev, shiftId) => {
      const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', ev.id);
      
      // We need to clone the shifts array, modify the specific shift, and update
      const updatedShifts = ev.shifts.map(shift => {
          if (shift.id === shiftId) {
              const isVolunteered = shift.volunteers.includes(profile.memberId);
              if (isVolunteered) {
                  return { ...shift, volunteers: shift.volunteers.filter(id => id !== profile.memberId) };
              } else {
                  if (shift.volunteers.length >= shift.capacity) {
                      alert("This shift is full!");
                      return shift; // No change
                  }
                  return { ...shift, volunteers: [...shift.volunteers, profile.memberId] };
              }
          }
          return shift;
      });

      // Optimistic UI update could happen here, but Firestore listener handles it mostly
      try {
         await updateDoc(eventRef, { shifts: updatedShifts });
      } catch(err) { console.error("Volunteer signup error", err); }
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

  // Registry Manual Edit Function
  const handleUpdateMemberDetails = async (e) => {
      e.preventDefault();
      if (!editingMember) return;
      
      try {
          // Use .id which is the actual document key, rather than .memberId which is a field
          const docId = editingMember.id || editingMember.memberId;
          const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', docId);
          await updateDoc(memberRef, { joinedDate: new Date(editMemberForm.joinedDate).toISOString() });
          setEditingMember(null);
          alert("Member details updated.");
      } catch(err) {
          console.error(err);
          alert("Failed to update member: " + err.message);
      }
  };

  // Masterclass Admin Functions
  const handleBulkAddMasterclass = async () => {
      if (!adminMcInput.trim()) return;
      const ids = adminMcInput.split(/[\n,]+/).map(id => id.trim().toUpperCase()).filter(id => id);
      
      const currentAttendees = masterclassData.moduleAttendees?.[adminMcModule] || [];
      const updatedAttendees = [...new Set([...currentAttendees, ...ids])];
      
      const newData = {
          ...masterclassData,
          moduleAttendees: {
              ...masterclassData.moduleAttendees,
              [adminMcModule]: updatedAttendees
          }
      };
      
      try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), newData);
          setAdminMcInput('');
          alert(`Added ${ids.length} attendees to Module ${adminMcModule}`);
      } catch(e) { console.error(e); }
  };

  const handleSaveCertTemplate = async () => {
      try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), masterclassData);
          alert("Template Saved");
      } catch(e) { console.error(e); }
  };

  const handleSaveMcCurriculum = async () => {
      try {
          const newData = {
              ...masterclassData,
              moduleDetails: { ...masterclassData.moduleDetails, [adminMcModule]: tempMcDetails }
          };
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), newData);
          setEditingMcCurriculum(false);
          alert("Curriculum Updated");
      } catch(e) { console.error(e); }
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
              createdAt: serverTimestamp(),
              statusUpdatedAt: serverTimestamp() // Add this so member gets notification
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
  // Initiate Action (Open Email Modal)
  const initiateAppAction = (app, type) => {
      let subject = "";
      let body = "";
      const signature = "\n\nBest regards,\nLPU Baristas' Association";

      if (type === 'for_interview') {
          subject = `LBA Committee Application: Interview Invitation`;
          body = `Dear ${app.name},\n\nWe have reviewed your application for the ${app.committee} and would like to invite you for an interview.\n\nPlease let us know your availability.\n${signature}`;
      } else if (type === 'accepted') {
          subject = `LBA Committee Application: Congratulations!`;
          body = `Dear ${app.name},\n\nWe are pleased to inform you that you have been accepted as a ${app.role} for the ${app.committee}!\n\nWelcome to the team! We will add you to the group chat shortly.\n${signature}`;
      } else if (type === 'denied') {
          subject = `LBA Committee Application Update`;
          body = `Dear ${app.name},\n\nThank you for your interest in joining the LBA Committee. After careful consideration, we regret to inform you that we cannot move forward with your application at this time.\n\nWe encourage you to stay active and apply again in the future.\n${signature}`;
      }

      setEmailModal({ isOpen: true, app, type, subject, body });
  };

  // Confirm Action from Modal
  const confirmAppAction = async () => {
      if (!emailModal.app) return;
      
      try {
          const { app, type, subject, body } = emailModal;
          const batch = writeBatch(db);
          const appRef = doc(db, 'artifacts', appId, 'public', 'data', 'applications', app.id);
          
          const updates = { 
              status: type,
              statusUpdatedAt: serverTimestamp(),
              lastEmailSent: new Date().toISOString()
          };
          
          batch.update(appRef, updates);

          if (type === 'accepted') {
              const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', app.memberId);
              batch.update(memberRef, {
                  accolades: arrayUnion(`${app.committee} - ${app.role}`)
              });
          }

          await batch.commit();
          
          // Open Email Client
          window.location.href = `mailto:${app.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          
          setEmailModal({ isOpen: false, app: null, type: '', subject: '', body: '' });
          alert("Status updated and email client opened!");
      } catch (err) { console.error(err); alert("Error updating status."); }
  };

  const handleDeleteApp = async (id) => {
      if (!confirm("Delete this application?")) return;
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', id));
      } catch(err) { console.error(err); }
  };

  const handleToggleRegistration = async () => {
      try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), {
              ...hubSettings,
              registrationOpen: !hubSettings.registrationOpen
          });
      } catch (err) { console.error(err); }
  };

  const handleToggleMaintenance = async () => {
      try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), {
              ...hubSettings,
              maintenanceMode: !hubSettings.maintenanceMode
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

  const handleMigrateToRenewal = async () => {
      if(!confirm("This will update ALL current members to 'Renewal' status. Proceed?")) return;
      
      const batch = writeBatch(db);
      try {
          // Get all members with 'new' status or undefined status
          const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'));
          const snapshot = await getDocs(q);
          let count = 0;
          
          snapshot.forEach(doc => {
              const data = doc.data();
              if (data.membershipType !== 'renewal') {
                  batch.update(doc.ref, { membershipType: 'renewal' });
                  count++;
              }
          });
          
          if(count > 0) {
              await batch.commit();
              alert(`Migration Complete: ${count} members updated to Renewal status.`);
          } else {
              alert("No members needed updating.");
          }
      } catch (err) {
          console.error(err);
          alert("Migration failed.");
      }
  };
  
  const handleToggleStatus = async (memberId, currentStatus) => {
      if (!confirm(`Change status to ${currentStatus === 'active' ? 'EXPIRED' : 'ACTIVE'}?`)) return;
      try {
          const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberId);
          await updateDoc(memberRef, { status: currentStatus === 'active' ? 'expired' : 'active' });
      } catch(e) { console.error(e); }
  };

  // User Acknowledgment
  const handleAcknowledgeApp = async (appId) => {
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', appId), {
              acknowledged: true
          });
      } catch (err) { console.error(err); }
  };

  // Special Recovery Function for specific incident
  const handleRecoverLostData = async () => {
      if(!confirm("This will restore David (Fixed ID), Geremiah & Cassandra (New Sequential IDs). Continue?")) return;
      
      try {
          // 1. Get the current highest count to determine new IDs for G & C
          const registryRef = collection(db, 'artifacts', appId, 'public', 'data', 'registry');
          const allDocs = await getDocs(registryRef);
          let maxCount = 0;
          
          allDocs.forEach(doc => {
              const mid = doc.data().memberId;
              const match = mid.match(/-(\d)(\d{4,})C?$/);
              if (match) {
                  const num = parseInt(match[2], 10);
                  if (num > maxCount) maxCount = num;
              }
          });

          // 2. Prepare Data
          const batch = writeBatch(db);
          const meta = getMemberIdMeta(); // Use current semester for G & C new IDs
          
          // David: Fixed ID
          const davidId = "LBA2526-20007C";
          const davidRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', davidId);
          batch.set(davidRef, {
             name: "DAVID MATTHEW ADRIAS",
             memberId: davidId,
             email: "david.adrias@lpu.edu.ph", 
             program: "BSIT", 
             positionCategory: "Committee", 
             specificTitle: "Committee Member", 
             role: "member", 
             status: "active",
             paymentStatus: "exempt",
             joinedDate: new Date().toISOString(),
             password: "LBA" + davidId.slice(-5),
             uid: "recovered_david_" + Date.now(),
             membershipType: "renewal"
          });

          // Geremiah: New ID
          const geremiahCount = maxCount + 1;
          const geremiahId = generateLBAId("Committee", geremiahCount - 1);
          const geremiahRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', geremiahId);
          batch.set(geremiahRef, {
             name: "GEREMIAH HERNANI",
             memberId: geremiahId,
             email: "geremiah.hernani@lpu.edu.ph",
             program: "BSIT",
             positionCategory: "Committee",
             specificTitle: "Committee Member",
             role: "member",
             status: "active",
             paymentStatus: "exempt",
             joinedDate: new Date().toISOString(),
             password: "LBA" + geremiahId.slice(-5),
             uid: "recovered_geremiah_" + Date.now(),
             membershipType: "renewal"
          });

          // Cassandra: New ID
          const cassandraCount = maxCount + 2;
          const cassandraId = generateLBAId("Committee", cassandraCount - 1);
          const cassandraRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', cassandraId);
          batch.set(cassandraRef, {
             name: "CASSANDRA CASIPIT",
             memberId: cassandraId,
             email: "cassandra.casipit@lpu.edu.ph",
             program: "BSIT",
             positionCategory: "Committee",
             specificTitle: "Committee Member",
             role: "member",
             status: "active",
             paymentStatus: "exempt",
             joinedDate: new Date().toISOString(),
             password: "LBA" + cassandraId.slice(-5),
             uid: "recovered_cassandra_" + Date.now(),
             membershipType: "renewal"
          });

          // Update counter
          const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters');
          batch.set(counterRef, { memberCount: cassandraCount }, { merge: true });

          await batch.commit();
          alert(`Recovery successful!\nDavid: ${davidId}\nGeremiah: ${geremiahId}\nCassandra: ${cassandraId}`);
      } catch (err) {
          console.error(err);
          alert("Recovery failed: " + err.message);
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

  const handleResetPassword = async (memberId, email, name) => {
    if (!confirm(`Reset password for ${name}?`)) return;
    const tempPassword = "LBA-" + Math.random().toString(36).slice(-6).toUpperCase();
    
    const subject = "LBA Password Reset Request";
    const body = `Dear ${name},

We received a request to reset the password associated with your membership account at LPU Baristas' Association.
To regain access to your account, please use the following credentials. For security purposes, we recommend you copy and paste these details directly to avoid errors.

Member ID: ${memberId}
Temporary Password: ${tempPassword}

How to Access Your Account:
Click the link below to access the secure login portal:
${window.location.origin}

Enter your Member ID and the Temporary Password provided above.
Once logged in, you will be prompted to create a new, permanent password immediately.

Please Note:
This temporary password will expire in 1 hour (manual enforcement required).
If you did not request this password reset, please contact our support team immediately at lbaofficial.pr@gmail.com and do not click the link above.

Thank you,
The LPU Baristas' Association Support Team
${window.location.origin}`;

    try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberId), {
            password: tempPassword
        });
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        alert("Password reset! Opening email client...");
    } catch (err) {
        console.error(err);
        alert("Failed to reset password.");
    }
  };

  // Registry Helpers
  const filteredRegistry = useMemo(() => {
    let res = [...members];
    if (searchQuery) res = res.filter(m => (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())) || (m.memberId && m.memberId.toLowerCase().includes(searchQuery.toLowerCase())));
    res.sort((a, b) => (a[sortConfig.key] || "").localeCompare(b[sortConfig.key] || "") * (sortConfig.direction === 'asc' ? 1 : -1));
    return res;
  }, [members, searchQuery, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredRegistry.length / itemsPerPage);
  const paginatedRegistry = filteredRegistry.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const nextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage(p => Math.max(p - 1, 1));


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
             // Changed default status to 'expired' per requirement
             const data = { name: name.toUpperCase(), email: email.toLowerCase(), program: prog || "UNSET", positionCategory: pos || "Member", specificTitle: title || pos || "Member", memberId: mid, role: pos === 'Officer' ? 'admin' : 'member', status: 'expired', paymentStatus: pos !== 'Member' ? 'exempt' : 'unpaid', lastRenewedSem: meta.sem, lastRenewedSY: meta.sy, password: "LBA" + mid.slice(-5), joinedDate: new Date().toISOString() };
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

  // Suggestion Download Helper
  const handleDownloadSuggestions = () => {
    // Filter suggestions locally for the last 7 days
    const filteredSuggestions = suggestions.filter(s => {
        if (!s.createdAt) return true; 
        const date = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return date > oneWeekAgo;
    });

    const headers = ["Date", "Suggestion"];
    const rows = filteredSuggestions.map(s => [
        s.createdAt?.toDate ? formatDate(s.createdAt.toDate()) : "Just now",
        s.text
    ]);
    generateCSV(headers, rows, `LBA_Suggestions_${new Date().toISOString().split('T')[0]}.csv`);
  };


  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    // Removed Settings from menu
    { id: 'about', label: 'Legacy Story', icon: History },
    { id: 'masterclass', label: 'Masterclass', icon: GraduationCap },
    { id: 'team', label: 'Brew Crew', icon: Users },
    { id: 'events', label: "What's Brewing?", icon: Calendar, hasNotification: notifications.events },
    { id: 'announcements', label: 'Grind Report', icon: Bell, hasNotification: notifications.announcements },
    { id: 'suggestions', label: 'Suggestion Box', icon: MessageSquare, hasNotification: notifications.suggestions },
    { id: 'committee_hunt', label: 'Committee Hunt', icon: Briefcase, hasNotification: notifications.committee_hunt }, // Added new tab
    ...(isOfficer ? [{ id: 'members', label: 'Registry', icon: Users, hasNotification: notifications.members }] : []),
    ...(isAdmin ? [{ id: 'reports', label: 'Terminal', icon: FileText }] : [])
  ];

  const activeMenuClass = "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all bg-[#FDB813] text-[#3E2723] shadow-lg font-black relative";
  const inactiveMenuClass = "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-amber-200/40 hover:bg-white/5 relative";

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row text-[#3E2723] font-sans relative">
      {hubSettings.maintenanceMode && <MaintenanceBanner />}
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

      {/* --- EMAIL MODAL --- */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 max-w-lg w-full border-b-[8px] border-[#3E2723]">
                <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Send Update Email</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Subject</label>
                        <input type="text" className="w-full p-3 border rounded-xl text-xs font-bold" value={emailModal.subject} onChange={e => setEmailModal({...emailModal, subject: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Message Body</label>
                        <textarea className="w-full p-3 border rounded-xl text-xs h-32" value={emailModal.body} onChange={e => setEmailModal({...emailModal, body: e.target.value})} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setEmailModal({ isOpen: false, app: null, type: '', subject: '', body: '' })} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                        <button onClick={confirmAppAction} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">Update & Open Email</button>
                    </div>
                    <p className="text-[9px] text-gray-400 text-center italic">This will update the status in the database and launch your default email app to send the message.</p>
                </div>
            </div>
        </div>
      )}
      
      {/* Edit Member Modal */}
      {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white rounded-[32px] p-8 max-w-sm w-full border-b-[8px] border-[#3E2723]">
                  <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Edit Member Details</h3>
                  <form onSubmit={handleUpdateMemberDetails} className="space-y-4">
                      <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Joined Date</label>
                          <input 
                              type="date" 
                              required 
                              className="w-full p-3 border rounded-xl text-xs font-bold" 
                              value={editMemberForm.joinedDate} 
                              onChange={e => setEditMemberForm({...editMemberForm, joinedDate: e.target.value})} 
                          />
                          <p className="text-[9px] text-gray-400 mt-1">This date appears on their profile card.</p>
                      </div>
                      <div className="flex gap-3 pt-4">
                          <button type="button" onClick={() => setEditingMember(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                          <button type="submit" className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">Save</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Certificate Modal */}
      {showCertificate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
              <div className="relative max-w-4xl w-full">
                  <button onClick={() => setShowCertificate(false)} className="absolute -top-12 right-0 text-white hover:text-amber-400"><X size={32}/></button>
                  {masterclassData.certTemplate ? (
                      <div className="relative bg-white shadow-2xl rounded-lg overflow-hidden">
                          <img src={getDirectLink(masterclassData.certTemplate)} alt="Certificate" className="w-full h-auto" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center pt-20">
                              <h2 className="font-serif text-3xl md:text-5xl font-black text-[#3E2723] uppercase tracking-widest text-center px-4 mb-4">{profile.name}</h2>
                              <p className="font-serif text-lg md:text-2xl text-amber-700 font-bold uppercase">Certified Master Barista</p>
                              <p className="font-mono text-sm md:text-lg text-gray-500 mt-8">{new Date().toLocaleDateString()}</p>
                          </div>
                      </div>
                  ) : (
                      <div className="bg-white p-8 rounded-2xl text-center">
                          <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4"/>
                          <h3 className="font-bold text-xl mb-2">Certificate Template Missing</h3>
                          <p className="text-sm text-gray-500">The administration has not uploaded the certificate design yet.</p>
                      </div>
                  )}
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
                        {attendanceEvent.masterclassModuleIds && attendanceEvent.masterclassModuleIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {attendanceEvent.masterclassModuleIds.map(mid => (
                                    <span key={mid} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[8px] font-black uppercase rounded-full">
                                        Module {mid}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleDownloadAttendance} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200" title="Download List"><Download size={20}/></button>
                        <button onClick={() => setAttendanceEvent(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                    </div>
                </div>
                
                {(() => {
                    // Filter members who registered for this event
                    let targetList = members;
                    if (attendanceEvent.isVolunteer && attendanceEvent.shifts) {
                        const volunteerIds = attendanceEvent.shifts.flatMap(s => s.volunteers);
                        targetList = members.filter(m => volunteerIds.includes(m.memberId));
                    } else if (attendanceEvent.registered && attendanceEvent.registered.length > 0) {
                        targetList = members.filter(m => attendanceEvent.registered.includes(m.memberId));
                    }
                    
                    const sortedMembers = [...targetList].sort((a,b) => (a.name || "").localeCompare(b.name || ""));

                    return (
                        <>
                            <div className="flex justify-between items-center mb-4 px-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Registered List</span>
                                <span className="text-xs font-bold bg-[#3E2723] text-[#FDB813] px-3 py-1 rounded-full">
                                    Present: {attendanceEvent.attendees?.length || 0} / {targetList.length}
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
                <button key={item.id} onClick={() => { setView(item.id); updateLastVisited(item.id); setMobileMenuOpen(false); }} className={active ? activeMenuClass : inactiveMenuClass}>
                  <Icon size={18}/>
                  <span className="uppercase text-[10px] font-black">{item.label}</span>
                  {item.hasNotification && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm"></div>
                  )}
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-10">
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
                {/* Birthday & Anniversary Banners */}
                <div className="space-y-4">
                    {isBirthday && (
                        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 rounded-[40px] shadow-xl flex items-center gap-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Cake size={120} /></div>
                            <div className="bg-white/20 p-4 rounded-full text-white"><Cake size={40} /></div>
                            <div className="text-white z-10">
                                <h3 className="font-serif text-3xl font-black uppercase">Happy Birthday!</h3>
                                <p className="font-medium text-white/90">Wishing you the happiest of days, {profile.nickname || profile.name.split(' ')[0]}! 🎂</p>
                            </div>
                        </div>
                    )}
                    {isAnniversary && (
                        <div className="bg-gradient-to-r from-[#FDB813] to-amber-500 p-8 rounded-[40px] shadow-xl flex items-center gap-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} /></div>
                            <div className="bg-white/20 p-4 rounded-full text-white"><Sparkles size={40} /></div>
                            <div className="text-white z-10">
                                <h3 className="font-serif text-3xl font-black uppercase">Happy Anniversary, LBA!</h3>
                                <p className="font-medium text-white/90">Celebrating another year of brewing excellence and community. ☕✨</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Applicant Dashboard: Status Card */}
                {userApplications.filter(a => !a.acknowledged).length > 0 && (
                    <div className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm mb-8">
                        <h4 className="font-black text-sm uppercase text-[#3E2723] mb-4 flex items-center gap-2">
                            <Briefcase size={16} className="text-amber-500"/> Your Applications
                        </h4>
                        <div className="space-y-3">
                            {userApplications.filter(a => !a.acknowledged).map(app => (
                                <div key={app.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                                    <div>
                                        <p className="font-bold text-xs uppercase text-[#3E2723]">{app.committee}</p>
                                        <p className="text-[10px] text-gray-500">{app.role}</p>
                                        {/* Special Messages for Accepted/Denied */}
                                        {app.status === 'accepted' && (
                                            <p className="text-[9px] text-green-700 font-medium mt-1 max-w-xs">
                                                Congratulations! Welcome to the {app.committee} Team as a {app.role}. You will be added to the group chat shortly.
                                            </p>
                                        )}
                                        {app.status === 'denied' && (
                                            <p className="text-[9px] text-red-700 font-medium mt-1 max-w-xs">
                                                Thank you for your interest in joining the LBA Committee. For further clarification regarding your application status, please feel free to contact any of the officers.
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                            app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                            app.status === 'denied' ? 'bg-red-100 text-red-700' :
                                            app.status === 'for_interview' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {app.status === 'for_interview' ? 'For Interview - Check Email' : (app.status || 'Submitted - For Review')}
                                        </span>
                                        <p className="text-[8px] text-gray-400 mt-1">{formatDate(app.createdAt?.toDate ? app.createdAt.toDate() : new Date())}</p>
                                        
                                        {/* Acknowledge Button for Accepted/Denied */}
                                        {(app.status === 'accepted' || app.status === 'denied') && (
                                            <button 
                                                onClick={() => handleAcknowledgeApp(app.id)}
                                                className="mt-2 flex items-center gap-1 bg-gray-200 text-gray-600 px-2 py-1 rounded-lg text-[8px] font-bold hover:bg-[#3E2723] hover:text-[#FDB813] transition-colors"
                                                title="Acknowledge and Hide"
                                            >
                                                <CheckSquare size={10} /> Okay
                                            </button>
                                        )}
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
                            <p className="text-white/60 font-bold text-[10px] uppercase mt-2 italic flex items-center gap-1"><Star size={10}/> {formatJoinedDate(profile.joinedDate)}</p>
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
                            {announcements.length === 0 ? 
                                <div className="p-6 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
                                    <p className="text-xs font-bold text-gray-400 uppercase">All caught up!</p>
                                    <p className="text-[10px] text-gray-300">No new notices to display.</p>
                                </div>
                            : announcements.slice(0, 2).map(ann => (
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
                            {events.length === 0 ? 
                                <div className="p-6 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
                                    <Calendar size={24} className="mx-auto text-gray-300 mb-2"/>
                                    <p className="text-xs font-bold text-gray-400 uppercase">No upcoming events</p>
                                    <p className="text-[10px] text-gray-300">Stay tuned for future updates!</p>
                                </div>
                            : events.slice(0, 3).map(ev => {
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
                            
                            {/* Officer Badge - Specific */}
                            {['Officer', 'Execomm'].includes(profile.positionCategory) && (
                                <div className="flex flex-col items-center gap-1">
                                    <div title="Officer" className="w-full aspect-square bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">🛡️</div>
                                    <span className="text-[8px] font-black uppercase text-indigo-900/60 text-center">Officer</span>
                                </div>
                            )}

                            {/* Committee Badge - New */}
                            {profile.positionCategory === 'Committee' && (
                                <div className="flex flex-col items-center gap-1">
                                    <div title="Committee" className="w-full aspect-square bg-pink-50 rounded-2xl flex items-center justify-center text-2xl">🎗️</div>
                                    <span className="text-[8px] font-black uppercase text-pink-900/60 text-center">Committee</span>
                                </div>
                            )}
                            
                            {/* Safe check for memberId before calculation */}
                            {profile.memberId && (new Date().getFullYear() - 2000 - parseInt(profile.memberId.substring(3,5))) >= 1 && (
                                <div className="flex flex-col items-center gap-1">
                                    <div title="Veteran" className="w-full aspect-square bg-yellow-50 rounded-2xl flex items-center justify-center text-2xl">🏅</div>
                                    <span className="text-[8px] font-black uppercase text-yellow-900/60 text-center">Veteran</span>
                                </div>
                            )}

                            {/* Volunteer Tier Badge */}
                            {volunteerCount > 0 && (
                                <div className="flex flex-col items-center gap-1">
                                    {(() => {
                                        let tier = { icon: '🤚', label: 'Volunteer', color: 'bg-teal-50 text-teal-900/60' };
                                        if (volunteerCount >= 15) tier = { icon: '👑', label: 'Super Vol.', color: 'bg-rose-100 text-rose-900/60' };
                                        else if (volunteerCount >= 9) tier = { icon: '🚀', label: 'Adv. Vol.', color: 'bg-purple-100 text-purple-900/60' };
                                        else if (volunteerCount >= 4) tier = { icon: '🔥', label: 'Inter. Vol.', color: 'bg-orange-100 text-orange-900/60' };
                                        
                                        return (
                                            <>
                                                <div title={`Volunteered for ${volunteerCount} shifts`} className={`w-full aspect-square rounded-2xl flex items-center justify-center text-2xl ${tier.color.split(' ')[0]}`}>{tier.icon}</div>
                                                <span className={`text-[8px] font-black uppercase ${tier.color.split(' ')[1]} text-center`}>{tier.label}</span>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* MASTERCLASS BADGES */}
                            {(() => {
                                const myBadges = [];
                                let completedCount = 0;
                                DEFAULT_MASTERCLASS_MODULES.forEach(mod => {
                                    if (masterclassData.moduleAttendees?.[mod.id]?.includes(profile.memberId)) {
                                        completedCount++;
                                        const icons = ["🌱", "⚙️", "💧", "☕", "🍹"];
                                        const title = masterclassData.moduleDetails?.[mod.id]?.title || mod.title;
                                        const short = mod.short; // Keep original short name for badge, or could derive new one
                                        myBadges.push(
                                            <div key={`mc-${mod.id}`} className="flex flex-col items-center gap-1">
                                                <div title={`Completed: ${title}`} className="w-full aspect-square bg-green-50 rounded-2xl flex items-center justify-center text-xl cursor-help border border-green-100">{icons[mod.id-1]}</div>
                                                <span className="text-[8px] font-black uppercase text-green-800 text-center leading-tight">{short}</span>
                                            </div>
                                        );
                                    }
                                });
                                if (completedCount === 5) {
                                    myBadges.unshift(
                                        <div key="mc-master" className="flex flex-col items-center gap-1">
                                            <div title="Certified Master Barista" className="w-full aspect-square bg-gradient-to-br from-amber-300 to-amber-500 rounded-2xl flex items-center justify-center text-2xl cursor-help shadow-lg border-2 border-white">🎓</div>
                                            <span className="text-[8px] font-black uppercase text-amber-700 text-center leading-tight">Master</span>
                                        </div>
                                    );
                                }
                                return myBadges;
                            })()}
                            
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

            {/* --- MISSING VIEWS IMPLEMENTATION --- */}

            {view === 'about' && (
                <div className="space-y-8 animate-fadeIn text-[#3E2723]">
                    {legacyContent.imageUrl && (
                        <div className="w-full h-64 md:h-80 rounded-[40px] overflow-hidden mb-8 shadow-xl">
                            <img src={getDirectLink(legacyContent.imageUrl)} alt="Legacy Banner" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border-t-[8px] border-[#3E2723]">
                        <h3 className="font-serif text-4xl font-black uppercase mb-4">Our Legacy</h3>
                        {isEditingLegacy ? (
                            <div className="space-y-4">
                                <textarea className="w-full p-4 border rounded-xl" rows="6" value={legacyForm.body} onChange={e => setLegacyForm({ ...legacyForm, body: e.target.value })} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder="Banner Image URL" className="p-3 border rounded-xl text-xs" value={legacyForm.imageUrl || ''} onChange={e => setLegacyForm({ ...legacyForm, imageUrl: e.target.value })} />
                                    <input type="text" placeholder="Gallery Folder Link" className="p-3 border rounded-xl text-xs" value={legacyForm.galleryUrl || ''} onChange={e => setLegacyForm({ ...legacyForm, galleryUrl: e.target.value })} />
                                </div>
                                <div className="flex gap-2">
                                    <input type="date" className="p-3 border rounded-xl" value={legacyForm.establishedDate || ''} onChange={e => setLegacyForm({ ...legacyForm, establishedDate: e.target.value })} />
                                    <button onClick={handleSaveLegacy} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold uppercase">Save Changes</button>
                                    <button onClick={() => setIsEditingLegacy(false)} className="bg-gray-200 text-gray-600 px-6 py-2 rounded-xl font-bold uppercase">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg leading-relaxed whitespace-pre-wrap font-medium text-gray-700">{legacyContent.body}</p>
                                {legacyContent.galleryUrl && (
                                    <a href={legacyContent.galleryUrl} target="_blank" rel="noreferrer" className="inline-block mt-4 text-amber-600 font-bold underline">View Photo Gallery</a>
                                )}
                                {isAdmin && <button onClick={() => setIsEditingLegacy(true)} className="block mt-4 text-amber-600 text-xs font-bold uppercase hover:underline">Edit Story</button>}
                            </div>
                        )}
                    </div>
                    <div className="bg-[#3E2723] text-white p-8 rounded-[40px]">
                        <h3 className="font-serif text-2xl font-black uppercase mb-6 text-[#FDB813]">Milestones</h3>
                        <div className="space-y-6 border-l-2 border-[#FDB813] pl-6 ml-2">
                            {legacyContent.achievements?.map((ach, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-[31px] top-1 w-4 h-4 bg-[#FDB813] rounded-full border-2 border-[#3E2723]"></div>
                                    <span className="text-xs font-bold text-amber-200/60 uppercase tracking-widest">{ach.date}</span>
                                    <p className="font-bold text-lg">{ach.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {view === 'masterclass' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Masterclass</h3>
                            <p className="text-amber-600 font-bold text-xs uppercase">School of Coffee Excellence</p>
                        </div>
                        <button onClick={() => setShowCertificate(true)} className="bg-[#3E2723] text-[#FDB813] px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-black transition-colors w-full md:w-auto justify-center"><Award size={16}/> View Certificate</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {DEFAULT_MASTERCLASS_MODULES.map(mod => {
                            const isCompleted = masterclassData.moduleAttendees?.[mod.id]?.includes(profile.memberId);
                            const details = masterclassData.moduleDetails?.[mod.id] || {};
                            return (
                                <div key={mod.id} className={`p-6 rounded-[32px] border-2 transition-all ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 opacity-80'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isCompleted ? 'bg-green-200' : 'bg-gray-100'}`}>
                                            {["🌱", "⚙️", "💧", "☕", "🍹"][mod.id-1]}
                                        </div>
                                        {isCompleted && <BadgeCheck className="text-green-600" size={24}/>}
                                    </div>
                                    <h4 className="font-black uppercase text-sm text-[#3E2723] mb-1">{details.title || mod.title}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Module 0{mod.id}</p>
                                    
                                    {details.objectives && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{details.objectives}</p>}

                                    {isCompleted ? (
                                        <div className="mt-4 text-[10px] font-bold text-green-700 uppercase bg-green-100 px-3 py-1 rounded-full inline-block">Completed</div>
                                    ) : (
                                        <div className="mt-4 text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-3 py-1 rounded-full inline-block">Locked</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {isAdmin && (
                        <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-200 mt-8 space-y-4">
                            <h4 className="font-black text-sm uppercase text-amber-800 mb-4 flex items-center gap-2"><Settings2 size={16}/> Admin Controls</h4>
                            
                            <div className="flex flex-col md:flex-row gap-4">
                                <select className="p-3 rounded-xl border border-amber-200 text-xs font-bold uppercase" value={adminMcModule} onChange={e => {
                                    setAdminMcModule(e.target.value);
                                    const details = masterclassData.moduleDetails?.[e.target.value] || {};
                                    setTempMcDetails(details);
                                }}>
                                    {DEFAULT_MASTERCLASS_MODULES.map(m => <option key={m.id} value={m.id}>Module {m.id}: {m.short}</option>)}
                                </select>
                                <textarea placeholder="Paste Member IDs (one per line or comma separated)" className="flex-1 p-3 rounded-xl border border-amber-200 text-xs" rows="1" value={adminMcInput} onChange={e => setAdminMcInput(e.target.value)}></textarea>
                                <button onClick={handleBulkAddMasterclass} className="bg-amber-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-amber-700">Add Attendees</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-amber-200">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-amber-800 mb-1 block">Certificate Template URL</label>
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 p-3 rounded-xl border border-amber-200 text-xs" value={masterclassData.certTemplate || ''} onChange={e => setMasterclassData({...masterclassData, certTemplate: e.target.value})} />
                                        <button onClick={handleSaveCertTemplate} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold uppercase text-xs">Save</button>
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button onClick={() => setEditingMcCurriculum(true)} className="w-full bg-[#3E2723] text-[#FDB813] px-6 py-3 rounded-xl font-black uppercase text-xs">Edit Curriculum for Module {adminMcModule}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Curriculum Modal */}
                    {editingMcCurriculum && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                            <div className="bg-white rounded-[32px] p-8 max-w-lg w-full border-b-[8px] border-[#3E2723]">
                                <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Edit Curriculum: Module {adminMcModule}</h3>
                                <div className="space-y-4">
                                    <input type="text" placeholder="Workshop Title" className="w-full p-3 border rounded-xl text-xs font-bold" value={tempMcDetails.title || ''} onChange={e => setTempMcDetails({...tempMcDetails, title: e.target.value})} />
                                    <textarea placeholder="Objectives" className="w-full p-3 border rounded-xl text-xs" rows="3" value={tempMcDetails.objectives || ''} onChange={e => setTempMcDetails({...tempMcDetails, objectives: e.target.value})} />
                                    <textarea placeholder="Topics Covered" className="w-full p-3 border rounded-xl text-xs" rows="3" value={tempMcDetails.topics || ''} onChange={e => setTempMcDetails({...tempMcDetails, topics: e.target.value})} />
                                    <div className="flex gap-3">
                                        <button onClick={() => setEditingMcCurriculum(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs">Cancel</button>
                                        <button onClick={handleSaveMcCurriculum} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-[#FDB813] font-bold uppercase text-xs">Save Curriculum</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === 'team' && (
                <div className="space-y-12 animate-fadeIn text-center">
                    <div>
                        <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723] mb-2">The Brew Crew</h3>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Executive Committee {getMemberIdMeta().sy}</p>
                    </div>

                    {/* Tier 1: President */}
                    {teamStructure.tier1.length > 0 && (
                        <div className="flex justify-center">
                            {teamStructure.tier1.map(m => <MemberCard key={m.id} m={m} />)}
                        </div>
                    )}

                    {/* Tier 2: Secretary (VP is Tier 3 in logic but effectively high) */}
                    {teamStructure.tier2.length > 0 && (
                        <div className="flex justify-center gap-6 flex-wrap">
                            {teamStructure.tier2.map(m => <MemberCard key={m.id} m={m} />)}
                        </div>
                    )}

                    {/* Tier 3: Other Officers */}
                    {teamStructure.tier3.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                            {teamStructure.tier3.map(m => <MemberCard key={m.id} m={m} />)}
                        </div>
                    )}

                    <div className="border-t border-amber-100 pt-12">
                        <h3 className="font-serif text-2xl font-black uppercase text-[#3E2723] mb-8">Committee Heads</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                            {teamStructure.committees.heads.map(m => <MemberCard key={m.id} m={m} />)}
                        </div>
                    </div>

                    {teamStructure.committees.members.length > 0 && (
                        <div className="border-t border-amber-100 pt-12">
                            <h3 className="font-serif text-2xl font-black uppercase text-[#3E2723] mb-8">Committee Members</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                                {teamStructure.committees.members.map(m => <MemberCard key={m.id} m={m} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === 'events' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center">
                        <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">What's Brewing?</h3>
                        {isAdmin && <button onClick={() => setShowEventForm(true)} className="bg-[#3E2723] text-white p-3 rounded-xl hover:bg-black"><Plus size={20}/></button>}
                    </div>

                    {showEventForm && (
                        <div className="bg-white p-6 rounded-[32px] border-2 border-amber-200 mb-6">
                            <h4 className="font-black uppercase mb-4">Add New Event</h4>
                            <form onSubmit={handleAddEvent} className="space-y-3">
                                <input type="text" placeholder="Event Name" required className="w-full p-3 border rounded-xl text-xs font-bold uppercase" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} />
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-500">Start</label>
                                        <div className="flex gap-1">
                                            <input type="date" required className="p-2 border rounded-xl text-xs w-full" value={newEvent.startDate} onChange={e => setNewEvent({...newEvent, startDate: e.target.value})} />
                                            <input type="time" required className="p-2 border rounded-xl text-xs w-full" value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-500">End</label>
                                        <div className="flex gap-1">
                                            <input type="date" className="p-2 border rounded-xl text-xs w-full" value={newEvent.endDate} onChange={e => setNewEvent({...newEvent, endDate: e.target.value})} />
                                            <input type="time" className="p-2 border rounded-xl text-xs w-full" value={newEvent.endTime} onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <input type="text" placeholder="Venue" required className="w-full p-3 border rounded-xl text-xs font-bold uppercase" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} />
                                <textarea placeholder="Description" className="w-full p-3 border rounded-xl text-xs" rows="3" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
                                
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block">Link to Masterclass Modules (Optional)</label>
                                    <div className="grid grid-cols-2 gap-2 p-3 border rounded-xl bg-gray-50 max-h-40 overflow-y-auto">
                                        {DEFAULT_MASTERCLASS_MODULES.map(m => (
                                            <label key={m.id} className="flex items-center gap-2 text-xs font-bold cursor-pointer hover:bg-gray-100 p-1 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-gray-300 text-[#3E2723] focus:ring-[#3E2723]"
                                                    checked={newEvent.masterclassModuleIds?.includes(String(m.id))}
                                                    onChange={(e) => {
                                                        const currentIds = newEvent.masterclassModuleIds || [];
                                                        if (e.target.checked) {
                                                            setNewEvent({...newEvent, masterclassModuleIds: [...currentIds, String(m.id)]});
                                                        } else {
                                                            setNewEvent({...newEvent, masterclassModuleIds: currentIds.filter(id => id !== String(m.id))});
                                                        }
                                                    }}
                                                />
                                                <span className="truncate">M{m.id}: {m.short}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="isVol" checked={newEvent.isVolunteer} onChange={e => setNewEvent({...newEvent, isVolunteer: e.target.checked})} />
                                        <label htmlFor="isVol" className="text-xs font-bold uppercase">Enable Volunteer Signups</label>
                                    </div>

                                    {newEvent.isVolunteer && (
                                        <div className="p-4 bg-amber-50 rounded-xl space-y-4 border border-amber-100">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Schedule Type</label>
                                                <div className="flex gap-2">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setTempShift({...tempShift, type: 'WHOLE_DAY'})}
                                                        className={`flex-1 py-2 text-xs font-bold rounded-lg border ${tempShift.type === 'WHOLE_DAY' ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-gray-200 text-gray-500'}`}
                                                    >
                                                        Whole Day
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setTempShift({...tempShift, type: 'SHIFT'})}
                                                        className={`flex-1 py-2 text-xs font-bold rounded-lg border ${tempShift.type === 'SHIFT' ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-gray-200 text-gray-500'}`}
                                                    >
                                                        Specific Shifts
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <input type="date" className="p-2 border rounded-lg text-xs w-1/3" value={tempShift.date} onChange={e => setTempShift({...tempShift, date: e.target.value})} />
                                                    <input type="number" placeholder="Cap" className="p-2 border rounded-lg text-xs w-16" value={tempShift.capacity} onChange={e => setTempShift({...tempShift, capacity: parseInt(e.target.value)})} min="1" />
                                                    
                                                    {tempShift.type === 'SHIFT' ? (
                                                        <input 
                                                            type="text" 
                                                            placeholder="Shift Name (e.g. AM, 1-4PM)" 
                                                            className="p-2 border rounded-lg text-xs flex-1" 
                                                            value={tempShift.name} 
                                                            onChange={e => setTempShift({...tempShift, name: e.target.value})} 
                                                        />
                                                    ) : (
                                                        <div className="p-2 bg-gray-100 rounded-lg text-xs text-gray-500 flex-1 flex items-center justify-center font-bold italic">
                                                            Whole Day Event
                                                        </div>
                                                    )}
                                                </div>
                                                <button type="button" onClick={addShift} className="w-full py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors">Add to Schedule</button>
                                            </div>
                                            
                                            {newEvent.shifts.length > 0 && (
                                                <div className="space-y-1 pt-2 border-t border-amber-200/50">
                                                    {newEvent.shifts.map(s => (
                                                        <div key={s.id} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-gray-200">
                                                            <div>
                                                                <span className="font-bold text-[#3E2723]">{formatDate(s.date)}</span>
                                                                <span className="mx-2 text-gray-300">|</span>
                                                                <span className="text-gray-600">{s.session}</span>
                                                                <span className="ml-2 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">Cap: {s.capacity}</span>
                                                            </div>
                                                            <button type="button" onClick={() => removeShift(s.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12}/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowEventForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs hover:bg-gray-200">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">Post Event</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="space-y-4">
                        {events.map(ev => {
                            const { day, month } = getEventDateParts(ev.startDate, ev.endDate);
                            const isRegistered = ev.registered?.includes(profile.memberId);
                            const isExpanded = expandedEventId === ev.id;
                            
                            // Determine display tags
                            const isMultiShift = ev.shifts && ev.shifts.some(s => s.session !== 'Whole Day' && s.session !== 'WHOLE_DAY');
                            
                            return (
                                <div key={ev.id} className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    {isAdmin && (
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <button onClick={() => setAttendanceEvent(ev)} className="p-2 bg-blue-100 text-blue-600 rounded-full" title="Attendance"><ClipboardCheck size={16}/></button>
                                            <button onClick={() => handleDeleteEvent(ev.id)} className="p-2 bg-red-100 text-red-600 rounded-full"><Trash2 size={16}/></button>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <div className="bg-[#3E2723] text-[#FDB813] w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black leading-none shrink-0">
                                            <span className="text-2xl">{day}</span>
                                            <span className="text-xs uppercase mt-1">{month}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <h4 className="font-serif text-xl font-black uppercase text-[#3E2723]">{ev.name}</h4>
                                                <div className="flex flex-wrap gap-1 justify-end">
                                                    {ev.isVolunteer && (
                                                        <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase whitespace-nowrap ${isMultiShift ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {isMultiShift ? 'Multi-Shift' : 'Whole Day'}
                                                        </span>
                                                    )}
                                                    {ev.masterclassModuleIds && ev.masterclassModuleIds.length > 0 && ev.masterclassModuleIds.map(mid => (
                                                        <span key={mid} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[8px] font-black uppercase whitespace-nowrap">
                                                            M{mid}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mt-1 flex items-center gap-2">
                                                <MapPin size={12}/> {ev.venue} • <Clock size={12}/> {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}
                                            </p>
                                            <div className={`text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}>
                                                {ev.description}
                                            </div>
                                            {ev.description && ev.description.length > 150 && (
                                                <button 
                                                    onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                                                    className="text-amber-600 text-xs font-bold uppercase mt-2 hover:underline"
                                                >
                                                    {isExpanded ? 'Show Less' : 'Read More'}
                                                </button>
                                            )}
                                            
                                            {ev.isVolunteer ? (
                                                <div className="mt-6 space-y-2">
                                                    <p className="text-xs font-black uppercase text-amber-600">Volunteer Shifts</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {ev.shifts?.map(shift => {
                                                            const isVol = shift.volunteers.includes(profile.memberId);
                                                            const isFull = shift.volunteers.length >= shift.capacity;
                                                            return (
                                                                <button 
                                                                    key={shift.id} 
                                                                    onClick={() => handleVolunteerSignup(ev, shift.id)}
                                                                    disabled={!isVol && isFull}
                                                                    className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all ${
                                                                        isVol ? 'bg-[#3E2723] text-[#FDB813] border-[#3E2723]' : 
                                                                        isFull ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed' : 
                                                                        'bg-white border-amber-200 hover:border-amber-400'
                                                                    }`}
                                                                >
                                                                    <div>
                                                                        <span className="block text-xs font-bold uppercase">{formatDate(shift.date)}</span>
                                                                        <span className="block text-[10px] font-medium">{shift.session}</span>
                                                                    </div>
                                                                    <div className="text-[10px] font-black bg-white/20 px-2 py-1 rounded">
                                                                        {shift.volunteers.length}/{shift.capacity}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleRegisterEvent(ev)}
                                                    className={`mt-6 w-full py-3 rounded-xl font-black uppercase text-xs transition-colors ${
                                                        isRegistered ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-[#3E2723] text-white hover:bg-black'
                                                    }`}
                                                >
                                                    {isRegistered ? "You're Going!" : "Count Me In"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {view === 'announcements' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center">
                        <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Grind Report</h3>
                        {isAdmin && <button onClick={() => setShowAnnounceForm(true)} className="bg-[#3E2723] text-white p-3 rounded-xl hover:bg-black"><Plus size={20}/></button>}
                    </div>

                    {showAnnounceForm && (
                        <div className="bg-white p-6 rounded-[32px] border-2 border-amber-200 mb-6">
                            <form onSubmit={handlePostAnnouncement} className="space-y-3">
                                <input type="text" placeholder="Title" required className="w-full p-3 border rounded-xl text-xs font-bold uppercase" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
                                <textarea placeholder="Content" required className="w-full p-3 border rounded-xl text-xs" rows="4" value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} />
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => { setShowAnnounceForm(false); setEditingAnnouncement(null); setNewAnnouncement({title:'', content:''}); }} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs">Post</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {announcements.map(ann => (
                            <div key={ann.id} className="bg-yellow-50 p-8 rounded-[32px] border border-yellow-100 shadow-sm relative group">
                                {isAdmin && (
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button onClick={() => handleEditAnnouncement(ann)} className="p-2 text-amber-600"><Pen size={16}/></button>
                                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-2 text-red-600"><Trash2 size={16}/></button>
                                    </div>
                                )}
                                <span className="inline-block bg-[#FDB813] px-3 py-1 rounded-full text-[10px] font-black uppercase text-[#3E2723] mb-4">{formatDate(ann.date)}</span>
                                <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723] mb-3">{ann.title}</h4>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'suggestions' && (
                <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Suggestion Box</h3>
                        <p className="text-gray-500 font-bold text-xs uppercase">Your voice matters. Totally anonymous.</p>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm">
                        <form onSubmit={handlePostSuggestion}>
                            <textarea 
                                className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none text-sm resize-none focus:ring-2 ring-amber-100" 
                                rows="4" 
                                placeholder="What's on your mind? Ideas for events, merch, or improvements..."
                                value={suggestionText}
                                onChange={e => setSuggestionText(e.target.value)}
                            />
                            <div className="flex justify-end mt-4">
                                <button type="submit" disabled={!suggestionText.trim()} className="bg-[#3E2723] text-white px-6 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-black disabled:opacity-50">
                                    <Send size={16}/> Drop Suggestion
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-4">
                        {suggestions.map(s => (
                            <div key={s.id} className="bg-white p-6 rounded-[32px] border border-gray-100 relative group">
                                {isAdmin && (
                                    <button onClick={() => handleDeleteSuggestion(s.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                                        <Trash2 size={16}/>
                                    </button>
                                )}
                                <p className="text-gray-800 text-sm font-medium">"{s.text}"</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-4 text-right">
                                    {s.createdAt?.toDate ? formatDate(s.createdAt.toDate()) : "Just now"}
                                </p>
                            </div>
                        ))}
                    </div>
                    {isAdmin && (
                        <div className="text-center pt-8">
                            <button onClick={handleDownloadSuggestions} className="text-amber-600 font-bold text-xs uppercase hover:underline">Download All Suggestions (CSV)</button>
                        </div>
                    )}
                </div>
            )}

            {view === 'committee_hunt' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="bg-[#3E2723] text-white p-10 rounded-[48px] text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-serif text-4xl font-black uppercase mb-4">Join the Team</h3>
                            <p className="text-amber-200/80 font-bold uppercase text-sm max-w-xl mx-auto">Serve the student body, hone your leadership skills, and be part of the legacy.</p>
                        </div>
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {COMMITTEES_INFO.map(c => (
                            <div key={c.id} className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm hover:shadow-xl transition-shadow flex flex-col">
                                <div className="h-40 rounded-2xl bg-gray-100 mb-6 overflow-hidden">
                                    {/* CHANGED: Removed grayscale, added sepia filter for orange-shade effect */}
                                    <img src={c.image} className="w-full h-full object-cover sepia transition-all duration-500 hover:sepia-0" alt={c.title} />
                                </div>
                                <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723] mb-2">{c.title}</h4>
                                <p className="text-xs text-gray-600 mb-6 leading-relaxed flex-1">{c.description}</p>
                                
                                <div className="bg-amber-50 p-4 rounded-xl mb-6">
                                    <p className="text-[10px] font-black uppercase text-amber-800 mb-2">Roles & Responsibilities</p>
                                    <ul className="text-[10px] text-amber-900 space-y-1 list-disc pl-4">
                                        {c.roles.map((r, i) => <li key={i}>{r}</li>)}
                                    </ul>
                                </div>

                                <button 
                                    onClick={(e) => {
                                        setCommitteeForm({ role: 'Committee Member' });
                                        handleApplyCommittee(e, c.id);
                                    }}
                                    disabled={submittingApp}
                                    className="w-full py-3 bg-[#3E2723] text-[#FDB813] rounded-xl font-black uppercase text-xs hover:bg-black disabled:opacity-50"
                                >
                                    Apply Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {view === 'reports' && isAdmin && (
            <div className="space-y-10 animate-fadeIn text-[#3E2723]">
                <div className="flex items-center gap-4 border-b-4 border-[#3E2723] pb-6">
                    <StatIcon icon={TrendingUp} variant="amber" />
                    <div><h3 className="font-serif text-4xl font-black uppercase">Terminal</h3><p className="text-amber-500 font-black uppercase text-[10px]">The Control Roaster</p></div>
                </div>
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
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[40px] border-2 border-amber-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-black uppercase text-sm">Registration Status</h4>
                                <div className="flex gap-2">
                                    <button onClick={handleToggleMaintenance} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase text-white flex items-center gap-2 ${hubSettings.maintenanceMode ? 'bg-orange-500' : 'bg-gray-400'}`}>
                                        <Power size={12}/> {hubSettings.maintenanceMode ? "MAINTENANCE ON" : "NORMAL"}
                                    </button>
                                    <button onClick={handleToggleRegistration} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase text-white ${hubSettings.registrationOpen ? 'bg-green-500' : 'bg-red-500'}`}>
                                        {hubSettings.registrationOpen ? "OPEN" : "CLOSED"}
                                    </button>
                                </div>
                            </div>
                            <hr className="border-amber-100 my-4"/>
                            <h4 className="font-black uppercase text-sm mb-4">Financial Reports</h4>
                            {/* ... Financial Reports UI ... */}
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
                            {/* ... Security Vault ... */}
                            <h4 className="font-serif text-2xl font-black uppercase mb-6 text-[#FDB813]">Security Vault</h4>
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
                            <button onClick={handleSanitizeDatabase} className="w-full mt-4 bg-yellow-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2"><Database size={14}/> Sanitize Database</button>
                            <button onClick={handleMigrateToRenewal} className="w-full mt-4 bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2">Migrate: Set All to Renewal</button>
                            <button onClick={handleRecoverLostData} className="w-full mt-4 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2">Recover Lost Members (Collision Fix)</button>
                        </div>
                    </div>
                    {/* ... Committee Apps ... */}
                    <div className="bg-white p-10 rounded-[50px] border border-amber-100 shadow-xl">
                        <h4 className="font-serif text-xl font-black uppercase mb-4 text-[#3E2723]">Committee Applications</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {committeeApps && committeeApps.length > 0 ? (
                                committeeApps.map(app => (
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
                                                {app.status === 'for_interview' ? 'Interview' : app.status}
                                            </span>
                                        </div>
                                        <p className="text-amber-700 font-bold mb-3">{app.committee} • {app.role}</p>
                                        <div className="flex gap-2 pt-3 border-t border-amber-200/50">
                                            <button onClick={() => initiateAppAction(app, 'for_interview')} className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 transition-colors">Interview</button>
                                            <button onClick={() => initiateAppAction(app, 'accepted')} className="flex-1 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors">Accept</button>
                                            <button onClick={() => initiateAppAction(app, 'denied')} className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-300 transition-colors">Deny</button>
                                            <button onClick={() => handleDeleteApp(app.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                            <a href={`mailto:${app.email}`} className="p-2 text-blue-400 hover:text-blue-600" title="Email Applicant"><Mail size={14}/></a>
                                        </div>
                                        <p className="text-[8px] text-gray-400 uppercase mt-2 text-right">Applied: {formatDate(app.createdAt?.toDate ? app.createdAt.toDate() : new Date())}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 italic">No applications found.</p>
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
                    <div className="flex gap-2 w-full md:w-auto justify-end">
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
                
                {/* --- MOBILE REGISTRY VIEW (CARDS) --- */}
                <div className="md:hidden space-y-4">
                    {paginatedRegistry.map(m => (
                        <div key={m.id || m.memberId} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <img src={getDirectLink(m.photoUrl) || `https://ui-avatars.com/api/?name=${m.name}&background=FDB813&color=3E2723`} className="w-10 h-10 rounded-full object-cover border border-[#3E2723]" />
                                    <div>
                                        <p className="font-black text-xs uppercase text-[#3E2723]">{m.name}</p>
                                        <p className="text-[9px] text-gray-500 font-mono">{m.memberId}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => isAdmin && handleToggleStatus(m.memberId, m.status)}
                                    className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                                >
                                    {m.status === 'active' ? 'Active' : 'Expired'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 mb-3">
                                <div className="bg-gray-50 p-2 rounded-lg">
                                    <p className="text-[8px] text-gray-400 uppercase">Position</p>
                                    {isAdmin ? (
                                        <select 
                                            className="w-full bg-transparent text-[10px] font-bold text-gray-700 outline-none" 
                                            value={m.positionCategory || "Member"} 
                                            onChange={e=>handleUpdatePosition(m.memberId, e.target.value, m.specificTitle)}
                                        >
                                            {POSITION_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                                        </select>
                                    ) : (
                                        <p className="text-[10px] font-bold text-gray-700">{m.positionCategory}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg">
                                    <p className="text-[8px] text-gray-400 uppercase">Title</p>
                                    {isAdmin ? (
                                        <select 
                                            className="w-full bg-transparent text-[10px] font-bold text-gray-700 outline-none" 
                                            value={m.specificTitle || "Member"} 
                                            onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, e.target.value)}
                                        >
                                            <option value="Member">Member</option>
                                            <option value="Org Adviser">Org Adviser</option>
                                            {OFFICER_TITLES.map(t=><option key={t} value={t}>{t}</option>)}
                                            {COMMITTEE_TITLES.map(t=><option key={t} value={t}>{t}</option>)}
                                        </select>
                                    ) : (
                                        <p className="text-[10px] font-bold text-gray-700 truncate">{m.specificTitle}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
                                <button onClick={() => { setAccoladeText(""); setShowAccoladeModal({ memberId: m.memberId }); }} className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Trophy size={14}/></button>
                                {isAdmin && (
                                    <>
                                        <button onClick={() => { setEditingMember(m); setEditMemberForm({ joinedDate: m.joinedDate ? m.joinedDate.split('T')[0] : '' }); }} className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Pen size={14}/></button>
                                        <button onClick={() => handleResetPassword(m.memberId, m.email, m.name)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><RefreshCcw size={14}/></button>
                                        <button onClick={()=>initiateRemoveMember(m.memberId, m.name)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14}/></button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- DESKTOP REGISTRY VIEW (TABLE) --- */}
                <div className="hidden md:block bg-white rounded-[40px] border border-amber-100 shadow-xl overflow-hidden">
                    {paginatedRegistry.length === 0 ? (
                        <div className="p-10 text-center">
                            <Users size={32} className="mx-auto text-gray-300 mb-2"/>
                            <p className="text-xs font-bold text-gray-400">Registry is empty.</p>
                        </div>
                    ) : (
                    <table className="w-full text-left uppercase table-fixed">
                        <thead className="bg-[#3E2723] text-white font-serif tracking-widest">
                            <tr className="text-[10px]">
                                <th className="p-4 w-12 text-center"><button onClick={toggleSelectAll}>{selectedBaristas.length === paginatedRegistry.length ? <CheckCircle2 size={16} className="text-[#FDB813]"/> : <Plus size={16}/>}</button></th>
                                <th className="p-4 w-1/3">Barista</th>
                                <th className="p-4 w-32 text-center">ID</th>
                                <th className="p-4 w-24 text-center">Status</th>
                                <th className="p-4 w-40 text-center">Designation</th>
                                <th className="p-4 w-32 text-right">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="text-[#3E2723] divide-y divide-amber-50">
                            {paginatedRegistry.map(m => (
                            <tr key={m.id || m.memberId} className={`hover:bg-amber-50/50 ${m.status !== 'active' ? 'opacity-50 grayscale' : ''}`}>
                                <td className="p-4 text-center"><button onClick={()=>toggleSelectBarista(m.memberId)}>{selectedBaristas.includes(m.memberId) ? <CheckCircle2 size={18} className="text-[#FDB813]"/> : <div className="w-4 h-4 border-2 border-amber-100 rounded-md mx-auto"></div>}</button></td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-4">
                                    <img src={getDirectLink(m.photoUrl) || `https://ui-avatars.com/api/?name=${m.name}&background=FDB813&color=3E2723`} className="w-8 h-8 rounded-full object-cover border-2 border-[#3E2723]" />
                                    <div className="min-w-0">
                                        <p className="font-black text-xs truncate">{m.name}</p>
                                        <p className="text-[8px] opacity-60 truncate">"{m.nickname || m.program}"</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {m.accolades?.map((acc, i) => (
                                                <span key={i} title={acc} className="text-[8px] bg-yellow-100 text-yellow-700 px-1 rounded cursor-help">🏆</span>
                                            ))}
                                        </div>
                                    </div>
                                    </div>
                                </td>
                                <td className="text-center font-mono font-black text-xs">{m.memberId}</td>
                                <td className="text-center font-black text-[10px] uppercase">
                                    {(() => {
                                        const isOfficerRole = ['Officer', 'Execomm', 'Committee', 'Org Adviser'].includes(m.positionCategory);
                                        const status = m.membershipType || (isOfficerRole ? 'renewal' : 'new');
                                        const isNew = status.toLowerCase() === 'new';
                                        const isActive = m.status === 'active';
                                        
                                        return (
                                            <button 
                                                onClick={() => isAdmin && handleToggleStatus(m.memberId, m.status)}
                                                className={`px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${isActive ? (isNew ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700') : 'bg-gray-200 text-gray-500'}`}
                                                title={isAdmin ? "Click to toggle status" : ""}
                                                disabled={!isAdmin}
                                            >
                                                {isActive ? status : 'EXPIRED'}
                                            </button>
                                        );
                                    })()}
                                </td>
                                <td className="text-center">
                                    <div className="flex flex-col gap-1 items-center">
                                        <select className="bg-amber-50 text-[8px] font-black p-1 rounded outline-none w-32 disabled:opacity-50" value={m.positionCategory || "Member"} onChange={e=>handleUpdatePosition(m.memberId, e.target.value, m.specificTitle)} disabled={!isAdmin}>{POSITION_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
                                        <select className="bg-white border border-amber-100 text-[8px] font-black p-1 rounded outline-none w-32 disabled:opacity-50" value={m.specificTitle || "Member"} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, e.target.value)} disabled={!isAdmin}><option value="Member">Member</option><option value="Org Adviser">Org Adviser</option>{OFFICER_TITLES.map(t=><option key={t} value={t}>{t}</option>)}{COMMITTEE_TITLES.map(t=><option key={t} value={t}>{t}</option>)}</select>
                                    </div>
                                </td>
                                <td className="text-right p-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => { setAccoladeText(""); setShowAccoladeModal({ memberId: m.memberId }); }} className="text-yellow-500 p-2 hover:bg-yellow-50 rounded-lg" title="Award Accolade"><Trophy size={14}/></button>
                                        {isAdmin && (
                                            <>
                                                <button 
                                                    onClick={() => { setEditingMember(m); setEditMemberForm({ joinedDate: m.joinedDate ? m.joinedDate.split('T')[0] : '' }); }} 
                                                    className="text-amber-500 p-2 hover:bg-amber-50 rounded-lg" 
                                                    title="Edit Member Details"
                                                >
                                                    <Pen size={14}/>
                                                </button>
                                                <button onClick={() => handleResetPassword(m.memberId, m.email, m.name)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg" title="Reset Password"><RefreshCcw size={14}/></button>
                                                <button onClick={()=>initiateRemoveMember(m.memberId, m.name)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-amber-100 mt-4">
                    <button onClick={prevPage} disabled={currentPage === 1} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold uppercase disabled:opacity-50 hover:bg-gray-200">Previous</button>
                    <span className="text-xs font-black uppercase text-gray-500">Page {currentPage} of {totalPages}</span>
                    <button onClick={nextPage} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold uppercase disabled:opacity-50 hover:bg-gray-200">Next</button>
                </div>

            </div>
            )}
            
            {view === 'settings' && (
              <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="p-4 bg-amber-100 text-amber-700 rounded-2xl">
                          <Settings2 size={32} />
                      </div>
                      <div>
                          <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Settings</h3>
                          <p className="text-gray-500 font-bold text-xs uppercase">Manage your barista profile</p>
                      </div>
                  </div>
            
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Profile Details Form */}
                      <div className="bg-white p-8 rounded-[40px] border-2 border-amber-100 shadow-sm">
                          <h4 className="font-black text-lg uppercase text-[#3E2723] mb-6 flex items-center gap-2">
                              <User size={20} className="text-amber-500"/> Personal Details
                          </h4>
                          <form onSubmit={handleUpdateProfile} className="space-y-4">
                              <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Full Name</label>
                                  <input 
                                      type="text" 
                                      className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm uppercase"
                                      value={settingsForm.name || ''}
                                      onChange={e => setSettingsForm({...settingsForm, name: e.target.value.toUpperCase()})}
                                      placeholder="LAST, FIRST MI."
                                  />
                              </div>

                              <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nickname / Display Name</label>
                                  <input 
                                      type="text" 
                                      className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm"
                                      value={settingsForm.nickname || ''}
                                      onChange={e => setSettingsForm({...settingsForm, nickname: e.target.value})}
                                      placeholder="How should we call you?"
                                  />
                              </div>
                              
                              <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Profile Photo URL</label>
                                  <input 
                                      type="text" 
                                      className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm"
                                      value={settingsForm.photoUrl || ''}
                                      onChange={e => setSettingsForm({...settingsForm, photoUrl: e.target.value})}
                                      placeholder="https://..."
                                  />
                                  <p className="text-[9px] text-gray-400 mt-1 ml-1">Paste a direct link to an image (Google Drive/Photos links supported).</p>
                              </div>
            
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Birth Month</label>
                                      <select 
                                          className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm"
                                          value={settingsForm.birthMonth || ''}
                                          onChange={e => setSettingsForm({...settingsForm, birthMonth: e.target.value})}
                                      >
                                          <option value="">Month</option>
                                          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Birth Day</label>
                                      <input 
                                          type="number" 
                                          min="1" max="31"
                                          className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm"
                                          value={settingsForm.birthDay || ''}
                                          onChange={e => setSettingsForm({...settingsForm, birthDay: e.target.value})}
                                      />
                                  </div>
                              </div>
            
                              <div className="pt-4">
                                  <button 
                                      type="submit" 
                                      disabled={savingSettings}
                                      className="w-full py-4 bg-[#3E2723] text-[#FDB813] rounded-2xl font-black uppercase text-xs hover:bg-black transition-colors disabled:opacity-50"
                                  >
                                      {savingSettings ? "Saving..." : "Update Profile"}
                                  </button>
                              </div>
                          </form>
                      </div>
            
                      {/* Security Form */}
                      <div className="bg-white p-8 rounded-[40px] border-2 border-amber-100 shadow-sm">
                          <h4 className="font-black text-lg uppercase text-[#3E2723] mb-6 flex items-center gap-2">
                              <Lock size={20} className="text-red-500"/> Security
                          </h4>
                          <form onSubmit={handleChangePassword} className="space-y-4">
                              <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Current Password</label>
                                  <input 
                                      type="password" 
                                      required
                                      className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm"
                                      value={passwordForm.current}
                                      onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">New Password</label>
                                  <input 
                                      type="password" 
                                      required
                                      className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm"
                                      value={passwordForm.new}
                                      onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Confirm New Password</label>
                                  <input 
                                      type="password" 
                                      required
                                      className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm"
                                      value={passwordForm.confirm}
                                      onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                                  />
                              </div>
            
                              <div className="pt-4">
                                  <button 
                                      type="submit" 
                                      className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-xs hover:bg-red-600 transition-colors"
                                  >
                                      Change Password
                                  </button>
                              </div>
                          </form>
                      </div>
                  </div>
            
                  <div className="bg-[#3E2723] p-8 rounded-[40px] text-white/50 text-center text-xs">
                      <p>Member ID: <span className="font-mono text-white font-bold">{profile.memberId}</span></p>
                      <p className="mt-2">Need help with your account? Contact the PR Committee.</p>
                  </div>
              </div>
            )}

        </main>
        <DataPrivacyFooter />
      </div>
    </div>
  );
};

// Main App Component with Auth State Management
export default function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('lba_profile'));
        } catch { return null; }
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

    const logout = async () => {
        await signOut(auth);
        setProfile(null);
        localStorage.removeItem('lba_profile');
    };

    if (!profile) {
        return <Login user={user} onLoginSuccess={setProfile} />;
    }

    return <Dashboard user={user} profile={profile} setProfile={setProfile} logout={logout} />;
}
