import React from 'react';
import { Award } from 'lucide-react';
import { formatRupiah, getTotal } from '../utils/format';
import { getLevel } from '../utils/gamification';
import AvatarFrame from './AvatarFrame';

function PerformanceView({ data }) {
    const leaderboard = data.leaderboard || [];

    const moneyStats = {};
    (data.penerimaan || []).forEach(item => {
        const p = item.petugas || 'System';
        moneyStats[p] = (moneyStats[p] || 0) + getTotal(item);
    });


    const report = leaderboard.map(user => ({
        name: user.name,
        userRaw: user,
        xp: user.xp,
        tx: user.txCount || 0,
        txXP: user.txXP || 0,
        attXP: user.attXP || 0,
        kroscekXP: user.kroscekXP || 0,
        durationDisplay: user.durationDisplay || '0j 0m',
        absen: user.attCount || 0,
        money: moneyStats[user.name] || 0,
        level: getLevel(user.xp)
    })).sort((a, b) => b.xp - a.xp);

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            <div className="glass-card p-6 rounded-3xl border border-[var(--border-surface)]">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Award className="text-yellow-400" /> Laporan Kinerja Petugas
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--bg-surface)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 text-left">Rank</th>
                                <th className="p-4 text-left">Petugas</th>
                                <th className="p-4 text-center">Level</th>
                                <th className="p-4 text-center">Transaksi</th>
                                <th className="p-4 text-right">Uang Dihimpun</th>
                                <th className="p-4 text-center">Absensi</th>
                                <th className="p-4 text-center">Total XP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {report.map((item, idx) => (
                                <tr key={idx} className="hover:bg-[var(--bg-surface)] transition text-left">
                                    <td className="p-4 font-bold text-[var(--text-muted)] text-center">#{idx + 1}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <AvatarFrame user={{ ...item.userRaw, xp: item.xp }} size="sm" />
                                            <span className="font-bold text-base">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`text-xs px-2 py-1 rounded-lg border ${item.level.bg} ${item.level.color} whitespace-nowrap inline-flex items-center gap-1`}>
                                            {item.level.icon} {item.level.title}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-mono">{item.tx}</td>
                                    <td className="p-4 text-right font-mono font-bold text-emerald-400">{formatRupiah(item.money)}</td>
                                    <td className="p-4 text-center font-mono">{item.absen}</td>
                                    <td className="p-4 text-center font-bold text-purple-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <span>{item.xp} XP</span>
                                            <button
                                                onClick={() => alert(`📊 RINCIAN XP - ${item.name}\n\n💰 Transaksi: ${item.tx} input (${item.txXP} XP)\n⏰ Absensi: ${item.absen} shift (${item.attXP} XP)\n⏱️ Durasi Total: ${item.durationDisplay}\n✅ Kroscek: ${item.kroscekXP} XP\n\n📌 TOTAL: ${item.xp} XP`)}
                                                className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] hover:bg-purple-500/40 transition"
                                                title="Lihat rincian XP"
                                            >
                                                ?
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {report.length === 0 && (
                                <tr><td colSpan="7" className="p-8 text-center text-[var(--text-muted)]">Belum ada data kinerja</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default PerformanceView;
