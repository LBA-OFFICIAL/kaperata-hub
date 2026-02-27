import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { db, appId } from '../firebase'; // Correct: Go up to src
import { getDirectLink, formatDate } from '../utils/helpers'; // Correct: Go up to src, then into utils
import { Save, User, Camera, Mail, ShieldCheck, CheckCircle2, KeyRound, Calendar } from 'lucide-react';

const ProfileSettingsView = ({ profile }) => {
  const auth = getAuth();
  const [formData, setFormData] = useState({
    nickname: '',
    photoUrl: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    if (profile) {
      setFormData({
        nickname: profile.nickname || '',
        photoUrl: profile.photoUrl || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.uid);
      await updateDoc(userRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      setStatus({ type: 'success', msg: 'Profile updated!' });
    } catch (err) {
      setStatus({ type: 'error', msg: 'Update failed.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, profile.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      alert("Error sending reset email: " + err.message);
    }
  };

  // Logic: Use joinedDate if it exists, otherwise fallback to registration (createdAt)
  const displayJoinedDate = profile?.joinedDate || profile?.createdAt;

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="font-serif text-3xl font-black uppercase text-[#3E2723]">Settings</h3>
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest">Update your Barista Profile</p>
        </div>
        {status.msg && (
          <div className="bg-green-50 text-green-700 border-2 border-green-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
            <CheckCircle2 size={14}/> {status.msg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          {/* AVATAR PREVIEW - Now uses the fixed Direct Link */}
          <div className="bg-white p-8 rounded-[40px] border-2 border-amber-100 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-20 bg-amber-400" />
            <div className="relative z-10">
              <div className="w-28 h-28 mx-auto rounded-full p-1 bg-white border-4 border-white shadow-lg mb-4 overflow-hidden">
                <img 
                  src={getDirectLink(formData.photoUrl) || `https://ui-avatars.com/api/?name=${profile?.name}&background=FDB813&color=3E2723`} 
                  className="w-full h-full object-cover rounded-full"
                  alt="Barista"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${profile?.name}&background=FDB813&color=3E2723`; }}
                />
              </div>
              <h4 className="font-black text-lg uppercase leading-tight">{formData.nickname || profile?.name}</h4>
              <p className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">{profile?.role}</p>
            </div>
          </div>

          <div className="bg-[#3E2723] p-6 rounded-[30px] text-white space-y-4">
             <div className="flex items-center gap-3">
                <Calendar className="text-amber-400" size={18} />
                <div>
                  <p className="text-[8px] uppercase text-white/40 font-bold">Member Since</p>
                  <p className="text-[10px] uppercase font-black">{formatDate(displayJoinedDate)}</p>
                </div>
             </div>
             <button 
                onClick={handlePasswordReset}
                className="w-full flex items-center justify-between gap-3 bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all group"
             >
                <div className="flex items-center gap-3">
                  <KeyRound className="text-amber-400" size={18} />
                  <span className="text-[9px] font-black uppercase tracking-wider">Security</span>
                </div>
                <span className="text-[8px] font-bold uppercase text-amber-400">
                  {resetSent ? "Email Sent!" : "Reset Password"}
                </span>
             </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="lg:col-span-2 bg-white p-8 rounded-[40px] border-2 border-amber-50 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                <input type="text" value={formData.nickname} onChange={(e) => setFormData({...formData, nickname: e.target.value})} className="w-full bg-amber-50/30 border-2 border-transparent focus:border-amber-400 p-4 pl-12 rounded-2xl outline-none font-bold text-sm transition-all"/>
              </div>
            </div>

            <div className="space-y-2 opacity-60">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Email (Primary)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="email" value={profile?.email} readOnly className="w-full bg-gray-50 border-2 border-gray-100 p-4 pl-12 rounded-2xl outline-none font-bold text-sm cursor-not-allowed"/>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">GDrive Photo URL</label>
            <div className="relative">
              <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
              <input type="text" value={formData.photoUrl} onChange={(e) => setFormData({...formData, photoUrl: e.target.value})} className="w-full bg-amber-50/30 border-2 border-transparent focus:border-amber-400 p-4 pl-12 rounded-2xl outline-none font-bold text-sm transition-all" placeholder="Paste link here..."/>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">About You</label>
            <textarea rows="3" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full bg-amber-50/30 border-2 border-transparent focus:border-amber-400 p-4 rounded-2xl outline-none font-bold text-sm transition-all resize-none" placeholder="Share your coffee story..."/>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#3E2723] text-white py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-[#5D4037] transition-all">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={16}/> Save Barista Profile</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettingsView;
