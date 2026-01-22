import React, { useState, useEffect } from 'react';
import {
    Home, TrendingUp, TrendingDown, Users, Phone, CheckCircle,
    Lock, Award, FileText, Settings, X, LogOut, AlertTriangle
} from 'lucide-react';
import { LayoutGroup, AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
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
import GlassHeader from './GlassHeader';
import FloatingDock from './FloatingDock';

function AdminLayout({ user, data, setData, onLogout, onCheckOut, toggleTheme, theme, onOpenProfile }) {
    const [tab, setTab] = useState('dashboard');
    const [modal, setModal] = useState(null);
    const [receiptData, setReceiptData] = useState(null);
    const [animState, setAnimState] = useState({ active: false, closing: false });
    const [timeWarning, setTimeWarning] = useState(null);
    const [showAbsen, setShowAbsen] = useState(false);

    useEffect(() => {
        if (modal) {
            const timeout = setTimeout(() => {
                setAnimState({ active: true, closing: false });
            }, 0);
            document.body.style.overflow = 'hidden';
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => {
                setAnimState({ active: false, closing: false });
            }, 0);
            document.body.style.overflow = '';
            return () => clearTimeout(timeout);
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
            const shifts = data.settings?.shifts || [];
            if (shifts.length === 0) return;

            const endingSoon = shifts.find(s => {
                if (!s.endTime) return false;
                const [h, m] = s.endTime.split(':').map(Number);
                const endMin = h * 60 + m;
                const nowTotalMin = now.getHours() * 60 + now.getMinutes();

                let diff = endMin - nowTotalMin;
                // Handle overlap to next day
                if (diff < 0) diff += 24 * 60;

                // If within 2 min range
                const isWithinRange = diff <= 2 && diff > 0;

                // Also check if current time is actually within the shift
                const [sh, sm] = s.startTime.split(':').map(Number);
                const startMin = sh * 60 + sm;

                let isCurrentShift = false;
                if (startMin < endMin) {
                    isCurrentShift = nowTotalMin >= startMin && nowTotalMin < endMin;
                } else {
                    // Crosses midnight
                    isCurrentShift = nowTotalMin >= startMin || nowTotalMin < endMin;
                }

                return isWithinRange && isCurrentShift;
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
            const result = await gasClient.logAttendance(user.nama, location, shift, coords, 'CHECK_IN', role);
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
        <div className="pb-32 min-h-screen relative">
            {timeWarning && (
                <div className="fixed top-20 left-4 right-4 z-[60] -mt-2">
                    <div className="bg-red-500 text-white p-4 rounded-2xl shadow-xl border-l-4 border-white flex items-center gap-3 animate-pulse">
                        <AlertTriangle className="shrink-0" size={24} />
                        <span className="font-bold text-sm">{timeWarning}</span>
                    </div>
                </div>
            )}

            <GlassHeader className="flex justify-between items-center sm:px-8">
                <div onClick={onOpenProfile} className="cursor-pointer group flex items-center gap-4">
                    <div className={`avatar-frame ${user.equippedBadge ? 'frame-' + user.equippedBadge : ''} !p-0.5`}>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 p-0.5 relative group-hover:border-[var(--accent-secondary)] transition">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white/5 flex items-center justify-center shadow-inner">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.nama} className="w-full h-full object-cover transition duration-300 group-hover:scale-110" />
                                ) : (
                                    <div className="text-lg font-black" style={{ color: user.avatarColor ? '#' + user.avatarColor : 'rgba(255,255,255,0.4)' }}>
                                        {user.nama?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#12141c] rounded-full"></div>
                        </div>
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-none mb-1">Petugas</p>
                        <h1 className="text-base font-black text-white group-hover:text-[var(--accent-primary)] transition">{user.nama}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAbsen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/20 transition text-sm"
                    >
                        <CheckCircle size={18} /> <span>Absen</span>
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                    <button
                        onClick={onLogout}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/10 text-red-400 transition border border-white/10"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </GlassHeader>

            <div className="px-4 sm:px-6 py-4 sm:py-6 relative min-h-[calc(100vh-180px)] pt-24 sm:pt-28">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, scale: 0.98, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -5 }}
                        transition={{
                            type: 'spring',
                            stiffness: 600,
                            damping: 35,
                            mass: 0.5
                        }}
                        className="w-full"
                    >
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
                    </motion.div>
                </AnimatePresence>
            </div>

            <FloatingDock
                activeTab={tab}
                onTabChange={setTab}
                items={[
                    { id: 'dashboard', icon: <Home size={20} />, label: 'Home' },
                    { id: 'penerimaan', icon: <TrendingUp size={20} />, label: 'Input' },
                    { id: 'pengeluaran', icon: <TrendingDown size={20} />, label: 'Keluar' },
                    { id: 'mustahik', icon: <Users size={20} />, label: 'Mustahik' },
                    { id: 'muzakki', icon: <Phone size={20} />, label: 'Muzakki' },
                    { id: 'kroscek', icon: <CheckCircle size={20} />, label: 'Audit' },
                    ...(user.role === 'Admin' ? [{ id: 'users', icon: <Lock size={20} />, label: 'User' }] : []),
                    { id: 'kinerja', icon: <Award size={20} />, label: 'Kinerja' },
                    { id: 'laporan', icon: <FileText size={20} />, label: 'Lapor' },
                    { id: 'settings', icon: <Settings size={20} />, label: 'Set' }
                ]}
            />

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
