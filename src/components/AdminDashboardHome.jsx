import React, { useState } from 'react';
import {
    TrendingUp, TrendingDown, Wallet, Users, Package,
    PieChart, Award, Plus, Minus, Calendar, BarChart3,
    Clock, MapPin, Check, X as CloseIcon
} from 'lucide-react';
import { formatRupiah, getTotal, getTotalBeras } from '../utils/format';
import { getLevel } from '../utils/gamification';

function AdminDashboardHome({ data, setModal, setData, save }) {
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(null);
    const statusKonter = data.settings?.statusKonter || { masjid: { buka: false }, cluster: [] };

    const handleToggleStatus = async (type, index = null) => {
        const newSettings = JSON.parse(JSON.stringify(data.settings));
        if (!newSettings.statusKonter) newSettings.statusKonter = { masjid: { buka: false }, cluster: [] };

        const target = type === 'masjid' ? newSettings.statusKonter.masjid : newSettings.statusKonter.cluster[index];
        target.buka = !target.buka;

        setIsUpdatingStatus(type === 'masjid' ? 'masjid' : `cluster-${index}`);
        try {
            await save('settings', newSettings);
        } finally {
            setIsUpdatingStatus(null);
        }
    };
    const totalMasuk = (data.penerimaan || []).reduce((s, i) => s + getTotal(i), 0);
    const today = new Date().toISOString().split('T')[0];
    const txToday = (data.penerimaan || []).filter(i => (i.tanggal || '').startsWith(today)).length;

    const compositionMap = {};
    const berasMap = {};
    (data.penerimaan || []).forEach(item => {
        if (Array.isArray(item.jenis)) {
            item.jenis.forEach(j => {
                if (item.jumlah && typeof item.jumlah === 'object') {
                    compositionMap[j] = (compositionMap[j] || 0) + (parseFloat(item.jumlah[j]) || 0);
                }
                if (item.beratBeras && typeof item.beratBeras === 'object') {
                    berasMap[j] = (berasMap[j] || 0) + (parseFloat(item.beratBeras[j]) || 0);
                }
            });
        } else if (item.jenis) {
            const jenis = item.jenis;
            if (item.jumlah && typeof item.jumlah === 'object') {
                compositionMap[jenis] = (compositionMap[jenis] || 0) + (parseFloat(item.jumlah[jenis]) || 0);
            } else {
                compositionMap[jenis] = (compositionMap[jenis] || 0) + (parseFloat(item.jumlah) || 0);
            }
            if (item.beratBeras && typeof item.beratBeras === 'object') {
                berasMap[jenis] = (berasMap[jenis] || 0) + (parseFloat(item.beratBeras[jenis]) || 0);
            } else if (item.beratBeras && typeof item.beratBeras === 'number') {
                berasMap[jenis] = (berasMap[jenis] || 0) + item.beratBeras;
            }
        }
    });

    const colors = [
        { c: 'bg-emerald-500', color: 'text-emerald-400' },
        { c: 'bg-blue-500', color: 'text-blue-400' },
        { c: 'bg-purple-500', color: 'text-purple-400' },
        { c: 'bg-amber-500', color: 'text-amber-400' },
        { c: 'bg-pink-500', color: 'text-pink-400' },
        { c: 'bg-cyan-500', color: 'text-cyan-400' },
        { c: 'bg-rose-500', color: 'text-rose-400' },
    ];

    const composition = Object.entries(compositionMap)
        .map(([label, value], idx) => ({
            l: label,
            v: value,
            beras: berasMap[label] || 0,
            c: colors[idx % colors.length].c,
            color: colors[idx % colors.length].color
        }))
        .filter(i => i.v > 0 || i.beras > 0)
        .sort((a, b) => b.v - a.v);

    // Gamification & Leaderboard Logic
    const leaderboard = (data.leaderboard || [])
        .map(item => ({ ...item, level: getLevel(item.xp) }))
        .slice(0, 5);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="glass-card p-4 md:p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <p className="text-xs text-emerald-400 font-bold mb-1 uppercase tracking-wider">HARI INI</p>
                            <h2 className="text-3xl font-black text-emerald-500 dark:text-emerald-400">{txToday}</h2>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">Transaksi Masuk</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Calendar className="text-emerald-400" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4 md:p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <p className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-wider">TOTAL MUZAKKI</p>
                            <h2 className="text-3xl font-black text-blue-500 dark:text-blue-400">{(data.penerimaan || []).length}</h2>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">Seluruh Transaksi</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <BarChart3 className="text-blue-400" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4 md:p-6 rounded-3xl border border-purple-500/20 bg-purple-500/5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <p className="text-xs text-purple-400 font-bold mb-1 uppercase tracking-wider">PEMASUKAN</p>
                            <h2 className="text-xl font-black text-purple-500 dark:text-purple-400">{formatRupiah(totalMasuk)}</h2>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">Akumulasi Dana</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <TrendingUp className="text-purple-400" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4 md:p-6 rounded-3xl border border-orange-500/20 bg-orange-500/5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <p className="text-xs text-orange-400 font-bold mb-1 uppercase tracking-wider">TOTAL BERAS</p>
                            <h2 className="text-xl font-black text-orange-500 dark:text-orange-400">{(data.penerimaan || []).reduce((s, i) => s + getTotalBeras(i), 0)} <span className="text-sm">Kg</span></h2>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">Zakat Fitrah</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                            <Package className="text-orange-400" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button
                    onClick={() => setModal({ type: 'penerimaan' })}
                    className="relative overflow-hidden group min-h-[140px] rounded-3xl p-6 flex flex-col items-center justify-center gap-2 transition-all duration-300 active:scale-95 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 backdrop-blur-md shadow-lg"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-150 transition duration-500">
                        <TrendingUp size={80} />
                    </div>
                    <div className="bg-emerald-500/20 p-3 rounded-2xl mb-1 backdrop-blur-sm border border-emerald-500/20 group-hover:scale-110 transition">
                        <Plus size={28} className="text-emerald-400" />
                    </div>
                    <span className="font-bold text-lg text-emerald-400">Input Penerimaan</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium bg-[var(--bg-page)]/50 px-2 py-1 rounded-lg">Masukan data baru</span>
                </button>

                <button
                    onClick={() => setModal({ type: 'pengeluaran' })}
                    className="relative overflow-hidden group min-h-[140px] rounded-3xl p-6 flex flex-col items-center justify-center gap-2 transition-all duration-300 active:scale-95 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 backdrop-blur-md shadow-lg"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-150 transition duration-500">
                        <TrendingDown size={80} />
                    </div>
                    <div className="bg-rose-500/20 p-3 rounded-2xl mb-1 backdrop-blur-sm border border-rose-500/20 group-hover:scale-110 transition">
                        <Minus size={28} className="text-rose-400" />
                    </div>
                    <span className="font-bold text-lg text-rose-400">Input Pengeluaran</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium bg-[var(--bg-page)]/50 px-2 py-1 rounded-lg">Catat pengeluaran</span>
                </button>
            </div>

            {/* Analytics & Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-3xl border border-[var(--border-surface)]">
                        <h3 className="font-bold text-lg flex items-center gap-2 mb-6 uppercase tracking-widest text-[var(--text-secondary)]">
                            <PieChart size={20} className="text-emerald-400" /> Komposisi Zakat
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {composition.map((c, i) => (
                                <div key={i} className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-surface)] group hover:bg-white/5 transition">
                                    <div className={`w-2 h-2 rounded-full mb-3 ${c.c} shadow-lg shadow-current`}></div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-1 font-bold">{c.l}</div>
                                    <div className="space-y-1">
                                        {c.v > 0 && <div className={`font-bold font-mono text-sm ${c.color}`}>{formatRupiah(c.v)}</div>}
                                        {c.beras > 0 && <div className="text-xs font-bold text-orange-400">🌾 {c.beras} Kg</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rekening Widget */}
                    {data.settings?.rekening?.norek && (
                        <div className="glass-card p-6 rounded-3xl bg-emerald-900/10 border border-emerald-500/20 flex items-center gap-4 text-left">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase">Rekening Zakat</p>
                                <p className="text-lg font-black">{data.settings.rekening.bank} {data.settings.rekening.norek}</p>
                                <p className="text-xs text-[var(--text-muted)]">{data.settings.rekening.atasNama}</p>
                            </div>
                        </div>
                    )}

                    {/* Operational Status Control (Specific Admin Widget) */}
                    <div className="glass-card p-6 rounded-3xl border border-[var(--border-surface)] bg-white/[0.02]">
                        <h3 className="font-bold text-lg flex items-center gap-2 mb-6 uppercase tracking-widest text-[var(--text-secondary)]">
                            <Clock size={20} className="text-blue-400" /> Manajemen Operasional
                        </h3>
                        <div className="space-y-4">
                            {/* Masjid Switcher */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-surface)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">🕌</div>
                                    <div>
                                        <p className="font-bold text-sm">Counter Masjid</p>
                                        <p className="text-[10px] text-[var(--text-muted)] font-medium">Layanan di Masjid Utama</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleStatus('masjid')}
                                    disabled={isUpdatingStatus === 'masjid'}
                                    className={`relative w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 ${statusKonter.masjid.buka ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gray-600'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${statusKonter.masjid.buka ? 'translate-x-6' : 'translate-x-0'}`}>
                                        {isUpdatingStatus === 'masjid' ? <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div> : (statusKonter.masjid.buka ? <Check size={14} className="text-emerald-500 font-bold" /> : <CloseIcon size={14} className="text-gray-400" />)}
                                    </div>
                                </button>
                            </div>

                            {/* Cluster Switchers */}
                            {(statusKonter.cluster || []).map((c, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-surface)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl">🏘️</div>
                                        <div>
                                            <p className="font-bold text-sm">{c.nama}</p>
                                            <p className="text-[10px] text-[var(--text-muted)] font-medium">Layanan Area Cluster</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleStatus('cluster', idx)}
                                        disabled={isUpdatingStatus === `cluster-${idx}`}
                                        className={`relative w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 ${c.buka ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gray-600'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${c.buka ? 'translate-x-6' : 'translate-x-0'}`}>
                                            {isUpdatingStatus === `cluster-${idx}` ? <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div> : (c.buka ? <Check size={14} className="text-emerald-500 font-bold" /> : <CloseIcon size={14} className="text-gray-400" />)}
                                        </div>
                                    </button>
                                </div>
                            ))}

                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                                <MapPin size={16} className="text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-300 font-medium leading-relaxed">
                                    Status ini akan langsung terlihat oleh publik di halaman depan. Pastikan petugas sudah siap di lokasi sebelum membuka layanan.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-3xl border border-[var(--border-surface)]">
                    <h3 className="font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-[var(--text-secondary)]">
                        <Award size={20} className="text-yellow-400" /> Top Petugas (Input)
                    </h3>
                    <div className="space-y-4">
                        {leaderboard.map((item, idx) => {
                            const userObj = (data.users || []).find(u => u.nama === item.name);
                            return (
                                <div key={item.name} className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-surface)] relative overflow-hidden group hover:border-blue-400 transition">
                                    <div className={`absolute top-0 left-0 px-2 py-0.5 rounded-br-xl text-[10px] font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-orange-700 text-white' : 'bg-[var(--glass-border)] text-[var(--text-muted)]'}`}>
                                        #{idx + 1}
                                    </div>
                                    <div className={`avatar-frame ${item.equippedBadge ? 'frame-' + item.equippedBadge : ''} !p-0.5 mt-2`}>
                                        <div className="w-10 h-10 rounded-full border border-[var(--glass-border)] flex items-center justify-center bg-[var(--bg-page)] overflow-hidden shrink-0">
                                            {userObj?.avatarUrl ? (
                                                <img src={userObj.avatarUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-xs" style={{ color: userObj?.avatarColor ? '#' + userObj.avatarColor : undefined }}>
                                                    {item.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <p className="font-bold text-sm truncate">{item.name}</p>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${item.level.bg} ${item.level.color} whitespace-nowrap`}>
                                                    {item.level.icon} {item.level.title}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                                    style={{ width: `${Math.min(100, (item.xp / 5000) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-bold text-purple-400">{item.xp} <span className="text-[10px] opacity-60">XP</span></span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {leaderboard.length === 0 && <p className="text-[var(--text-muted)] text-center text-sm py-4">Belum ada data aktivitas</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboardHome;
