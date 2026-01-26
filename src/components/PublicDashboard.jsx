import React, { useState } from 'react';
import { LogIn, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
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
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>{icon}</div>
                <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${active ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>{active ? 'OPEN' : 'CLOSED'}</div>
            </div>
            <h4 className="font-bold text-lg">{title}</h4>
            {active ? <div className="mt-1"><p className="text-xs text-emerald-400">{dateDisplay}</p>{jamBuka && <p className="text-[10px] text-gray-500">{jamBuka} - {jamTutup}</p>}</div> : <p className="text-xs text-gray-500 mt-1">Layanan Tutup</p>}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-2 glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[180px] bg-gradient-to-br from-gray-900 to-black text-left">
                        <div className="relative z-10">
                            <p className="text-gray-400 text-sm mb-1 uppercase tracking-widest font-bold">Total Kas</p>
                            <h2 className="text-4xl sm:text-5xl font-black text-white">{formatRupiah(totalMasuk - totalKeluar)}</h2>
                        </div>
                        <div className="flex flex-wrap gap-4 relative z-10 mt-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-bold">
                                <TrendingUp size={14} /> Pemasukan: {formatRupiah(totalMasuk)}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-bold">
                                <TrendingDown size={14} /> Keluar: {formatRupiah(totalKeluar)}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-xs font-bold">
                                🌾 Beras: {totalBeras} Kg
                            </div>
                        </div>
                    </div>

                    {/* iPhone-style Vertical Status Widget */}
                    <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden border border-[var(--glass-border)] flex flex-col bg-black/20">
                        <div className="px-5 py-3 border-b border-white/5 bg-white/5 flex justify-between items-center shrink-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status Konter</span>
                            <span className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/30"></span>
                            </span>
                        </div>
                        <div className="overflow-y-auto h-[140px] snap-y snap-mandatory scrollbar-hide">
                            {[
                                { title: "Counter Masjid", icon: "🕌", ...statusKonter.masjid },
                                ...(statusKonter.cluster || [])
                            ].map((status, idx) => (
                                <div key={idx} className="p-4 flex items-center justify-between border-b border-white/5 last:border-0 snap-start bg-gradient-to-r from-transparent to-white/[0.02]">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${status.buka ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                            {status.icon || "🏘️"}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-[var(--text-primary)]">{status.title || status.nama}</h4>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">
                                                {status.buka ? `${status.jamBuka || '-'} • ${status.jamTutup || '-'}` : 'Layanan Tutup'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black ${status.buka ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                        {status.buka ? 'OPEN' : 'CLOSED'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-white/5 bg-white/5 flex justify-center shrink-0">
                            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Scroll untuk Cluster lain ↓</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass-card p-6 rounded-3xl text-center relative overflow-hidden flex flex-col items-center">
                        <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-6 absolute top-6 left-6">Zakat Fitrah Progress</h3>
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
                                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-xl">
                                    🌾
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl text-left">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Komposisi Zakat</h3>
                        <div className="space-y-3">
                            {compositionData.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-black/10 border border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-bold">{item.l}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded ${item.t}`}>{item.v > 0 ? 'Cash' : 'Beras'}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {item.v > 0 && <p className="text-lg font-black">{formatRupiah(item.v)}</p>}
                                        {item.beras > 0 && <p className="text-sm font-bold text-orange-400">🌾 {item.beras} Kg</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Scrollable Activity */}
                        <div className="glass-card p-6 rounded-3xl text-left flex-1 min-h-0 flex flex-col">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 sticky top-0 bg-[var(--glass-bg)] backdrop-blur-sm p-1 z-10 w-fit rounded-lg">Aktivitas Terbaru</h3>
                            <div className="space-y-4 overflow-y-auto max-h-[300px] scrollbar-hide pr-2">
                                {(data.penerimaan || []).slice(0, 20).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0">👤</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{item.muzakki || 'Hamba Allah'}</p>
                                            <p className="text-[10px] text-gray-500">{item.jam || item.tanggal}</p>
                                        </div>
                                        <span className="text-sm font-bold text-emerald-400">+{formatRupiah(getTotal(item))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment CTA */}
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full glass-card p-4 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:scale-[1.02] active:scale-95 transition-all text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
                        >
                            <CreditCard size={20} />
                            Bayar Zakat Sekarang
                        </button>
                    </div>
                </div>

                {/* Footer Section: Rekening & Konsultasi side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.settings?.rekening?.norek && (
                        <div className="glass-card p-6 rounded-3xl bg-emerald-900/10 border border-emerald-500/20 flex items-center gap-4 text-left">
                            <CreditCard size={32} className="text-emerald-400" />
                            <div>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase">Rekening Zakat</p>
                                <p className="text-lg font-black">{data.settings.rekening.bank} {data.settings.rekening.norek}</p>
                                <p className="text-xs text-gray-500">{data.settings.rekening.atasNama}</p>
                            </div>
                        </div>
                    )}

                    {data.settings?.nomorKonsultasi && (
                        <a
                            href={`https://wa.me/${data.settings.nomorKonsultasi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-card p-6 rounded-3xl bg-green-900/10 border border-green-500/20 flex items-center gap-4 text-left cursor-pointer hover:bg-green-900/20 transition"
                        >
                            <div className="text-green-400">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-green-400 uppercase">Layanan Konsultasi</p>
                                <p className="text-lg font-black text-green-400">WhatsApp Admin</p>
                                <p className="text-xs text-gray-500">Klik untuk chat</p>
                            </div>
                        </a>
                    )}
                </div>
            </div>

            {showPaymentModal && (
                <PublicPaymentModal
                    data={data}
                    settings={data.settings}
                    onClose={() => setShowPaymentModal(false)}
                    onRefresh={onRefresh}
                />
            )}
        </div>
    );
}

export default PublicDashboard;
