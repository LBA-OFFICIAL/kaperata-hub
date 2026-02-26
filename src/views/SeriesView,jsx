import React, { useState, useContext } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { HubContext } from '../contexts/HubContext';
import { formatDate, getDirectLink } from '../utils/helpers';
import { Plus, Pen, Trash2, Smile, Image as ImageIcon, X } from 'lucide-react';

const SeriesView = () => {
    const { seriesPosts, profile, isCommitteePlus } = useContext(HubContext);

    // Local States for Post Form
    const [showSeriesForm, setShowSeriesForm] = useState(false);
    const [editingSeriesId, setEditingSeriesId] = useState(null);
    const [newSeriesPost, setNewSeriesPost] = useState({ title: '', imageUrls: [''], caption: '' });

    // Helper: Activity Logger
    const logAction = async (action, details) => { 
        if (!profile) return; 
        try { 
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), { 
                action, details, actor: profile.name, actorId: profile.memberId, timestamp: serverTimestamp() 
            }); 
        } catch (err) { console.error("Logging failed:", err); } 
    };

    // --- ACTIONS ---

    const handlePostSeries = async (e) => { 
        e.preventDefault(); 
        const validUrls = newSeriesPost.imageUrls.filter(url => url.trim() !== ''); 
        if (validUrls.length === 0) return alert("At least one image URL is required."); 
        
        try { 
            if (editingSeriesId) { 
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'series_posts', editingSeriesId), { 
                    title: newSeriesPost.title, 
                    imageUrls: validUrls, 
                    caption: newSeriesPost.caption, 
                    lastEdited: serverTimestamp() 
                }); 
                logAction("Update Series", `Updated Barista Diaries: ${newSeriesPost.title}`); 
                setEditingSeriesId(null); 
            } else { 
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'series_posts'), { 
                    title: newSeriesPost.title, 
                    imageUrls: validUrls, 
                    caption: newSeriesPost.caption, 
                    author: profile.name, 
                    authorId: profile.memberId, 
                    createdAt: serverTimestamp() 
                }); 
                logAction("Post Series", `Posted to Barista Diaries: ${newSeriesPost.title}`); 
            } 
            setShowSeriesForm(false); 
            setNewSeriesPost({ title: '', imageUrls: [''], caption: '' }); 
        } catch (e) { alert("Failed to save diary post."); } 
    };

    const handleEditSeries = (post) => { 
        setNewSeriesPost({ 
            title: post.title, 
            imageUrls: post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : [post.imageUrl || ''], 
            caption: post.caption 
        }); 
        setEditingSeriesId(post.id); 
        setShowSeriesForm(true); 
    };

    const handleDeleteSeries = async (id) => { 
        if(!confirm("Delete this post?")) return; 
        try { 
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'series_posts', id)); 
            logAction("Delete Series", `Deleted diary post ID: ${id}`);
        } catch (e) { alert("Failed to delete post."); } 
    };

    return (
        <div className="space-y-8 animate-fadeIn relative">
            
            {/* HEADER */}
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Barista Diaries</h3>
                    <p className="text-gray-500 font-bold text-xs uppercase">Life behind the bar & beyond</p>
                </div>
                {isCommitteePlus && (
                    <button 
                        onClick={() => { setEditingSeriesId(null); setNewSeriesPost({ title: '', imageUrls: [''], caption: '' }); setShowSeriesForm(true); }} 
                        className="bg-[#3E2723] text-white px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-black flex items-center gap-2 shadow-md transition-colors"
                    >
                        <Plus size={16}/> New Post
                    </button>
                )}
            </div>

            {/* DIARY POSTS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {seriesPosts.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-400">
                        <Smile size={48} className="mx-auto mb-4 opacity-50"/>
                        <p className="font-bold uppercase text-xs tracking-widest">No stories yet. Be the first to share!</p>
                    </div>
                ) : (
                    seriesPosts.map(post => {
                        const postImages = post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : (post.imageUrl ? [post.imageUrl] : []);
                        const canEdit = isCommitteePlus || profile.memberId === post.authorId;
                        
                        return (
                            <div key={post.id} className="bg-white rounded-[32px] overflow-hidden border border-amber-100 shadow-sm hover:shadow-lg transition-shadow group relative">
                                
                                {/* Image Controls */}
                                {canEdit && (
                                    <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditSeries(post)} className="p-2 bg-white/90 backdrop-blur rounded-full text-amber-600 hover:text-amber-800 shadow-md">
                                            <Pen size={14}/>
                                        </button>
                                        <button onClick={() => handleDeleteSeries(post.id)} className="p-2 bg-white/90 backdrop-blur rounded-full text-red-500 hover:text-red-700 shadow-md">
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                )}
                                
                                {/* Carousel Section */}
                                <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar h-64 bg-gray-100">
                                    {postImages.map((imgUrl, idx) => (
                                        <div key={idx} className="w-full flex-shrink-0 snap-center relative">
                                            <img 
                                                src={getDirectLink(imgUrl)} 
                                                alt={`${post.title} ${idx+1}`} 
                                                className="w-full h-full object-cover" 
                                            />
                                            {postImages.length > 1 && (
                                                <div className="absolute bottom-2 right-3 bg-black/50 text-white text-[9px] px-2 py-1 rounded-full font-bold tracking-widest backdrop-blur-sm">
                                                    {idx + 1} / {postImages.length}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Content Section */}
                                <div className="p-6">
                                    <h4 className="font-black text-lg text-[#3E2723] mb-2 leading-tight uppercase">{post.title}</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">{post.caption}</p>
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase text-gray-400 border-t border-gray-100 pt-4">
                                        <span>By {post.author}</span>
                                        <span>{post.createdAt?.toDate ? formatDate(post.createdAt.toDate()) : 'Recently'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* POST FORM MODAL */}
            {showSeriesForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full border-b-[8px] border-[#3E2723]">
                        <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">
                            {editingSeriesId ? 'Edit Diary Post' : 'Post to Barista Diaries'}
                        </h3>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="Post Title" 
                                className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold uppercase outline-none" 
                                value={newSeriesPost.title} 
                                onChange={e => setNewSeriesPost({...newSeriesPost, title: e.target.value})} 
                            />
                            
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Image URLs (Direct Links)</label>
                                {newSeriesPost.imageUrls.map((url, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder={`Image URL ${index + 1}`} 
                                            className="flex-1 p-3 border rounded-xl text-xs outline-none" 
                                            value={url} 
                                            onChange={e => { 
                                                const updatedUrls = [...newSeriesPost.imageUrls]; 
                                                updatedUrls[index] = e.target.value; 
                                                setNewSeriesPost({...newSeriesPost, imageUrls: updatedUrls}); 
                                            }} 
                                        />
                                        {index === newSeriesPost.imageUrls.length - 1 ? (
                                            <button type="button" onClick={() => setNewSeriesPost({...newSeriesPost, imageUrls: [...newSeriesPost.imageUrls, '']})} className="bg-amber-100 text-amber-700 font-black rounded-xl px-4 hover:bg-amber-200 transition-colors">+</button>
                                        ) : (
                                            <button type="button" onClick={() => { const filtered = newSeriesPost.imageUrls.filter((_, i) => i !== index); setNewSeriesPost({...newSeriesPost, imageUrls: filtered}); }} className="text-red-400 hover:text-red-600 font-bold px-3">X</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <textarea 
                                placeholder="Write your caption here..." 
                                className="w-full p-3 border border-amber-200 rounded-xl text-xs h-24 custom-scrollbar outline-none" 
                                value={newSeriesPost.caption} 
                                onChange={e => setNewSeriesPost({...newSeriesPost, caption: e.target.value})} 
                            />
                            
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowSeriesForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                                <button onClick={handlePostSeries} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-[#FDB813] font-bold uppercase text-xs hover:bg-black transition-colors">
                                    {editingSeriesId ? 'Save Changes' : 'Publish'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeriesView;
