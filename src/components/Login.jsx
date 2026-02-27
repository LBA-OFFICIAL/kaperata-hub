import React, { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, onSnapshot, getDocs, query, where, limit, runTransaction } from 'firebase/firestore';
import { auth, db, appId } from '../firebase'; // Correct: Go up to src
import { 
  ORG_LOGO_URL, PROGRAMS, MONTHS,
  getDirectLink, getMemberIdMeta, generateLBAId 
} from '../utils/helpers'
import { Loader2, Coffee, User, Lock, Mail, BadgeCheck } from 'lucide-react';

const Login = ({ onLoginSuccess, initialError }) => {
  const [authMode, setAuthMode] = useState('login');
  const [memberIdInput, setMemberIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('');
  const [birthMonth, setBirthMonth] = useState('1');
  const [birthDay, setBirthDay] = useState('1');
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true });
  const [secureKeys, setSecureKeys] = useState(null);

  useEffect(() => {
    const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (s) => s.exists() && setHubSettings(s.data()));
    const unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (s) => s.exists() && setSecureKeys(s.data()));
    return () => { unsubOps(); unsubKeys(); };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    setStatusMessage('Preparing your brew...');

    try {
      let currentUser = auth.currentUser;
      if (!currentUser) {
        const result = await signInAnonymously(auth);
        currentUser = result.user;
      }

      if (authMode === 'register') {
        if (!hubSettings.registrationOpen) throw new Error("Registration is currently closed.");

        const registryRef = collection(db, 'artifacts', appId, 'public', 'data', 'registry');
        const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters');

        const newProfile = await runTransaction(db, async (transaction) => {
          const counterSnap = await transaction.get(counterRef);
          const currentCount = counterSnap.exists() ? (counterSnap.data().memberCount || 0) : 0;
          const nextCount = currentCount + 1;

          let pc = 'Member', st = 'Member', role = 'member', pay = 'unpaid';
          
          if (inputKey) {
            const uk = inputKey.trim().toUpperCase();
            if (uk === secureKeys?.officerKey?.toUpperCase()) { pc = 'Officer'; role = 'admin'; pay = 'exempt'; }
            else if (uk === secureKeys?.headKey?.toUpperCase()) { pc = 'Committee'; st = 'Committee Head'; pay = 'exempt'; }
            else if (uk === secureKeys?.commKey?.toUpperCase()) { pc = 'Committee'; st = 'Committee Member'; pay = 'exempt'; }
          }

          const assignedId = generateLBAId(pc, currentCount);
          const meta = getMemberIdMeta();
          
          const profileData = {
            uid: currentUser.uid,
            name: `${firstName} ${middleInitial ? middleInitial + '. ' : ''}${lastName}`.toUpperCase(),
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

          transaction.set(doc(registryRef, assignedId), profileData);
          transaction.set(counterRef, { memberCount: nextCount }, { merge: true });
          return profileData;
        });

        onLoginSuccess(newProfile);
      } else {
        const q = query(
          collection(db, 'artifacts', appId, 'public', 'data', 'registry'), 
          where('memberId', '==', memberIdInput.trim().toUpperCase()), 
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("Barista ID not found.");
        const userData = snap.docs[0].data();
        if (userData.password !== password) throw new Error("Incorrect password keys.");
        onLoginSuccess(userData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-6 text-[#3E2723]">
      <div className="bg-white p-8 md:p-12 rounded-[60px] shadow-2xl max-w-md w-full border-b-[12px] border-amber-400 relative overflow-hidden">
        
        {/* DECORATIVE TOP */}
        <div className="absolute top-0 left-0 w-full h-2 bg-[#3E2723]" />

        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-28 h-28 bg-amber-50 rounded-full p-4 mb-4 border-2 border-amber-100 shadow-inner flex items-center justify-center overflow-hidden">
            <img 
              src={getDirectLink(ORG_LOGO_URL)} 
              alt="LBA Logo" 
              className="w-full h-full object-contain"
              onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=LBA&background=FDB813&color=3E2723" }}
            />
          </div>
          <h1 className="font-serif text-2xl font-black uppercase leading-none">LPU Baristas</h1>
          <p className="text-[#3E2723]/40 font-bold tracking-[0.2em] text-[10px] uppercase mt-1">Association Hub</p>
          <div className="bg-[#3E2723] text-[#FDB813] px-4 py-1 rounded-full mt-4 text-[9px] font-black uppercase tracking-widest animate-pulse">
            {authMode === 'login' ? 'Authentication Required' : 'Join the Association'}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl text-[10px] font-black uppercase leading-tight">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'login' ? (
            <div className="space-y-3">
              <div className="relative">
                <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                <input type="text" required placeholder="BARISTA ID (e.g. LBA24-10001)" className="w-full p-4 pl-12 bg-amber-50/50 border-2 border-transparent focus:border-amber-400 rounded-2xl font-black uppercase text-xs outline-none transition-all" value={memberIdInput} onChange={(e) => setMemberIdInput(e.target.value)} />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                <input type="password" required placeholder="PASSWORD" className="w-full p-4 pl-12 bg-amber-50/50 border-2 border-transparent focus:border-amber-400 rounded-2xl font-black text-xs outline-none transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
               <div className="grid grid-cols-5 gap-2">
                  <input type="text" required placeholder="FIRST" className="col-span-2 p-4 bg-amber-50/50 border-2 border-transparent focus:border-amber-200 rounded-xl text-[10px] font-black uppercase outline-none" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  <input type="text" placeholder="MI" maxLength="1" className="p-4 bg-amber-50/50 border-2 border-transparent focus:border-amber-200 rounded-xl text-[10px] text-center font-black uppercase outline-none" value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value)} />
                  <input type="text" required placeholder="LAST" className="col-span-2 p-4 bg-amber-50/50 border-2 border-transparent focus:border-amber-200 rounded-xl text-[10px] font-black uppercase outline-none" value={lastName} onChange={(e) => setLastName(e.target.value)} />
               </div>
               
               <div className="relative">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                 <input type="email" required placeholder="LPU EMAIL ADDRESS" className="w-full p-4 pl-12 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none border-2 border-transparent focus:border-amber-200" value={email} onChange={(e) => setEmail(e.target.value)} />
               </div>

               <div className="grid grid-cols-2 gap-2">
                 <select required className="p-4 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none border-2 border-transparent focus:border-amber-200" value={program} onChange={(e) => setProgram(e.target.value)}>
                    <option value="">PROGRAM</option>
                    {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
                 <div className="flex gap-1">
                   <select className="w-1/2 p-4 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none border-2 border-transparent focus:border-amber-200" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                      {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label.substring(0,3)}</option>)}
                   </select>
                   <input type="number" min="1" max="31" placeholder="DD" className="w-1/2 p-4 bg-amber-50/50 rounded-xl text-[10px] font-black text-center outline-none border-2 border-transparent focus:border-amber-200" value={birthDay} onChange={(e) => setBirthDay(e.target.value)} />
                 </div>
               </div>

               <div className="relative">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                 <input type="password" required placeholder="CREATE PASSWORD" className="w-full p-4 pl-12 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none border-2 border-transparent focus:border-amber-200" value={password} onChange={(e) => setPassword(e.target.value)} />
               </div>

               <div className="relative">
                 <Coffee className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                 <input type="text" placeholder="ACCESS KEY (OPTIONAL)" className="w-full p-4 pl-12 bg-[#3E2723] text-white rounded-xl text-[10px] font-black uppercase outline-none border-2 border-transparent focus:border-amber-400 placeholder:text-white/30" value={inputKey} onChange={(e) => setInputKey(e.target.value)} />
               </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-[#3E2723] text-[#FDB813] py-5 rounded-[24px] hover:scale-[1.02] active:scale-95 transition-all font-black uppercase flex justify-center items-center gap-2 text-xs shadow-xl shadow-amber-900/10">
            {loading ? <Loader2 className="animate-spin" size={20}/> : (authMode === 'login' ? 'Start Session' : 'Brew Membership')}
          </button>
        </form>

        <div className="text-center mt-8">
          <button 
            type="button" 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
            className="text-[10px] font-black uppercase tracking-widest text-amber-800 hover:text-black transition-colors"
          >
            {authMode === 'login' ? "Not Yet Registered? Brew With Us" : "Already a Barista? Back to Login"}
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-[9px] font-bold text-[#3E2723]/30 uppercase tracking-[0.4em]">Lyceum of the Philippines University</p>
    </div>
  );
};

export default Login;
