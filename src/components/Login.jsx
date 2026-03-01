import React, { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, onSnapshot, getDocs, query, where, limit, runTransaction } from 'firebase/firestore';
import { auth, db, appId } from '../firebase';
import { 
  ORG_LOGO_URL, PROGRAMS, MONTHS, getDirectLink, 
  generateLBAId, getDailyCashPasskey, getMemberIdMeta 
} from '../utils/helpers';
import { Loader2, ArrowRight, ArrowLeft, X, HelpCircle, Coffee } from 'lucide-react';

const Login = ({ onLoginSuccess, initialError }) => {
  const [authMode, setAuthMode] = useState('login');
  const [regStep, setRegStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  
  // Dynamic Settings from Admin Terminal
  const [adminSettings, setAdminSettings] = useState({ gcashNumber: 'Loading...' });

  // Input States
  const [memberIdInput, setMemberIdInput] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regType, setRegType] = useState('New Member');
  const [payMethod, setPayMethod] = useState('GCash');
  const [refNo, setRefNo] = useState('');
  const [cashKeyInput, setCashKeyInput] = useState('');
  const [formData, setFormData] = useState({
    fName: '', mi: '', lName: '', email: '', prog: '', pass: '', confirm: '', bMonth: '1', bDay: '1', key: ''
  });

  useEffect(() => {
    // Listen for GCash Number updates from the Admin Settings document
    return onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), (s) => {
      if (s.exists()) setAdminSettings(s.data());
    });
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (authMode === 'register' && regStep === 1) {
      if (formData.pass !== formData.confirm) return setError("Passwords do not match!");
      if (!formData.prog) return setError("Please select your program.");
      setRegStep(2);
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'register') {
        // Validate Cash Key before proceeding
        if (payMethod === 'Cash' && cashKeyInput.toUpperCase() !== getDailyCashPasskey().toUpperCase()) {
          throw new Error("Invalid Cash Key. Ask the Officer in charge.");
        }

        const currentUser = (await signInAnonymously(auth)).user;
        const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters');
        
        const profile = await runTransaction(db, async (tx) => {
          const snap = await tx.get(counterRef);
          const count = snap.exists() ? (snap.data().memberCount || 0) : 0;
          
          const lbaId = generateLBAId('Member', count);
          const meta = getMemberIdMeta();

          const data = {
            uid: currentUser.uid, 
            memberId: lbaId,
            name: `${formData.fName} ${formData.mi ? formData.mi + '. ' : ''}${formData.lName}`.toUpperCase(),
            email: formData.email.toLowerCase(), 
            password: formData.pass, 
            program: formData.prog,
            birthMonth: parseInt(formData.bMonth), 
            birthDay: parseInt(formData.bDay),
            registrationType: regType, 
            paymentMethod: payMethod,
            paymentRef: payMethod === 'GCash' ? refNo : 'CASH_VERIFIED',
            paymentStatus: payMethod === 'Cash' ? 'paid' : 'unpaid',
            positionCategory: 'Member', 
            role: 'member', 
            status: 'active',
            joinedDate: new Date().toISOString(),
            ...meta
          };

          tx.set(doc(db, 'artifacts', appId, 'public', 'data', 'registry', lbaId), data);
          tx.set(counterRef, { memberCount: count + 1 }, { merge: true });
          return data;
        });
        onLoginSuccess(profile);
      } else {
        // Login Logic
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), where('memberId', '==', memberIdInput.trim().toUpperCase()), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("Barista ID not found.");
        const user = snap.docs[0].data();
        if (user.password !== loginPass) throw new Error("Incorrect password.");
        onLoginSuccess(user);
      }
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-6 text-[#3E2723]">
      {showForgotHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#3E2723]/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-xs w-full text-center relative border-b-8 border-amber-400">
            <button onClick={() => setShowForgotHelp(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"><X size={20}/></button>
            <HelpCircle size={40} className="mx-auto text-amber-500 mb-4" />
            <h2 className="font-serif text-lg font-black uppercase mb-2 leading-tight">Lost Your Keys?</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">Please contact an <span className="text-[#3E2723]">LBA Officer</span> to verify your identity and reset your password.</p>
            <button onClick={() => setShowForgotHelp(false)} className="mt-6 w-full py-3 bg-[#3E2723] text-[#FDB813] rounded-xl font-black text-[10px] uppercase">Got it</button>
          </div>
        </div>
      )}

      <div className="bg-white p-10 md:p-14 rounded-[60px] shadow-2xl max-w-md w-full border-b-[12px] border-amber-400 relative">
        <div className="flex flex-col items-center mb-8 text-center">
          <img 
            src={getDirectLink(ORG_LOGO_URL)} 
            className="w-24 h-24 mb-6 object-contain" 
            alt="LBA" 
            onError={(e) => e.target.src="https://ui-avatars.com/api/?name=LBA&background=3E2723&color=FDB813&bold=true"}
          />
          <h1 className="font-serif text-xl font-black uppercase tracking-tight leading-tight px-4">LPU Baristas' Association</h1>
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-600 mt-2">Kaperata Hub</p>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase text-center border border-red-100">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-3">
          {authMode === 'login' ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <input type="text" placeholder="BARISTA ID" className="w-full p-4 bg-amber-50/50 rounded-2xl font-black text-xs outline-none uppercase" value={memberIdInput} onChange={(e) => setMemberIdInput(e.target.value)} required />
              <div className="space-y-1">
                <input type="password" placeholder="PASSWORD" className="w-full p-4 bg-amber-50/50 rounded-2xl font-black text-xs outline-none" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} required />
                <button type="button" onClick={() => setShowForgotHelp(true)} className="w-full text-right text-[9px] font-black uppercase text-amber-800/40 px-2">Forgot Password?</button>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#3E2723] text-[#FDB813] py-4 rounded-2xl font-black uppercase text-xs flex justify-center items-center gap-2 mt-2 shadow-xl">
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Brew Session'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {regStep === 1 ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
                  {/* NAME GRID */}
                  <div className="grid grid-cols-5 gap-1">
                    <input type="text" placeholder="FIRST" className="col-span-2 p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none" onChange={(e)=>setFormData({...formData, fName: e.target.value})} value={formData.fName} required />
                    <input type="text" placeholder="MI" className="p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none text-center" onChange={(e)=>setFormData({...formData, mi: e.target.value})} value={formData.mi} />
                    <input type="text" placeholder="LAST" className="col-span-2 p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none" onChange={(e)=>setFormData({...formData, lName: e.target.value})} value={formData.lName} required />
                  </div>
                  
                  {/* PROGRAM & BIRTHDAY GRID */}
                  <div className="grid grid-cols-2 gap-2">
                    <select className="p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none" onChange={(e)=>setFormData({...formData, prog: e.target.value})} value={formData.prog} required>
                      <option value="">PROGRAM</option>
                      {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <select className="w-2/3 p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none" onChange={(e)=>setFormData({...formData, bMonth: e.target.value})} value={formData.bMonth}>
                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label.slice(0,3)}</option>)}
                      </select>
                      <input type="number" placeholder="DD" min="1" max="31" className="w-1/3 p-3 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none text-center" onChange={(e)=>setFormData({...formData, bDay: e.target.value})} value={formData.bDay} required />
                    </div>
                  </div>

                  <input type="email" placeholder="LPU EMAIL" className="w-full p-3 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none" onChange={(e)=>setFormData({...formData, email: e.target.value})} value={formData.email} required />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input type="password" placeholder="PASSWORD" className="p-3 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none" onChange={(e)=>setFormData({...formData, pass: e.target.value})} value={formData.pass} required />
                    <input type="password" placeholder="CONFIRM" className="p-3 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none" onChange={(e)=>setFormData({...formData, confirm: e.target.value})} value={formData.confirm} required />
                  </div>
                  
                  <button type="submit" className="w-full bg-[#3E2723] text-[#FDB813] py-4 rounded-2xl font-black uppercase text-xs flex justify-center items-center gap-2 mt-2 shadow-lg">
                    Next: Payment <ArrowRight size={16}/>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  {/* STEP 2: PAYMENT */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase px-1 text-amber-800/40">Type</label>
                      <select className="w-full p-3 bg-amber-100 rounded-xl text-[10px] font-black uppercase outline-none" value={regType} onChange={(e) => setRegType(e.target.value)}>
                        <option value="New Member">New (₱100)</option>
                        <option value="For Renewal">Renewal (₱50)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase px-1 text-amber-800/40">Method</label>
                      <select className="w-full p-3 bg-amber-100 rounded-xl text-[10px] font-black uppercase outline-none" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                        <option value="GCash">GCash</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                  </div>

                  {payMethod === 'GCash' ? (
                    <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-5 text-center">
                      <p className="text-[9px] font-black uppercase text-blue-400 mb-1">Send Payment To</p>
                      <p className="text-xl font-black text-blue-700 tracking-tighter">{adminSettings.gcashNumber}</p>
                      <div className="mt-4 space-y-1">
                        <label className="text-[8px] font-black uppercase text-blue-400 block text-left px-1">Reference Number</label>
                        <input type="text" placeholder="13-DIGIT REF NO." className="w-full p-3 bg-white rounded-xl text-[10px] font-black uppercase outline-none border border-blue-200" value={refNo} onChange={(e) => setRefNo(e.target.value)} required />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#3E2723] rounded-3xl p-5 text-center border-b-4 border-amber-900">
                      <p className="text-[9px] font-black uppercase text-amber-500/60 mb-3">Officer Authorization</p>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-amber-500 block text-left px-1">Enter Cash Key</label>
                        <input type="text" placeholder="••••••" className="w-full p-3 bg-[#2D1B18] text-amber-400 rounded-xl text-center text-sm font-black uppercase outline-none border border-amber-900" value={cashKeyInput} onChange={(e) => setCashKeyInput(e.target.value)} required />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button type="button" onClick={() => setRegStep(1)} className="py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] flex justify-center items-center gap-1">
                      <ArrowLeft size={14}/> Back
                    </button>
                    <button type="submit" disabled={loading} className="py-4 bg-[#3E2723] text-[#FDB813] rounded-2xl font-black uppercase text-[10px] shadow-lg">
                      {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Complete Brew'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setRegStep(1); }} className="w-full mt-8 text-[10px] font-black uppercase tracking-widest text-amber-800 underline decoration-2 underline-offset-4 text-center">
          {authMode === 'login' ? 'Not Yet Registered? Brew With Us!' : 'Already a Member? Login'}
        </button>
      </div>
    </div>
  );
};

export default Login;
