import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Users, Package } from 'lucide-react';
import { formatRupiah, getTotal, getTotalBeras } from '../utils/format';

function AdminDashboardHome({ data, setModal }) {
    const totalMasuk = (data.penerimaan || []).reduce((s, i) => s + getTotal(i), 0);
    const totalKeluar = (data.pengeluaran || []).reduce((s, i) => s + (parseFloat(i.jumlah) || 0), 0);
    const saldo = totalMasuk - totalKeluar;
    const today = new Date().toISOString().split('T')[0];
    const txToday = (data.penerimaan || []).filter(i => (i.tanggal || '').startsWith(today)).length;
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
        { c: 'bg-emerald-500', color: 'text-emerald-400' },
        { c: 'bg-blue-500', color: 'text-blue-400' },
        { c: 'bg-amber-500', color: 'text-amber-400' },
        { c: 'bg-purple-500', color: 'text-purple-400' },
        { c: 'bg-pink-500', color: 'text-pink-400' },
        { c: 'bg-cyan-500', color: 'text-cyan-400' },
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

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition"></div>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Total Saldo Kas</p>
                    <h2 className="text-3xl font-black text-emerald-400">{formatRupiah(saldo)}</h2>
                    <div className="mt-4 flex items-center gap-2">
                        <TrendingUp size={14} className="text-emerald-400" />
                        <span className="text-[10px] text-emerald-400/80 font-bold uppercase">Safe Balance</span>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition"></div>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Penerimaan Hari Ini</p>
                    <h2 className="text-3xl font-black text-blue-400">{txToday} <span className="text-sm font-medium opacity-60">TX</span></h2>
                    <div className="mt-4 flex items-center gap-2">
                        <Wallet size={14} className="text-blue-400" />
                        <span className="text-[10px] text-blue-400/80 font-bold uppercase">Realtime Activity</span>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition"></div>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Logistik Beras</p>
                    <h2 className="text-3xl font-black text-amber-400">{totalBeras} <span className="text-sm font-medium opacity-60">KG</span></h2>
                    <div className="mt-4 flex items-center gap-2">
                        <Package size={14} className="text-amber-400" />
                        <span className="text-[10px] text-amber-400/80 font-bold uppercase">Stock on Hand</span>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition"></div>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Total Muzakki</p>
                    <h2 className="text-3xl font-black text-purple-400">{(data.penerimaan || []).length}</h2>
                    <div className="mt-4 flex items-center gap-2">
                        <Users size={14} className="text-purple-400" />
                        <span className="text-[10px] text-purple-400/80 font-bold uppercase">Database Members</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-[2rem]">
                    <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Komposisi Dana</h3>
                    <div className="space-y-4">
                        {composition.length === 0 ? (
                            <p className="text-[var(--text-muted)] text-sm py-4">Belum ada data masuk</p>
                        ) : composition.map((item, idx) => (
                            <div key={idx} className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-surface)] flex justify-between items-center group hover:bg-white/[0.08] transition">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1 h-8 rounded-full ${item.c}`}></div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] font-medium mb-1">{item.l}</p>
                                        <p className="text-lg font-bold">{formatRupiah(item.v)}</p>
                                    </div>
                                </div>
                                {item.beras > 0 && (
                                    <div className="text-right">
                                        <p className="text-[10px] text-amber-400 font-bold uppercase">Beras</p>
                                        <p className="text-sm font-bold text-amber-500">{item.beras} Kg</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem]">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">Transaksi Terbaru</h3>
                        <button onClick={() => setModal({ type: 'penerimaan' })} className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/30 transition"> + TAMBAH</button>
                    </div>
                    <div className="space-y-3">
                        {(data.penerimaan || []).slice(0, 5).map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--bg-surface)] hover:bg-white/[0.08] transition text-sm">
                                <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-white/10 flex items-center justify-center text-lg">👤</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate">{item.muzakki || item.nama}</p>
                                    <p className="text-[10px] text-[var(--text-muted)]">{Array.isArray(item.jenis) ? item.jenis.join(', ') : item.jenis}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-emerald-400">+{formatRupiah(getTotal(item))}</p>
                                    <p className="text-[9px] text-[var(--text-muted)] uppercase">{item.jam || item.tanggal}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboardHome;
