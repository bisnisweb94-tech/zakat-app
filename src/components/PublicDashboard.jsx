import React from 'react';
import { LogIn, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { formatRupiah, getTotal, getTotalBeras } from '../utils/format';
import ThemeToggle from './ThemeToggle';
import ZakatChart from './ZakatChart';

function PublicDashboard({ data, onGoToLogin, toggleTheme, theme }) {
    const totalMasuk = (data.penerimaan || []).reduce((s, i) => s + getTotal(i), 0);
    const totalKeluar = (data.pengeluaran || []).reduce((s, i) => s + (parseFloat(i.jumlah) || 0), 0);
    const target = data.settings?.targetZakatFitrah || 1;

    const compositionMap = {};
    const berasMap = {};
    (data.penerimaan || []).forEach(item => {
        const types = Array.isArray(item.jenis) ? item.jenis : [item.jenis];
        types.forEach(j => {
            if (item.jumlah?.[j]) compositionMap[j] = (compositionMap[j] || 0) + (parseFloat(item.jumlah[j]) || 0);
            else if (typeof item.jumlah === 'number') compositionMap[j] = (compositionMap[j] || 0) + item.jumlah;

            if (item.beratBeras?.[j]) berasMap[j] = (berasMap[j] || 0) + (parseFloat(item.beratBeras[j]) || 0);
        });
    });

    const colors = [
        { c: 'bg-emerald-500', t: 'bg-emerald-500/20 text-emerald-400' },
        { c: 'bg-cyan-500', t: 'bg-cyan-500/20 text-cyan-400' },
        { c: 'bg-violet-500', t: 'bg-violet-500/20 text-violet-400' },
        { c: 'bg-amber-500', t: 'bg-amber-500/20 text-amber-400' }
    ];

    const compositionData = Object.entries(compositionMap)
        .map(([label, value], idx) => ({
            l: label, v: value, beras: berasMap[label] || 0,
            c: colors[idx % colors.length].c, t: colors[idx % colors.length].t
        }))
        .sort((a, b) => b.v - a.v);

    const zakatFitrah = compositionMap['Zakat Fitrah'] || 0;
    const percentage = target > 0 ? Math.min((zakatFitrah / target) * 100, 100) : 0;
    const statusKonter = data.settings?.statusKonter || { masjid: { buka: false }, cluster: [] };

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

    return (
        <div className="min-h-screen pb-10">
            <div className="sticky top-0 z-50 bg-[var(--bg-page)]/80 backdrop-blur-md border-b border-[var(--glass-border)] px-4 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20"><span className="font-black text-xl text-white">Z</span></div>
                        <div className="text-left">
                            <h1 className="font-bold text-base leading-tight">{data.settings?.namaMasjid || 'Zakat OS'}</h1>
                            <p className="text-[10px] text-cyan-400 uppercase tracking-widest">Realtime Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                        <button onClick={onGoToLogin} className="px-4 py-2.5 rounded-xl glass-card border border-white/10 text-sm font-bold flex items-center gap-2 transition hover:scale-105">
                            <LogIn size={16} /> <span>Login</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-2 glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[180px] bg-gradient-to-br from-gray-900 to-black text-left">
                        <div className="relative z-10">
                            <p className="text-gray-400 text-sm mb-1 uppercase tracking-widest font-bold">Total Pemasukan</p>
                            <h2 className="text-4xl sm:text-5xl font-black text-white">{formatRupiah(totalMasuk)}</h2>
                        </div>
                        <div className="flex gap-4 relative z-10 mt-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-bold">
                                <TrendingUp size={14} /> Kas: {formatRupiah(totalMasuk - totalKeluar)}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-bold">
                                <TrendingDown size={14} /> Keluar: {formatRupiah(totalKeluar)}
                            </div>
                        </div>
                    </div>
                    <StatusCard title="Counter Masjid" active={statusKonter.masjid.buka} {...statusKonter.masjid} icon="🕌" />
                    <StatusCard title={statusKonter.cluster[0]?.nama || "Counter Cluster"} active={statusKonter.cluster[0]?.buka} {...statusKonter.cluster[0]} icon="🏘️" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="glass-card p-6 rounded-3xl text-center">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 text-left">Zakat Fitrah Progress</h3>
                        <div className="w-52 h-52 mx-auto relative mb-6">
                            <ZakatChart current={zakatFitrah} target={target} theme={theme} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black">{percentage.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="bg-black/20 p-4 rounded-2xl flex justify-between items-center text-left">
                            <div><p className="text-[10px] text-gray-400">Terkumpul</p><p className="font-bold text-cyan-400">{formatRupiah(zakatFitrah)}</p></div>
                            <div className="text-right"><p className="text-[10px] text-gray-400">Target</p><p className="font-bold text-purple-400">{formatRupiah(target)}</p></div>
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
                                    <p className="text-lg font-black">{item.v > 0 ? formatRupiah(item.v) : `${item.beras} Kg`}</p>
                                </div>
                            ))}
                            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                                <p className="text-[10px] font-bold text-orange-400 uppercase">Total Beras</p>
                                <p className="text-2xl font-black text-orange-400">{(data.penerimaan || []).reduce((s, i) => s + getTotalBeras(i), 0)} <span className="text-sm">Kg</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl text-left">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Aktivitas Terbaru</h3>
                        <div className="space-y-4">
                            {(data.penerimaan || []).slice(0, 6).map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">👤</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{item.muzakki || 'Hamba Allah'}</p>
                                        <p className="text-[10px] text-gray-500">{item.jam || item.tanggal}</p>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-400">+{formatRupiah(getTotal(item))}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

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
            </div>
        </div>
    );
}

export default PublicDashboard;
