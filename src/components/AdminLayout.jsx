import React, { useState, useEffect } from 'react';
import {
    Home, TrendingUp, TrendingDown, Users, Phone, CheckCircle,
    Lock, Award, FileText, Settings, X, LogOut, AlertTriangle
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import AdminDashboardHome from './AdminDashboardHome';
import ListView from './ListView';
import MasterMuzakkiManager from './MasterMuzakkiManager';
import KroscekKasView from './KroscekKasView';
import PerformanceView from './PerformanceView';
import UserManagementView from './UserManagementView';
import LaporanView from './LaporanView';
import SettingsView from './SettingsView';
import AttendanceModal from './AttendanceModal';
import ReceiptSuccessModal from './ReceiptSuccessModal';
import FormPenerimaan from './FormPenerimaan';
import FormPengeluaran from './FormPengeluaran';
import FormMustahik from './FormMustahik';
import gasClient from '../api/gasClient';

function AdminLayout({ user, data, setData, onLogout, onCheckOut, toggleTheme, theme, onOpenProfile }) {
    const [tab, setTab] = useState('dashboard');
    const [modal, setModal] = useState(null);
    const [receiptData, setReceiptData] = useState(null);
    const [animState, setAnimState] = useState({ active: false, closing: false });
    const [timeWarning, setTimeWarning] = useState(null);
    const [showAbsen, setShowAbsen] = useState(false);

    useEffect(() => {
        if (modal) {
            requestAnimationFrame(() => {
                setAnimState({ active: true, closing: false });
            });
            document.body.style.overflow = 'hidden';
        } else {
            setAnimState({ active: false, closing: false });
            document.body.style.overflow = '';
        }
    }, [modal]);

    const closeModalAnimated = () => {
        setAnimState({ active: true, closing: true });
        setTimeout(() => setModal(null), 350);
    };

    useEffect(() => {
        const activeBtn = document.querySelector(`button[data-tab-id="${tab}"]`);
        if (activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [tab]);

    useEffect(() => {
        if (user.role === 'Admin') return;

        const checkShiftStatus = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            const shifts = data.settings?.shifts || [];
            if (shifts.length === 0) return;

            const endingSoon = shifts.find(s => {
                if (!s.endTime) return false;
                const [h, m] = s.endTime.split(':').map(Number);
                const endMin = h * 60 + m;
                const nowMin = now.getHours() * 60 + now.getMinutes();
                let diff = endMin - nowMin;
                if (diff < 0) diff += 24 * 60;
                return diff <= 2 && diff > 0 && timeStr >= s.startTime;
            });

            if (endingSoon) {
                setTimeWarning(`⚠️ Perhatian! Shift ${endingSoon.name} berakhir dalam kurun waktu 2 menit. Segera lakukan Kroscek dan Checkout.`);
            } else {
                setTimeWarning(null);
            }
        };

        const interval = setInterval(checkShiftStatus, 30000);
        const timer = setTimeout(checkShiftStatus, 3000);
        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [data.settings, user]);

    const save = async (key, val) => {
        let updated;
        if (['settings', 'muzakki'].includes(key)) {
            updated = val;
            const stateKey = key === 'muzakki' ? 'muzakkiDB' : key;
            setData(p => ({ ...p, [stateKey]: val }));
        } else {
            const list = data[key] || [];
            const isEdit = !!modal.data;
            updated = isEdit
                ? list.map(i => i.id === modal.data.id ? { ...val, id: modal.data.id } : i)
                : [{ ...val, id: Date.now(), petugas: user.nama }, ...list];

            setData(p => ({ ...p, [key]: updated }));

            if (!isEdit && (key === 'penerimaan' || key === 'pengeluaran')) {
                await gasClient.logActivity(user.nama, 'INPUT_' + key.toUpperCase(), `Input ${key} baru`);
            }

            if (!isEdit && key === 'penerimaan') {
                const newItem = updated[0];
                try {
                    const res = await gasClient.request('generateReceiptPDF', { item: newItem, settings: data.settings });
                    if (res.success) {
                        setReceiptData({ ...newItem, pdfBase64: res.base64, filename: res.filename });
                    }
                } catch (e) {
                    console.error("PDF Generation Failed", e);
                }
            }
        }
        closeModalAnimated();
        await gasClient.updateData('masjid-' + key, updated);
    }

    const del = async (key, id) => {
        if (!confirm('Hapus data ini?')) return;
        const updated = data[key].filter(i => i.id !== id);
        setData(p => ({ ...p, [key]: updated }));
        await gasClient.updateData('masjid-' + key, updated);
    }

    const handleCheckIn = async (location, shift, jenis, coords, role) => {
        try {
            const result = await gasClient.logAttendance(user.nama, location, shift, coords, 'CHECK_IN');
            if (result.success) {
                const newData = await gasClient.loadAllData();
                setData(prev => ({ ...prev, ...newData }));
                const shiftConfig = (data.settings?.shifts || []).find(s => s.name === shift);
                const kroscekReminder = shiftConfig?.requireKroscek ? '\n\n⚠️ PENTING: Shift ini WAJIB KROSCEK sebelum checkout!' : '';
                const roleNotif = result.role === 'SUPPORT' ? '\n\n⚠️ Shift sudah penuh!\nAnda masuk sebagai SUPPORT (50% XP)' : '';
                alert(`✅ Berhasil absen di ${shift}${roleNotif}${kroscekReminder}`);
                return true;
            } else {
                alert(result.message || 'Gagal check-in');
            }
        } catch (e) {
            alert('Error: ' + e.toString());
        }
    }

    return (
        <div className="pb-32 min-h-screen relative pt-24 sm:pt-28">
            {timeWarning && (
                <div className="fixed top-20 left-4 right-4 z-[60] -mt-2">
                    <div className="bg-red-500 text-white p-4 rounded-2xl shadow-xl border-l-4 border-white flex items-center gap-3 animate-pulse">
                        <AlertTriangle className="shrink-0" size={24} />
                        <span className="font-bold text-sm">{timeWarning}</span>
                    </div>
                </div>
            )}

            <div className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 flex justify-between items-start glass-dock !rounded-none !border-t-0 !border-x-0 !shadow-sm h-auto"
                style={{ paddingTop: 'calc(1rem + var(--safe-area-top))', paddingBottom: '1rem', transform: 'translateZ(0)' }}>
                <div onClick={onOpenProfile} className="cursor-pointer group flex items-center gap-3">
                    <div className={`avatar-frame ${user.equippedBadge ? 'frame-' + user.equippedBadge : ''} !p-0.5 mt-1`}>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[var(--glass-border)] p-0.5 relative group-hover:border-[var(--accent-secondary)] transition">
                            <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-surface)] flex items-center justify-center shadow-inner">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.nama} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-lg font-bold" style={{ color: user.avatarColor ? '#' + user.avatarColor : 'var(--text-muted)' }}>
                                        {user.nama?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[var(--bg-page)] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-0.5">Petugas Aktif</p>
                        <h1 className="text-sm sm:text-base font-black flex items-center gap-2 group-hover:text-[var(--accent-secondary)] transition line-clamp-1 text-white">{user.nama}</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold bg-[var(--bg-surface)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-surface)] uppercase tracking-tight">{user.role}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowAbsen(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-600/30 transition text-xs sm:text-sm">
                        <CheckCircle size={18} /> <span className="hidden sm:inline">Absen</span>
                    </button>
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                    <button onClick={onLogout} className="w-11 h-11 sm:w-10 sm:h-10 rounded-full glass-card flex items-center justify-center hover:bg-red-500/20 text-red-300 transition border border-white/10">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            <div className="px-4 sm:px-6 py-4 sm:py-6 animate-fade-in" key={tab}>
                {tab === 'dashboard' && <AdminDashboardHome data={data} setModal={setModal} />}
                {(tab === 'penerimaan' || tab === 'pengeluaran' || tab === 'mustahik') && (
                    <ListView type={tab} data={data[tab]} settings={data.settings} onAdd={() => setModal({ type: tab })} onEdit={(i) => setModal({ type: tab, data: i })} onDel={(id) => del(tab, id)} />
                )}
                {tab === 'muzakki' && <MasterMuzakkiManager data={data} setData={setData} save={save} />}
                <div style={{ display: tab === 'kroscek' ? 'block' : 'none' }}>
                    <KroscekKasView data={data} user={user} setData={setData} />
                </div>
                {tab === 'kinerja' && <PerformanceView data={data} />}
                {tab === 'users' && <UserManagementView currentUser={user} data={data} setData={setData} />}
                {tab === 'laporan' && <LaporanView data={data} />}
                {tab === 'settings' && <SettingsView data={data} setData={setData} save={save} />}
            </div>

            <div className="fixed z-50 pointer-events-none" style={{ bottom: 'calc(15px + env(safe-area-inset-bottom))', left: '20px', right: '20px', transform: 'translateZ(0)' }}>
                <div className="pointer-events-auto flex justify-center">
                    <div className="glass-dock w-full max-w-[1100px] rounded-[100px] px-2 py-2 sm:px-4 sm:py-2 flex items-center gap-2 sm:gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-[15px] bg-white/[0.07] overflow-x-auto scrollbar-hide mx-auto" style={{ scrollSnapType: 'x mandatory' }}>
                        {[
                            { id: 'dashboard', i: Home, label: 'Home' },
                            { id: 'penerimaan', i: TrendingUp, label: 'Input' },
                            { id: 'pengeluaran', i: TrendingDown, label: 'Keluar' },
                            { id: 'mustahik', i: Users, label: 'Mustahik' },
                            { id: 'muzakki', i: Phone, label: 'Muzakki' },
                            { id: 'kroscek', i: CheckCircle, label: 'Audit' },
                            ...(user.role === 'Admin' ? [{ id: 'users', i: Lock, label: 'User' }] : []),
                            { id: 'kinerja', i: Award, label: 'Kinerja' },
                            { id: 'laporan', i: FileText, label: 'Lapor' },
                            { id: 'settings', i: Settings, label: 'Set' }
                        ].map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)} data-tab-id={t.id} style={{ scrollSnapAlign: 'center' }} className={`group relative flex flex-row items-center justify-center flex-shrink-0 w-auto min-w-[72px] sm:min-w-[120px] h-10 sm:h-12 px-4 sm:px-6 rounded-full transition-all duration-300 gap-2 ${tab === t.id ? 'bg-gradient-to-br from-[#4ade80] to-[#2dd4bf] text-white shadow-[0_0_20px_rgba(74,222,128,0.4)]' : 'text-white/60 hover:text-white'}`}>
                                <t.i size={tab === t.id ? 20 : 18} strokeWidth={tab === t.id ? 2.5 : 2} className="flex-shrink-0 sm:w-5 sm:h-5" />
                                <span className={`text-xs sm:text-base font-bold whitespace-nowrap ${tab === t.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {modal && (
                <div className={`profile-modal-overlay z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 ${animState.active && !animState.closing ? 'profile-modal-overlay-enter' : 'profile-modal-overlay-exit'}`} onClick={closeModalAnimated}>
                    <div onClick={e => e.stopPropagation()} className={`glass-card w-full sm:max-w-lg bg-[var(--bg-page)] rounded-t-3xl sm:rounded-3xl p-0 overflow-hidden border border-[var(--glass-border)] shadow-2xl max-h-[95vh] sm:max-h-[90vh] profile-modal-panel ${animState.active && !animState.closing ? 'profile-modal-panel-enter' : 'profile-modal-panel-exit'}`}>
                        <div className="p-5 border-b border-[var(--glass-border)] flex justify-between items-center">
                            <h3 className="font-bold capitalize">Input {modal.type}</h3>
                            <button onClick={closeModalAnimated}><X className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" /></button>
                        </div>
                        <div className="p-4 sm:p-6 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto">
                            {modal.type === 'penerimaan' && <FormPenerimaan initial={modal.data} settings={data.settings} data={data} setData={setData} save={save} user={user} onSave={(d) => save('penerimaan', d)} />}
                            {modal.type === 'pengeluaran' && <FormPengeluaran initial={modal.data} settings={data.settings} onSave={(d) => save('pengeluaran', d)} />}
                            {modal.type === 'mustahik' && <FormMustahik initial={modal.data} onSave={(d) => save('mustahik', d)} />}
                        </div>
                    </div>
                </div>
            )}

            {showAbsen && <AttendanceModal user={user} onClose={() => setShowAbsen(false)} onCheckIn={handleCheckIn} onCheckOut={onCheckOut} settings={data.settings} logs={data.absensi} />}
            {receiptData && <ReceiptSuccessModal data={receiptData} onClose={() => setReceiptData(null)} />}
        </div>
    );
}

export default AdminLayout;
