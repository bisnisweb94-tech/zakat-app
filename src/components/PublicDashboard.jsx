import React, { useState, useEffect, useRef } from 'react';
import { LogIn, TrendingUp, TrendingDown, CreditCard, Wallet } from 'lucide-react';
import { formatRupiah, getTotal, getTotalBeras } from '../utils/format';
import ThemeToggle from './ThemeToggle';
import ZakatChart from './ZakatChart';
import PublicPaymentModal from './PublicPaymentModal';

const StatusCard = ({ title, active, tanggal, tanggalSelesai, jamBuka, jamTutup, icon }) => {
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const dateDisplay = tanggalSelesai ? `${formatDate(tanggal)} - ${formatDate(tanggalSelesai)}` : tanggal ? formatDate(tanggal) : '-';

    return (
        <div className={`p-5 rounded-3xl border transition-all ${active ? 'bg-emerald-500/10 border-emerald-500/20 shadow-lg' : 'bg-red-500/5 border-red-500/10'} text-left`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${active ? 'bg-emerald-500/20 text-emerald-400 dark:text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>{icon}</div>
                <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${active ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>{active ? 'OPEN' : 'CLOSED'}</div>
            </div>
            <h4 className="font-bold text-lg">{title}</h4>
            {active ? <div className="mt-1"><p className="text-xs text-emerald-600 dark:text-emerald-400">{dateDisplay}</p>{jamBuka && <p className="text-[10px] text-gray-500 dark:text-gray-400">{jamBuka} - {jamTutup}</p>}</div> : <p className="text-xs text-gray-500 mt-1">Layanan Tutup</p>}
        </div>
    );
};

function PublicDashboard({ data, onGoToLogin, toggleTheme, theme, onRefresh }) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const totalMasuk = (data.penerimaan || []).reduce((s, i) => s + getTotal(i), 0);
    const totalKeluar = (data.pengeluaran || []).reduce((s, i) => s + (parseFloat(i.jumlah) || 0), 0);
    const target = data.settings?.targetZakatFitrah || 1;

    const totalBeras = (data.penerimaan || []).reduce((s, i) => s + getTotalBeras(i), 0);

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
        { c: 'bg-emerald-500', t: 'bg-emerald-500/20 text-emerald-400' },
        { c: 'bg-cyan-500', t: 'bg-cyan-500/20 text-cyan-400' },
        { c: 'bg-violet-500', t: 'bg-violet-500/20 text-violet-400' },
        { c: 'bg-amber-500', t: 'bg-amber-500/20 text-amber-400' }
    ];

    const compositionData = Object.entries(compositionMap)
        .map(([label, value], idx) => ({
            l: label,
            v: value,
            beras: berasMap[label] || 0,
            c: colors[idx % colors.length].c,
            t: colors[idx % colors.length].t
        }))
        .filter(i => i.v > 0 || i.beras > 0)
        .sort((a, b) => b.v - a.v);

    const zakatFitrah = compositionMap['Zakat Fitrah'] || 0;
    const percentage = target > 0 ? Math.min((zakatFitrah / target) * 100, 100) : 0;
    const statusKonter = data.settings?.statusKonter || { masjid: { buka: false }, cluster: [] };
    const allStatuses = [
        { title: "Masjid", icon: "🕌", ...statusKonter.masjid },
        ...(statusKonter.cluster || [])
    ];

    const scrollRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (allStatuses.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => {
                const next = (prev + 1) % allStatuses.length;
                if (scrollRef.current) {
                    const cardHeight = scrollRef.current.offsetHeight;
                    scrollRef.current.scrollTo({
                        top: next * cardHeight,
                        behavior: 'smooth'
                    });
                }
                return next;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [allStatuses.length]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="min-h-screen pb-10 bg-[var(--bg-page)] text-[var(--text-primary)]">
            {/* Fixed Header with Safe Area Support */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-page)]/80 backdrop-blur-md border-b border-[var(--glass-border)] transition-all duration-300"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                <div className="px-4 py-4 max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20"><span className="font-black text-xl text-white">Z</span></div>
                        <div className="text-left">
                            <h1 className="font-bold text-base leading-tight text-[var(--text-primary)]">{data.settings?.namaMasjid || 'Zakat OS'}</h1>
                            <p className="text-[10px] text-cyan-400 uppercase tracking-widest">Realtime Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                        <button onClick={onGoToLogin} className="px-4 py-2.5 rounded-xl glass-card border border-white/10 text-sm font-bold flex items-center gap-2 transition hover:scale-105 text-[var(--text-primary)]">
                            <LogIn size={16} /> <span>Login</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content with padding-top to account for fixed header + safe area */}
            <div className="max-w-7xl mx-auto px-4 pb-8 space-y-6" style={{ paddingTop: 'calc(80px + env(safe-area-inset-top))' }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Col 1: Total Kas + Beras Stack */}
                    <div className="flex flex-col gap-4">
                        {/* Total Kas (Redesigned Premium) */}
                        <div className={`glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[180px] bg-gradient-to-br text-left border-emerald-500/20 shadow-2xl shadow-emerald-900/20 group ${theme === 'light' ? 'from-emerald-50 via-white to-emerald-50' : 'from-[#0f172a] via-[#022c22] to-black text-white'}`}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-1.5 rounded-lg border border-emerald-500/30 ${theme === 'light' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        <Wallet size={16} />
                                    </div>
                                    <p className={`text-xs uppercase tracking-[0.2em] font-bold ${theme === 'light' ? 'text-emerald-800' : 'text-emerald-100/70'}`}>Total Harta Zakat</p>
                                </div>
                                <h2 className={`text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r tracking-tight ${theme === 'light' ? 'from-emerald-700 to-emerald-900' : 'from-emerald-200 via-white to-emerald-200'} drop-shadow-sm`}>
                                    {formatRupiah(totalMasuk - totalKeluar)}
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 gap-3 relative z-10 mt-6">
                                <div className={`flex flex-col p-3 rounded-2xl border backdrop-blur-sm transition-colors ${theme === 'light' ? 'bg-emerald-500/10 border-emerald-200' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07]'}`}>
                                    <span className={`text-[10px] uppercase font-bold mb-1 flex items-center gap-1 ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-400/80'}`}><TrendingUp size={10} /> Pemasukan</span>
                                    <span className={`font-bold text-sm sm:text-base ${theme === 'light' ? 'text-emerald-900' : 'text-white'}`}>{formatRupiah(totalMasuk)}</span>
                                </div>
                                <div className={`flex flex-col p-3 rounded-2xl border backdrop-blur-sm transition-colors ${theme === 'light' ? 'bg-red-500/10 border-red-200' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07]'}`}>
                                    <span className={`text-[10px] uppercase font-bold mb-1 flex items-center gap-1 ${theme === 'light' ? 'text-red-700' : 'text-red-400/80'}`}><TrendingDown size={10} /> Penyaluran</span>
                                    <span className={`font-bold text-sm sm:text-base ${theme === 'light' ? 'text-red-900' : 'text-white'}`}>{formatRupiah(totalKeluar)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Total Beras Card */}
                        <div className={`glass-card p-6 rounded-3xl relative overflow-hidden text-left border-orange-500/20 shadow-2xl shadow-orange-900/20 group bg-gradient-to-br ${theme === 'light' ? 'from-orange-50 via-white to-orange-50' : 'from-[#1a1410] via-[#2d1810] to-black'}`}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-1.5 rounded-lg border border-orange-500/30 text-xl ${theme === 'light' ? 'bg-orange-500/10 text-orange-600' : 'bg-orange-500/20 text-orange-400'}`}>🌾</div>
                                    <p className={`text-xs uppercase tracking-[0.2em] font-bold ${theme === 'light' ? 'text-orange-800' : 'text-orange-100/70'}`}>Total Beras Zakat</p>
                                </div>
                                <h3 className={`text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r tracking-tight ${theme === 'light' ? 'from-orange-700 to-orange-900' : 'from-orange-200 via-white to-orange-200'} drop-shadow-sm`}>
                                    {totalBeras} <span className="text-xl">Kg</span>
                                </h3>
                                <p className={`text-xs mt-1 font-medium ${theme === 'light' ? 'text-orange-700/80' : 'text-orange-300/60'}`}>Zakat Fitrah Terkumpul</p>
                            </div>
                        </div>
                    </div>

                    {/* Col 2: Status Widget (Square) */}
                    <div className="glass-card rounded-[2rem] overflow-hidden border border-[var(--glass-border)] flex flex-col bg-black/40 group relative aspect-square">
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide flex flex-col"
                        >
                            {allStatuses.map((status, idx) => (
                                <div key={idx} className="min-h-full snap-start p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-transparent to-white/[0.05]">
                                    {/* Top: Title & Date */}
                                    <div className="flex justify-between items-start z-10">
                                        <div className="min-w-0">
                                            <h4 className={`font-bold text-[13px] uppercase tracking-widest truncate ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>{status.title || status.nama}</h4>
                                            {status.tanggal && (
                                                <p className={`text-[10px] font-bold tracking-tight mt-0.5 ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-400/80'}`}>
                                                    🗓️ {formatDate(status.tanggal)}{status.tanggalSelesai ? ` - ${formatDate(status.tanggalSelesai)}` : ''}
                                                </p>
                                            )}
                                        </div>
                                        <div className={`w-2.5 h-2.5 rounded-full ${status.buka ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'} animate-pulse shrink-0`}></div>
                                    </div>

                                    {/* Middle: Primary Status (Large) */}
                                    <div className="z-10 py-1">
                                        <p className={`text-5xl font-black tracking-tighter ${status.buka ? (theme === 'light' ? 'text-emerald-700' : 'text-white') : (theme === 'light' ? 'text-slate-400' : 'text-gray-500')}`}>
                                            {status.buka ? 'OPEN' : 'CLSD'}
                                        </p>
                                        <p className={`text-[10px] font-bold mt-1 ${status.buka ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : (theme === 'light' ? 'text-red-600' : 'text-red-400')}`}>
                                            {status.buka ? 'Layanan Aktif' : 'Layanan Tutup'}
                                        </p>
                                    </div>

                                    {/* Bottom: Icon & Hours */}
                                    <div className="flex items-end justify-between z-10 mt-2">
                                        <div className="text-3xl filter drop-shadow-md">
                                            {status.icon || "🏘️"}
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-[9px] font-black uppercase tracking-tighter ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Hours</p>
                                            <p className={`text-[11px] font-bold tabular-nums ${theme === 'light' ? 'text-slate-700' : 'text-white/80'}`}>
                                                {status.buka ? `${status.jamBuka}-${status.jamTutup}` : 'OFFLINE'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Decorative background glow */}
                                    <div className={`absolute top-1/2 left-0 w-32 h-32 blur-[60px] opacity-20 -translate-x-12 -translate-y-12 rounded-full ${status.buka ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                </div>
                            ))}
                        </div>

                        {/* Vertical Pagination Dots */}
                        <div className="absolute right-3 top-0 bottom-0 flex flex-col justify-center gap-1.5 pointer-events-none z-20">
                            {allStatuses.map((_, i) => (
                                <div key={i} className={`w-1 rounded-full bg-white/40 transition-all duration-300 ${currentIndex === i ? 'h-4 bg-emerald-500' : 'h-1'}`}></div>
                            ))}
                        </div>
                    </div>

                    {/* Col 3: Actions Stack (Payment, Rekening, Konsultasi) */}
                    <div className="flex flex-col gap-3 h-full">
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full flex-1 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 hover:scale-[1.02] active:scale-95 transition-all text-white font-black flex flex-col items-center justify-center shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)] border border-white/20 relative overflow-hidden group min-h-[120px]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 blur-[40px] rounded-full group-hover:scale-150 transition-transform duration-500"></div>

                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl mb-1 shadow-inner">
                                    <CreditCard size={24} className="text-white" />
                                </div>
                                <span className="text-2xl uppercase tracking-tight drop-shadow-md">Bayar Zakat</span>
                                <span className="text-[10px] uppercase tracking-widest opacity-90 px-3 py-1 bg-black/20 rounded-full">Sekarang</span>
                            </div>
                        </button>

                        <div className="flex-1 flex flex-col gap-3">
                            {data.settings?.rekening?.norek && (
                                <div className={`glass-card p-4 rounded-2xl border flex items-center gap-3 text-left transition group bg-gradient-to-br ${theme === 'light' ? 'from-emerald-100 to-teal-50 border-emerald-200 hover:border-emerald-400' : 'from-emerald-900/20 to-teal-900/10 dark:from-emerald-900/20 dark:to-teal-900/10 border-emerald-500/30 hover:border-emerald-400/50'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition shrink-0 ${theme === 'light' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        <Wallet size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[9px] font-bold uppercase mb-0.5 tracking-wider ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>Rekening Zakat</p>
                                        <p className={`text-sm font-black truncate ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{data.settings.rekening.bank}</p>
                                        <p className={`text-[10px] truncate font-mono ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-300/60'}`}>{data.settings.rekening.norek}</p>
                                    </div>
                                </div>
                            )}

                            {data.settings?.nomorKonsultasi && (
                                <a
                                    href={`https://wa.me/${data.settings.nomorKonsultasi}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`glass-card p-4 rounded-2xl border flex items-center gap-3 text-left transition cursor-pointer group bg-gradient-to-br ${theme === 'light' ? 'from-green-100 to-emerald-50 border-green-200 hover:border-green-400' : 'from-green-900/20 to-emerald-900/10 dark:from-green-900/20 dark:to-emerald-900/10 border-green-500/30 hover:border-green-400/50'}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition shrink-0 ${theme === 'light' ? 'bg-green-500/20 text-green-600' : 'bg-green-500/20 text-green-400'}`}>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[9px] font-bold uppercase mb-0.5 tracking-wider ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>Konsultasi</p>
                                        <p className={`text-sm font-black ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>WhatsApp Admin</p>
                                        <p className={`text-[10px] ${theme === 'light' ? 'text-green-700/80' : 'text-green-300/60'}`}>Klik untuk chat</p>
                                    </div>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* ROW 2: Target | Komposisi | Aktivitas (Fixed Height) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[500px]">
                    {/* Col 1: Target Zakat (Full Content) */}
                    <div className="glass-card p-6 rounded-3xl text-center relative overflow-hidden flex flex-col items-center h-full">
                        <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4 self-start">Zakat Fitrah Progress</h3>
                        <div className="w-52 h-52 my-4 relative">
                            <ZakatChart current={zakatFitrah} target={target} theme={theme} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-[var(--text-primary)]">{percentage.toFixed(1)}%</span>
                                <span className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-tight">Tercapai</span>
                            </div>
                        </div>
                        <div className="w-full bg-[var(--bg-surface)] rounded-2xl p-4 mt-2 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-[var(--border-surface)]">
                                <div>
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Terkumpul</p>
                                    <p className="font-bold text-lg text-cyan-400">{formatRupiah(zakatFitrah)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Target</p>
                                    <p className="font-bold text-lg text-purple-400">{formatRupiah(target)}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-[var(--bg-page)] p-3 rounded-xl border border-[var(--border-surface)]">
                                <div className="text-left">
                                    <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Zakat Fitrah / Jiwa</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="font-black text-2xl text-[var(--text-primary)]">{formatRupiah(data.settings?.nilaiZakatFitrah || 45000)}</p>
                                        <span className="text-xs font-medium text-[var(--text-muted)]">/ org</span>
                                    </div>
                                    <p className="text-[10px] font-semibold text-emerald-500 mt-1 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        Setara 2,8 Kg Beras
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-xl">🌾</div>
                            </div>
                        </div>
                    </div>

                    {/* Col 2: Komposisi */}
                    <div className="glass-card p-6 rounded-3xl text-left h-full flex flex-col">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 shrink-0">Komposisi Zakat</h3>
                        <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                            {compositionData.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-black/10 border border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-bold">{item.l}</span>
                                        <div className="flex items-center gap-2">
                                            {item.beras > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold">🌾 {item.beras} Kg</span>}
                                            <span className={`text-[10px] px-2 py-0.5 rounded ${item.t}`}>{item.v > 0 ? 'Cash' : 'Beras'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {item.v > 0 && <p className="text-lg font-black">{formatRupiah(item.v)}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Col 3: Aktivitas (Full Height Scrollable) */}
                    <div className="glass-card p-6 rounded-3xl text-left flex flex-col h-full">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 sticky top-0 bg-[var(--glass-bg)] backdrop-blur-sm p-1 z-10 w-fit rounded-lg shrink-0">Aktivitas Terbaru</h3>
                        <div className="space-y-4 overflow-y-auto flex-1 scrollbar-hide pr-2">
                            {(data.penerimaan || []).slice(0, 7).map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition group">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">👤</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate group-hover:text-emerald-300 transition-colors">{item.muzakki || 'Hamba Allah'}</p>
                                        <p className="text-[10px] text-gray-500">{item.jam || item.tanggal}</p>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-400">+{formatRupiah(getTotal(item))}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-white/5 mt-2 text-center shrink-0">
                            <p className="text-[10px] text-gray-500 italic">7 transaksi terakhir</p>
                        </div>
                    </div>
                </div>

                {/* Footer Section removed as it's integrated above now */}
            </div >

            {showPaymentModal && (
                <PublicPaymentModal
                    data={data}
                    settings={data.settings}
                    onClose={() => setShowPaymentModal(false)}
                    onRefresh={onRefresh}
                />
            )
            }
        </div >
    );
}

export default PublicDashboard;
