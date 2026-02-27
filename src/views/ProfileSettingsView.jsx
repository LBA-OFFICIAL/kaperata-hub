import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { getDirectLink } from '../utils/helpers';
import { Save, User, Camera, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';

const ProfileSettingsView = ({ profile }) => {
  const [formData, setFormData] = useState({
    nickname: '',
    photoUrl: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  // Initialize form with current profile data
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
    if (!profile?.uid) return;
    
    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.uid);
      await updateDoc(userRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      
      setStatus({ type: 'success', msg: 'Profile updated successfully!' });
      setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-3xl font-black uppercase text-[#3E2723]">Member Settings</h3>
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest">Personalize your barista identity</p>
        </div>
        {status.msg && (
          <div className={`px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase shadow-sm border-2 animate-bounce ${
            status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <CheckCircle2 size={16} /> {status.msg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PREVIEW CARD */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border-2 border-amber-100 shadow-sm text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-amber-400" />
            
            <div className="relative z-10">
              <div className="w-32 h-32 mx-auto rounded-full p-1 bg-white border-4 border-white shadow-xl mb-4 overflow-hidden">
                <img 
                  src={getDirectLink(formData.photoUrl) || `https://ui-avatars.com/api/?name=${profile?.name}&background=FDB813&color=3E2723`} 
                  alt="Preview" 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${profile?.name}&background=FDB813&color=3E2723`; }}
                />
              </div>
              <h4 className="font-black text-xl uppercase leading-tight">{formData.nickname || profile?.name}</h4>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter mb-4">
                {profile?.specificTitle || profile?.role || 'Barista Member'}
              </p>
              
              <div className="flex justify-center gap-2">
                 <span className="px-3 py-1 bg-amber-50 rounded-full text-[9px] font-black uppercase text-amber-700 border border-amber-100">
                   {profile?.memberId || 'PENDING ID'}
                 </span>
              </div>
            </div>
          </div>

          <div className="bg-[#3E2723] p-6 rounded-[30px] text-white">
             <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-amber-400" size={20} />
                <h5 className="font-black uppercase text-[10px] tracking-widest">Account Status</h5>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold border-b border-white/10 pb-2">
                  <span className="text-white/50">Email</span>
                  <span>{profile?.email}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] uppercase font-bold border-b border-white/10 pb-2">
                  <span className="text-white/50">Membership</span>
                  <span className="text-amber-400">{profile?.status || 'Active'}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] uppercase font-bold border-b border-white/10 pb-2">
                   <span className="text-white/50">Joined</span>
                   <span>{profile?.joinedDate?.toDate ? profile.joinedDate.toDate().toLocaleDateString() : '---'}</span>
                </div>
             </div>
          </div>
        </div>

        {/* EDIT FORM */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[50px] border-2 border-amber-50 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nickname / Alias</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                <input 
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                  placeholder="The Coffee Master"
                  className="w-full bg-amber-50/50 border-2 border-transparent focus:border-amber-400 p-4 pl-12 rounded-2xl outline-none font-bold transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Photo URL (GDrive Link)</label>
              <div className="relative">
                <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                <input 
                  type="text"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({...formData, photoUrl: e.target.value})}
                  placeholder="Paste your Drive link here"
                  className="w-full bg-amber-50/50 border-2 border-transparent focus:border-amber-400 p-4 pl-12 rounded-2xl outline-none font-bold transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Bio / Favorite Coffee Quote</label>
            <textarea 
              rows="4"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Tell us about your coffee journey..."
              className="w-full bg-amber-50/50 border-2 border-transparent focus:border-amber-400 p-6 rounded-3xl outline-none font-bold transition-all text-sm resize-none"
            ></textarea>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto bg-[#3E2723] text-[#FDB813] px-10 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-900/10 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#FDB813] border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save size={18}/> Update Barista Profile</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettingsView;
