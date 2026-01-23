import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Check, Eye, Camera, Award, User, Activity } from 'lucide-react';
import gasClient from '../api/gasClient';
import { getLevel } from '../utils/gamification';
import AvatarFrame from './AvatarFrame';

function ProfileModal({ user, onClose, onUpdate }) {
    const [form, setForm] = useState({
        nama: user.nama || '',
        password: user.password || '',
        avatarColor: user.avatarColor || '000000',
        avatarUrl: user.avatarUrl || '',
        equippedBadge: user.equippedBadge || ''
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Collapsible States
    const [openUser, setOpenUser] = useState(false);
    const [openAwards, setOpenAwards] = useState(false);
    const [openXp, setOpenXp] = useState(false);

    // Fresh user data from server
    const [freshUser, setFreshUser] = useState(user);

    // Fetch fresh user data on mount
    useEffect(() => {
        const fetchFreshUser = async () => {
            try {
                const allData = await gasClient.loadAllData();
                if (allData?.users) {
                    const found = allData.users.find(u =>
                        u.username?.trim().toLowerCase() === user.username?.trim().toLowerCase()
                    );
                    if (found) {
                        setFreshUser(prev => ({ ...prev, ...found }));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch fresh user data:', err);
            }
        };
        fetchFreshUser();
    }, [user.username]);

    useEffect(() => {
        setTimeout(() => setIsAnimating(true), 10);
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        const handleEscape = (e) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setIsAnimating(false);
        setTimeout(onClose, 400);
    };

    const colors = ['0D8ABC', 'E74C3C', '2ECC71', 'F1C40F', '9B59B6', '34495E', 'E67E22', '1ABC9C'];
    const level = getLevel(freshUser.xp || 0);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return alert('⚠️ File harus berupa gambar');

        // File size limit: 2MB
        const MAX_SIZE = 2 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return alert('⚠️ Ukuran file terlalu besar! Maksimum 2MB.');
        }

        setUploading(true);
        const reader = new FileReader();

        reader.onerror = () => {
            console.error('FileReader error:', reader.error);
            alert('❌ Gagal membaca file: ' + reader.error);
            setUploading(false);
        };

        reader.onload = async (ev) => {
            const base64Data = ev.target.result.split(',')[1];
            const ext = file.name.split('.').pop() || 'jpg';
            const fileName = `avatar_${(user.nama || 'user').replace(/\s+/g, '_')}_${Date.now()}.${ext}`;
            console.log('📤 Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);

            try {
                const res = await gasClient.request('uploadBuktiTransfer', { base64Data, fileName, contentType: file.type });
                console.log('📥 Upload response:', res);
                if (res.success) {
                    setForm(prev => ({ ...prev, avatarUrl: res.thumbnailUrl || res.fileUrl }));
                    alert('✅ Foto berhasil diupload!');
                } else {
                    console.error('Gagal upload:', res);
                    alert('❌ Gagal upload: ' + (res.error || res.message || 'Unknown error'));
                }
            } catch (err) {
                console.error('Error upload:', err);
                alert('❌ Error: ' + err.toString());
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Strict Badge Validation
        if (form.equippedBadge && !(freshUser.earnedBadges || []).includes(form.equippedBadge)) {
            alert('⛔ Akses Ditolak: Anda belum memiliki badge ini! Silakan pilih badge yang sudah terbuka.');
            setLoading(false);
            return;
        }

        const submissionForm = { ...form };

        try {
            const res = await gasClient.request('updateUserProfile', { username: user.username, form: submissionForm });
            if (res.success) {
                alert('✅ Profil berhasil diupdate!');
                onUpdate(res.user);
                handleClose();
            } else {
                alert('❌ Gagal update: ' + res.error);
            }
        } catch (err) {
            alert('❌ Error: ' + err.toString());
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`profile-modal-overlay ${isAnimating && !isClosing ? 'profile-modal-overlay-enter' : 'profile-modal-overlay-exit'}`} onClick={handleClose}>
            <div className={`profile-modal-panel glass-card w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[var(--bg-page)] rounded-3xl p-6 border border-[var(--glass-border)] shadow-2xl ${isAnimating && !isClosing ? 'profile-modal-panel-enter' : 'profile-modal-panel-exit'} text-left`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold">Profil</h3>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Top Section: Avatar, Level, XP Bar */}
                    <div className="flex flex-col items-center gap-2 py-4">
                        <div className="relative group">
                            <AvatarFrame user={{ ...user, ...form }} size="xl" hideLevel={true} className="cursor-pointer" />
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[60]" disabled={uploading} title="Update Foto Profil" />
                            {uploading && <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center z-50"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition rounded-full flex items-center justify-center pointer-events-none z-40">
                                <Camera size={24} className="text-white drop-shadow-lg" />
                            </div>
                        </div>

                        <div className="text-center w-full max-w-xs mt-2">
                            <h2 className="text-xl font-black mb-1">{freshUser.nama}</h2>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 border ${level.bg} ${level.color}`}>
                                <span>{level.icon}</span>
                                <span>{level.title}</span>
                            </div>

                            <div className="relative h-3 bg-black/20 rounded-full overflow-hidden border border-[var(--border-surface)]">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] relative"
                                    style={{ width: `${Math.min(100, (freshUser.xp / level.limit) * 100)}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-[10px] items-center mt-1 px-1">
                                <span className="font-bold font-mono">{freshUser.xp || 0} XP</span>
                                <span className="text-[var(--text-muted)]">{level.limit} XP</span>
                            </div>
                        </div>
                    </div>

                    {/* Collapsible: User Info */}
                    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-surface)] overflow-hidden">
                        <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-black/5" onClick={() => setOpenUser(!openUser)}>
                            <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><User size={14} /> User</p>
                            {openUser ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        <div className={`transition-all duration-300 ${openUser ? 'max-h-[500px] opacity-100 p-4 pt-0' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            <div className="space-y-4 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 text-left">Nama Lengkap</label>
                                    <input className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 text-left">Password Baru</label>
                                    <input type="text" className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)] font-mono" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Password" />
                                </div>
                                {!form.avatarUrl && (
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 text-left">Warna Avatar</label>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {colors.map(c => (
                                                <button key={c} type="button" onClick={() => setForm({ ...form, avatarColor: c })} className={`w-8 h-8 rounded-full border-2 ${form.avatarColor === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: '#' + c }}>
                                                    {form.avatarColor === c && <Check size={14} className="text-white mx-auto" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Collapsible: Penghargaan */}
                    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-surface)] overflow-hidden">
                        <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-black/5" onClick={() => setOpenAwards(!openAwards)}>
                            <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <Award size={14} /> Penghargaan
                                <span className="text-[var(--text-secondary)] normal-case text-[10px] ml-1">({freshUser.earnedBadges?.length || 0})</span>
                            </p>
                            {openAwards ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        <div className={`transition-all duration-300 ${openAwards ? 'max-h-[600px] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            <div className="p-6 pt-0">
                                <div className="grid grid-cols-3 gap-6 justify-items-center">
                                    {['lvl_pemula', 'lvl_teladan', 'lvl_senior', 'lvl_mujahid', 'soloFighter', 'amilCekatan', 'amilRajin', 'amilTeliti'].map(b => {
                                        const isEarned = (freshUser.earnedBadges || []).includes(b);
                                        const isEquipped = form.equippedBadge === b;

                                        const badgeNames = {
                                            lvl_pemula: 'Amil Pemula',
                                            lvl_teladan: 'Amil Teladan',
                                            lvl_senior: 'Amil Senior',
                                            lvl_mujahid: 'Amil Mujahid',
                                            soloFighter: 'Solo Fighter',
                                            amilCekatan: 'Amil Cekatan',
                                            amilRajin: 'Amil Rajin',
                                            amilTeliti: 'Amil Teliti'
                                        };

                                        return (
                                            <div
                                                key={b}
                                                onClick={() => setForm(prev => ({ ...prev, equippedBadge: isEquipped ? '' : b }))}
                                                className={`w-14 h-14 rounded-full flex items-center justify-center relative transition-all duration-300 cursor-pointer group/badge 
                                         ${isEquipped ? 'scale-110 z-10' :
                                                        isEarned ? 'opacity-100 hover:scale-105' :
                                                            'opacity-30 grayscale hover:grayscale-0 hover:opacity-100'}`}
                                            >
                                                <AvatarFrame
                                                    user={{ ...user, ...form, equippedBadge: b }}
                                                    size="md" // Smaller preview
                                                    hideLevel={true}
                                                    className="pointer-events-none"
                                                />

                                                {/* Tooltip */}
                                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 backdrop-blur-md text-white text-[9px] rounded-lg opacity-0 group-hover/badge:opacity-100 whitespace-nowrap pointer-events-none transition z-50 capitalize shadow-xl border border-white/10 font-bold tracking-wide">
                                                    {!isEarned && <span className="text-red-400 mr-1">🔒</span>}
                                                    {badgeNames[b] || b}
                                                </div>

                                                {isEquipped && <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-1 z-40 shadow-lg border border-white/20"><Check size={12} className="text-white" /></div>}
                                                {!isEquipped && isEarned && <div className="absolute -top-1 -right-1 bg-blue-500/20 rounded-full p-1 z-40"><Award size={8} className="text-blue-200" /></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Collapsible: Rincian XP */}
                    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-surface)] overflow-hidden">
                        <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-black/5" onClick={() => setOpenXp(!openXp)}>
                            <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Activity size={14} /> Rincian XP</p>
                            {openXp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        <div className={`transition-all duration-300 ${openXp ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            <div className="p-4 pt-0">
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between p-2 bg-white/5 rounded-lg"><span>Transaksi</span> <span className="font-mono font-bold">{freshUser.txXP || 0}</span></div>
                                    <div className="flex justify-between p-2 bg-white/5 rounded-lg"><span>Absensi</span> <span className="font-mono font-bold">{freshUser.attXP || 0}</span></div>
                                    <div className="flex justify-between p-2 bg-white/5 rounded-lg"><span>Kroscek</span> <span className="font-mono font-bold">{freshUser.kroscekXP || 0}</span></div>
                                    <div className="flex justify-between text-[var(--primary)] font-bold p-2 bg-[var(--primary)]/10 rounded-lg mt-2"><span>TOTAL</span> <span>{freshUser.xp || 0}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Separate Save Button */}
                    <div className="pt-2">
                        <button type="submit" disabled={loading || uploading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-black text-white shadow-xl shadow-blue-500/20 uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default ProfileModal;
