import React, { useState, useContext } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { HubContext } from '../contexts/HubContext';
import { formatDate, getDirectLink } from '../utils/helpers';
import { Plus, Pen, Trash2, Image as ImageIcon, Smile } from 'lucide-react';

const SeriesView = () => {
    const { seriesPosts, profile, isCommitteePlus } = useContext(HubContext);
    const [showSeriesForm, setShowSeriesForm] = useState(false);
    const [newSeriesPost, setNewSeriesPost] = useState({ title: '', imageUrls: [''], caption: '' });

    const handlePostSeries = async (e) => { 
        e.preventDefault(); 
        const validUrls = newSeriesPost.imageUrls.filter(url => url.trim() !== ''); 
        try { 
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'series_posts'), { 
                ...newSeriesPost, imageUrls: validUrls, author: profile.name, authorId: profile.memberId, createdAt: serverTimestamp() 
            }); 
            setShowSeriesForm(false); 
            setNewSeriesPost({ title: '', imageUrls: [''], caption: '' }); 
        } catch (e) { alert("Failed to save post."); } 
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Barista Diaries</h3>
                    <p className="text-gray-500 font-bold text-xs uppercase">Life behind the bar</p>
                </div>
                {isCommitteePlus && (
                    <button onClick={() => setShowSeriesForm(true)} className="bg-[#3E2723] text-white px-6 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2">
                        <Plus size={16}/> New Post
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {seriesPosts.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-400">
                        <Smile size={48} className="mx-auto mb-4 opacity-50"/>
                        <p className="font-bold uppercase text-xs tracking-widest">No stories yet.</p>
                    </div>
                ) : (
                    seriesPosts.map(post => (
                        <div key={post.id} className="bg-white rounded-[32px] overflow-hidden border border-amber-100 shadow-sm group relative">
                            <div className="h-64 bg-gray-100">
                                <img src={getDirectLink(post.imageUrls[0])} className="w-full h-full object-cover" alt={post.title} />
                            </div>
                            <div className="p-6">
                                <h4 className="font-black text-lg text-[#3E2723] mb-2 uppercase">{post.title}</h4>
                                <p className="text-xs text-gray-600 mb-4 line-clamp-3">{post.caption}</p>
                                <div className="flex justify-between items-center text-[9px] font-bold uppercase text-gray-400">
                                    <span>By {post.author}</span>
                                    <span>{post.createdAt?.toDate ? formatDate(post.createdAt.toDate()) : 'Recently'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SeriesView;
