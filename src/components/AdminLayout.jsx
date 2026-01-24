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
import AvatarFrame from './AvatarFrame';
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
import { generateReceiptPDFBase64 } from '../utils/receipt';

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
        // Locate the scrollable container (the div wrapping LayoutGroup)
        // It has the class "glass-dock" and "overflow-x-auto"
        const dockNav = document.getElementById('dock-nav')?.closest('.glass-dock');
        const activeBtn = document.querySelector(`button[data-tab-id="${tab}"]`);

        if (activeBtn && dockNav) {
            const containerWidth = dockNav.offsetWidth;
            const btnLeft = activeBtn.offsetLeft;
            const btnWidth = activeBtn.offsetWidth;

            // Calculate center position
            const scrollPos = btnLeft - (containerWidth / 2) + (btnWidth / 2);

            dockNav.scrollTo({
                left: scrollPos,
                behavior: 'smooth'
            });
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

            if (!isEdit && key === 'penerimaan') {
                const newItem = updated[0];

                // Generate PDF using frontend jsPDF (same as DetailView "Cetak" button)
                try {
                    const pdfResult = generateReceiptPDFBase64(newItem, data.settings);
                    setReceiptData({ ...newItem, pdfBase64: pdfResult.base64, filename: pdfResult.filename, pdfLoading: false });
                } catch (e) {
                    console.error("PDF Generation Failed", e);
                    setReceiptData({ ...newItem, pdfBase64: null, filename: null, pdfLoading: false, pdfError: true });
                }

                // Run background tasks (no await)
                gasClient.logActivity(user.nama, 'INPUT_PENERIMAAN', 'Input penerimaan baru').catch(console.error);
                gasClient.updateData('masjid-' + key, updated).catch(console.error);

                // Don't close FormPenerimaan - it stays open behind ReceiptSuccessModal
                // Both will close together when ReceiptSuccessModal's onClose is called
                return;
            } else if (!isEdit && key === 'pengeluaran') {
                await gasClient.logActivity(user.nama, 'INPUT_PENGELUARAN', 'Input pengeluaran baru');
            }
        }

        // Close modal for non-penerimaan or edit mode
        if (key !== 'penerimaan' || (modal && modal.data)) {
            closeModalAnimated();
        }

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
                    <div className="relative mt-1">
                        <AvatarFrame user={user} size="md" className="group-hover:scale-105 transition-transform" />
                        <div className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 border-2 border-[var(--bg-page)] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] z-40"></div>
                    </div>
                    <div>
                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-0.5">Petugas Aktif</p>
                        <h1 className="text-sm sm:text-base font-black flex items-center gap-2 group-hover:text-[var(--accent-secondary)] transition line-clamp-1 text-[var(--text-primary)]">{user.nama}</h1>
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

            <div className="px-4 sm:px-6 py-4 sm:py-6 relative min-h-[calc(100vh-180px)]">
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

            <div className="fixed z-50 pointer-events-none" style={{ bottom: 'calc(15px + env(safe-area-inset-bottom))', left: '20px', right: '20px', transform: 'translateZ(0)' }}>
                <div className="pointer-events-auto flex justify-center">
                    <div className="glass-dock w-full max-w-[1100px] rounded-[100px] px-2 py-2 sm:px-4 sm:py-2 flex items-center gap-2 sm:gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-[15px] bg-white/[0.07] overflow-x-auto scrollbar-hide mx-auto" style={{ scrollSnapType: 'x mandatory' }}>
                        <LayoutGroup id="dock-nav">
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
                            ].map(t => {
                                const isActive = tab === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setTab(t.id)}
                                        data-tab-id={t.id}
                                        style={{ scrollSnapAlign: 'center', WebkitTapHighlightColor: 'transparent' }}
                                        className={`group relative flex flex-row items-center justify-center flex-shrink-0 w-auto min-w-[72px] sm:min-w-[120px] h-10 sm:h-12 px-4 sm:px-6 rounded-full transition-colors duration-300 gap-2 ${isActive ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-dock-pill"
                                                className="absolute inset-0 bg-gradient-to-br from-[#4ade80] to-[#2dd4bf] rounded-full shadow-[0_0_20px_rgba(74,222,128,0.4)]"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <div className="relative z-10 flex items-center gap-2">
                                            <t.i size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0 sm:w-5 sm:h-5 transition-transform duration-300" />
                                            <span className={`text-xs sm:text-base font-bold whitespace-nowrap transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{t.label}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </LayoutGroup>
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
            {receiptData && <ReceiptSuccessModal data={receiptData} settings={data.settings} onClose={() => { setReceiptData(null); closeModalAnimated(); }} />}
        </div>
    );
}

export default AdminLayout;
