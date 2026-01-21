import React, { useState, useEffect } from 'react';
import { X, Moon, Package, Clock, MapPin, XCircle, CheckCircle } from 'lucide-react';

function AttendanceModal({ user, onClose, onCheckIn, onCheckOut, settings, logs }) {
    const [animState, setAnimState] = useState({ active: false, closing: false });
    useEffect(() => {
        requestAnimationFrame(() => setAnimState({ active: true, closing: false }));
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleClose = () => {
        setAnimState({ active: true, closing: true });
        setTimeout(onClose, 500);
    };

    const [loadingShift, setLoadingShift] = useState(null);
    const [gpsData, setGpsData] = useState(null);
    const [gpsError, setGpsError] = useState(null);

    const allShifts = settings?.shifts || [];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toLocaleDateString('id-ID', { weekday: 'long' });
    const todayDate = now.toISOString().split('T')[0];

    const shifts = allShifts.filter(s => {
        if (!s.date && !s.dates) return true;
        if (s.date && s.date === todayDate) return true;
        if (s.dates && Array.isArray(s.dates) && s.dates.includes(todayDate)) return true;
        return false;
    });

    useEffect(() => {
        let watchId;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    setGpsData({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setGpsError(null);
                },
                (err) => setGpsError('GPS Dinonaktifkan'),
                { enableHighAccuracy: true }
            );
        }
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleCheckIn = async (shift, role) => {
        if (shift.lat && shift.lng && gpsData) {
            const d = calculateDistance(gpsData.lat, gpsData.lng, shift.lat, shift.lng);
            if (d > (shift.radius || 100)) {
                return alert('⛔ Di luar radius! Anda berjarak ' + Math.round(d) + 'm dari lokasi.');
            }
        }

        setLoadingShift(shift.name);
        try {
            await onCheckIn('Masjid', shift.name, 'Shift Rutin', gpsData, role);
        } finally {
            setLoadingShift(null);
        }
    };

    const handleLocalCheckOut = async (shift) => {
        const session = (logs || []).find(l =>
            l.officer === user.nama &&
            l.shift === shift.name &&
            l.status === 'In Progress'
        );

        if (!session) return alert('Tidak ada sesi aktif untuk shift ini.');

        const requireKroscek = shift.requireKroscek === true;
        let confirmMsg = `Selesaikan shift "${shift.name}" sekarang?`;
        if (requireKroscek) {
            confirmMsg = `⚠️ PENTING: Shift ini WAJIB KROSCEK!\n\nJika checkout tanpa kroscek, XP akan dikurangi 50 poin.\n\nSelesaikan shift "${shift.name}" sekarang?`;
        }

        if (!confirm(confirmMsg)) return;

        setLoadingShift(shift.name);
        try {
            if (onCheckOut) {
                session.shiftConfig = shift;
                await onCheckOut(session);
            }
        } finally {
            setLoadingShift(null);
        }
    };

    return (
        <div
            className={`profile-modal-overlay z-[70] flex items-center justify-center p-4 ${animState.active && !animState.closing ? 'profile-modal-overlay-enter' : 'profile-modal-overlay-exit'}`}
            onClick={handleClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                className={`w-full max-w-lg profile-modal-panel ${animState.active && !animState.closing ? 'profile-modal-panel-enter' : 'profile-modal-panel-exit'}`}
            >
                <div className="flex justify-between items-center mb-6 text-white text-left">
                    <div>
                        <h3 className="text-2xl font-black tracking-tight">Pilih Tugas Jaga</h3>
                        <p className="text-xs opacity-60 font-medium uppercase tracking-widest">{todayStr}, {timeStr}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"><X size={20} /></button>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    {shifts.length === 0 ? (
                        <div className="glass-card p-10 text-center rounded-3xl opacity-50">
                            <p className="text-white">Belum ada jadwal shift yang diatur.</p>
                        </div>
                    ) : (
                        shifts.map(s => {
                            let isActive = false;
                            const now = new Date();

                            if (s.days && Array.isArray(s.days) && s.days.length > 0) {
                                const dayMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                                const currentDayName = dayMap[now.getDay()];
                                if (!s.days.includes(currentDayName)) return null;
                            }

                            if (s.startTime && s.startTime.includes('T')) {
                                const startDT = new Date(s.startTime);
                                const endDT = new Date(s.endTime);
                                isActive = now >= startDT && now <= endDT;
                            } else {
                                isActive = timeStr >= s.startTime && timeStr <= s.endTime;
                            }

                            const filled = (logs || []).filter(l => l.shift === s.name && l.status === 'In Progress').length;
                            const quota = s.quota || 1;
                            const isFull = filled >= quota;
                            const userAlreadyInShift = (logs || []).some(l => l.shift === s.name && l.officer === user.nama && l.status === 'In Progress');
                            const showAsSupport = isFull && !userAlreadyInShift;

                            const isNight = s.name.toLowerCase().includes('malam');
                            const isDistribusi = s.name.toLowerCase().includes('distribusi');
                            const requireKroscek = s.requireKroscek === true;

                            const cardTheme = isNight ? 'from-indigo-600/40 to-purple-900/40 border-indigo-400/30' :
                                isDistribusi ? 'from-amber-500/40 to-orange-700/40 border-amber-400/30' :
                                    'from-emerald-500/40 to-teal-800/40 border-emerald-400/30';

                            const glowColor = isNight ? 'shadow-indigo-500/20' : isDistribusi ? 'shadow-amber-500/20' : 'shadow-emerald-500/20';
                            const isCheckedIn = userAlreadyInShift;
                            const isThisShiftLoading = loadingShift === s.name;

                            return (
                                <div key={s.name} className={`glass-card relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-300 ${isActive ? 'scale-100 opacity-100 shadow-2xl' : 'scale-95 opacity-40 grayscale pointer-events-none'} ${cardTheme} ${glowColor} text-left`}>
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 shadow-inner">
                                                {isNight ? <Moon className="text-indigo-300 fill-indigo-300/30" size={28} /> :
                                                    isDistribusi ? <Package className="text-amber-300 fill-amber-300/30" size={28} /> :
                                                        <Clock className="text-emerald-300" size={28} />}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                                    {s.name}
                                                    {requireKroscek && <span className="text-[9px] bg-red-500/20 border border-red-500 text-red-300 px-1.5 py-0.5 rounded ml-1">WAJIB PROSES</span>}
                                                </h4>
                                                <div className="text-white/70 text-sm font-medium flex items-center gap-2">
                                                    <MapPin size={14} className="opacity-60" /> {s.location || 'Masjid'}
                                                </div>
                                                <div className="text-white/50 text-xs mt-1 font-mono">
                                                    {s.startTime && s.startTime.includes('T')
                                                        ? new Date(s.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(s.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                                        : s.startTime + ' - ' + s.endTime}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 mb-2 justify-end">
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">Personel</span>
                                                <span className="text-sm font-bold text-white">{filled}/{quota}</span>
                                            </div>
                                            <div className="w-20 h-1.5 bg-black/20 rounded-full overflow-hidden mb-4 ml-auto">
                                                <div className={`h-full transition-all duration-500 ${isFull ? 'bg-red-400' : 'bg-white/60'}`} style={{ width: `${Math.min(100, (filled / quota) * 100)}%` }}></div>
                                            </div>
                                            <button onClick={() => isCheckedIn ? handleLocalCheckOut(s) : handleCheckIn(s, showAsSupport ? 'SUPPORT' : 'REGULAR')} disabled={isThisShiftLoading || (!isActive && !isCheckedIn)} className={'px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition shadow-lg ' + (isCheckedIn ? 'bg-red-500 text-white shadow-red-500/40 hover:bg-red-600' : showAsSupport ? 'bg-orange-500 text-white shadow-orange-500/40' : 'bg-white text-black shadow-white/20 hover:scale-105')}>
                                                {isThisShiftLoading ? '...' : isCheckedIn ? 'Check Out' : showAsSupport ? 'Support' : 'Absen'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em]">
                    {gpsError ? (
                        <span className="text-red-400 flex items-center gap-1"><XCircle size={12} /> {gpsError}</span>
                    ) : gpsData ? (
                        <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> Geofencing Active</span>
                    ) : (
                        <span className="text-white/40 animate-pulse">🛰️ Mencari Lokasi...</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AttendanceModal;
