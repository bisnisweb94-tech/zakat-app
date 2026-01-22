import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Check, Eye, Camera } from 'lucide-react';
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
    const [showAwards, setShowAwards] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

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
    const level = getLevel(user.xp || 0);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return alert('⚠️ File harus berupa gambar');

        setUploading(true);
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64Data = ev.target.result.split(',')[1];
            const fileName = `avatar_${user.nama.replace(/\s+/g, '_')}_${Date.now()}.${file.name.split('.').pop()}`;
            try {
                const res = await gasClient.request('uploadBuktiTransfer', { base64Data, fileName, contentType: file.type });
                if (res.success) {
                    setForm(prev => ({ ...prev, avatarUrl: res.thumbnailUrl || res.fileUrl }));
                    alert('✅ Foto berhasil diupload!');
                } else {
                    alert('❌ Gagal upload: ' + res.error);
                }
            } catch (err) {
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

        const submissionForm = { ...form };
        if (form.equippedBadge && !(user.earnedBadges || []).includes(form.equippedBadge)) {
            submissionForm.equippedBadge = (user.earnedBadges || []).includes(user.equippedBadge) ? user.equippedBadge : '';
            alert('⚠️ Badge preview tidak disimpan karena belum dimiliki.');
        }

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
            <div className={`profile-modal-panel glass-card w-full max-w-md max-h-[90vh] overflow-y-auto bg-[var(--bg-page)] rounded-3xl p-6 border border-[var(--glass-border)] shadow-2xl ${isAnimating && !isClosing ? 'profile-modal-panel-enter' : 'profile-modal-panel-exit'} text-left`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Edit Profil</h3>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-surface)] overflow-hidden">
                        <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-black/5" onClick={() => setShowAwards(!showAwards)}>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Penghargaan</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--text-secondary)]">{user.earnedBadges?.length || 0} Badges</span>
                                {showAwards ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </div>
                        <div className={`transition-all duration-300 ${showAwards ? 'max-h-[500px] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            <div className="p-4 pt-10">
                                <div className="flex gap-2 flex-wrap mb-4">
                                    {['bronze_1', 'bronze_2', 'bronze_3', 'silver_1', 'silver_2', 'silver_3', 'gold_1', 'gold_2', 'gold_3', 'lvl_mujahid', 'soloFighter', 'amilCekatan', 'amilRajin', 'amilTeliti'].map(b => {
                                        const isEarned = (user.earnedBadges || []).includes(b);
                                        const isEquipped = form.equippedBadge === b;

                                        const badgeNames = {
                                            bronze_1: 'Amil Pemula I', bronze_2: 'Amil Pemula II', bronze_3: 'Amil Pemula III',
                                            silver_1: 'Amil Teladan I', silver_2: 'Amil Teladan II', silver_3: 'Amil Teladan III',
                                            gold_1: 'Amil Senior I', gold_2: 'Amil Senior II', gold_3: 'Amil Senior III',
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
                                                className={`w-11 h-11 rounded-full flex items-center justify-center relative transition cursor-pointer group/badge 
                                         ${isEquipped ? 'ring-2 ring-[var(--primary)] scale-110 z-10' :
                                                        isEarned ? 'opacity-100 hover:scale-110' :
                                                            'opacity-40 grayscale hover:grayscale-0 hover:opacity-80'}`}
                                            >
                                                {/* Preview current user with this badge */}
                                                <AvatarFrame
                                                    user={{ ...user, ...form, equippedBadge: b }}
                                                    size="sm"
                                                    className="pointer-events-none"
                                                />

                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[8px] rounded opacity-0 group-hover/badge:opacity-100 whitespace-nowrap pointer-events-none transition z-50 capitalize shadow-xl border border-white/10">
                                                    {!isEarned && <span className="text-red-400 font-bold mr-1">🔒 LOCKED:</span>}
                                                    {isEquipped && <span className="text-emerald-400 font-bold mr-1">👁️ PREVIEW:</span>}
                                                    {badgeNames[b] || b}
                                                </div>

                                                {isEquipped && isEarned && <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 z-40"><Check size={8} className="text-white" /></div>}
                                                {isEquipped && !isEarned && <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 z-40"><Eye size={8} className="text-white" /></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="p-3 bg-[var(--bg-page)] rounded-xl border border-[var(--border-surface)]">
                                    <p className="text-xs font-bold text-[var(--text-muted)] mb-2">Rincian XP</p>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between"><span>Transaksi</span> <span className="font-mono font-bold">{user.txXP || 0}</span></div>
                                        <div className="flex justify-between"><span>Absensi</span> <span className="font-mono font-bold">{user.attXP || 0}</span></div>
                                        <div className="flex justify-between"><span>Kroscek</span> <span className="font-mono font-bold">{user.kroscekXP || 0}</span></div>
                                        <div className="border-t border-[var(--border-surface)] my-1"></div>
                                        <div className="flex justify-between text-[var(--primary)] font-bold"><span>TOTAL</span> <span>{user.xp || 0}</span></div>
                                    </div>
                                </div>

                                {/* Reward System - Level Badge & Progress */}
                                <div className="mt-4 space-y-3">
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Sistem Penghargaan</p>

                                    {/* Level Badge */}
                                    <div className="flex justify-center">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${level.bg} ${level.color}`}>
                                            <span>{level.icon}</span>
                                            <span>{level.title}</span>
                                        </div>
                                    </div>

                                    {/* XP Progress Bar */}
                                    <div className="relative h-4 bg-black/20 rounded-full overflow-hidden border border-[var(--border-surface)]">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] relative transition-all duration-500"
                                            style={{ width: `${Math.min(100, ((user.xp || 0) / level.limit) * 100)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-md tracking-wider">
                                            {user.xp || 0} / {level.limit} XP
                                        </div>
                                    </div>

                                    {/* Next Level Info */}
                                    <p className="text-[10px] text-center text-[var(--text-muted)]">
                                        {Math.max(0, level.limit - (user.xp || 0))} XP lagi menuju <span className="text-[var(--text-primary)] font-bold">{level.next}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="relative group">
                            <AvatarFrame user={{ ...user, ...form }} size="lg" className="cursor-pointer" />
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading} title="Update Foto Profil" />
                            {uploading && <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center z-50"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition rounded-full flex items-center justify-center pointer-events-none z-40">
                                <Camera size={20} className="text-white drop-shadow-lg" />
                            </div>
                        </div>

                        {/* Level Badge & XP Progress */}
                        <div className="text-center w-full max-w-xs">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 border ${level.bg} ${level.color}`}>
                                <span>{level.icon}</span>
                                <span>{level.title}</span>
                            </div>

                            <div className="relative h-4 bg-black/20 rounded-full overflow-hidden border border-[var(--border-surface)]">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] relative"
                                    style={{ width: `${Math.min(100, (user.xp / level.limit) * 100)}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-md tracking-wider">
                                    {user.xp || 0} / {level.limit} XP
                                </div>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                                {Number(level.limit) - (user.xp || 0)} XP lagi menuju <span className="text-[var(--text-primary)] font-bold">{level.next}</span>
                            </p>
                        </div>


                    </div>

                    <div className="space-y-4">
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
                        <button type="submit" disabled={loading || uploading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 font-black text-white shadow-xl shadow-blue-500/20 uppercase tracking-widest mt-4">
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProfileModal;
