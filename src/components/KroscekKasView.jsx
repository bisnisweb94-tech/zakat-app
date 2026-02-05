import React, { useState, useEffect } from 'react';
import {
    CheckCircle, AlertTriangle, Coins, Check, X, Download
} from 'lucide-react';
import { formatRupiah, getTotal } from '../utils/format';
import gasClient from '../api/gasClient';

function KroscekKasView({ data, user, setData }) {
    const [activeTab, setActiveTab] = useState('input');
    const [pecahan, setPecahan] = useState(() => {
        const cash = data?.kroscekCash || {};
        return {
            100000: cash[100000] || 0,
            50000: cash[50000] || 0,
            20000: cash[20000] || 0,
            10000: cash[10000] || 0,
            5000: cash[5000] || 0,
            2000: cash[2000] || 0,
            1000: cash[1000] || 0,
            500: cash[500] || 0,
            200: cash[200] || 0,
            100: cash[100] || 0
        };
    });
    const [saldoBankManual, setSaldoBankManual] = useState(() => data?.kroscekBank || 0);
    const [localInvestigations, setLocalInvestigations] = useState(data?.kroscekInvestigations || []);
    const [saving, setSaving] = useState(false);
    const [, setResolving] = useState(false);

    const refreshInvestigations = async () => {
        try {
            const invs = await gasClient.request('getKroscekInvestigations');
            setLocalInvestigations(invs || []);
            setData(prev => ({ ...prev, kroscekInvestigations: invs }));
        } catch (err) {
            console.error("Failed to refresh investigations", err);
        }
    };

    useEffect(() => {
        refreshInvestigations();
    }, []);

    const totalFisikTunai = Object.entries(pecahan).reduce((sum, [val, count]) => sum + (parseInt(val) * count), 0);

    // Only count CASH transactions (metodePembayaran === 'Tunai')
    const totalMasuk = (data?.penerimaan || [])
        .filter(item => !item.metodePembayaran || item.metodePembayaran === 'Tunai')
        .reduce((sum, item) => sum + getTotal(item), 0);

    const totalKeluar = (data?.pengeluaran || [])
        .filter(item => !item.metodePembayaran || item.metodePembayaran === 'Tunai')
        .reduce((sum, item) => sum + (item.jumlah || 0), 0);

    const systemBalance = totalMasuk - totalKeluar;
    const totalAsetReal = totalFisikTunai + saldoBankManual;
    const selisih = totalAsetReal - systemBalance;

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        const timestamp = new Date().toISOString();
        const activeSessions = (data?.absensi || []).filter(l => l.status === 'In Progress');
        const session = activeSessions.find(l => l.officer === user.nama);
        const shiftName = session ? session.shift : 'Umum';

        // Collect all officers active in this shift (for CSV and investigation)
        const shiftOfficers = activeSessions
            .filter(s => s.shift === shiftName)
            .map(s => s.officer)
            .filter((v, i, a) => a.indexOf(v) === i); // Unique

        const combinedOfficers = shiftOfficers.length > 0 ? shiftOfficers.join(', ') : (user?.nama || 'System');

        // Use consistent key names (compatible with AppJS.html LaporanView)
        const kroscekData = {
            id: Date.now().toString(),
            pecahan,
            saldoBank: saldoBankManual,
            totalFisik: totalAsetReal,      // For AppJS.html compatibility
            totalSistem: systemBalance,      // For AppJS.html compatibility
            realBalance: totalAsetReal,      // For React app
            systemBalance: systemBalance,    // For React app
            selisih,
            timestamp,
            petugas: combinedOfficers,
            shift: shiftName
        };

        const newHistory = [kroscekData, ...(data.kroscekHistory || [])];

        try {
            await Promise.all([
                gasClient.updateData('masjid-kroscek-history', newHistory),
                gasClient.updateData('masjid-kroscek', kroscekData),
                gasClient.updateData('masjid-kroscek-cash', pecahan),
                gasClient.updateData('masjid-kroscek-bank', saldoBankManual)
            ]);

            // Update local state immediately
            setData(prev => ({
                ...prev,
                kroscekHistory: newHistory,
                kroscekCash: pecahan,
                kroscekBank: saldoBankManual
            }));

            if (selisih !== 0) {
                await gasClient.request('createKroscekInvestigation', { auditor: combinedOfficers, systemBalance, realBalance: totalAsetReal, discrepancy: selisih, shiftName });
                await refreshInvestigations();
            }
            alert(selisih !== 0 ? `🚨 SELISIH TERDETEKSI (${formatRupiah(selisih)}). Investigasi dimulai otomatis.` : '✅ Data kroscek berhasil disimpan!');
        } catch (err) {
            console.error('Save kroscek error:', err);
            alert('❌ Gagal menyimpan data kroscek!');
        } finally {
            setSaving(false);
        }
    };

    const resolveTask = async (taskId, notes) => {
        if (!confirm('Tandai investigasi ini sebagai selesai?')) return;
        setResolving(true);
        try {
            await gasClient.request('resolveKroscek', { taskId, resolvedBy: user.nama, notes });
            alert('✅ Investigasi diselesaikan.');
            await refreshInvestigations();
        } catch {
            alert('❌ Gagal menyelesaikan investigasi!');
        } finally {
            setResolving(false);
        }
    };

    const handleDownloadAuditCSV = () => {
        const history = data.kroscekHistory || [];
        if (history.length === 0) return alert('⚠️ Tidak ada data audit untuk di-download');

        const header = ["Tanggal", "Waktu", "Shift", "Petugas", "Saldo Tunai", "Saldo Bank", "Total Riil", "Saldo Sistem", "Selisih", "Status"];
        const rows = history.map(k => {
            const date = new Date(k.timestamp || k.tanggal);
            const totalFisik = k.realBalance ?? k.totalFisik ?? 0;
            const totalSistem = k.systemBalance ?? k.totalSistem ?? 0;
            const saldoBank = k.saldoBank ?? 0;
            const saldoTunai = totalFisik - saldoBank;

            return [
                date.toLocaleDateString('id-ID'),
                date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                k.shift || '-',
                `"${k.petugas || '-'}"`, // Wrap in quotes for names with comma
                saldoTunai,
                saldoBank,
                totalFisik,
                totalSistem,
                k.selisih || 0,
                k.selisih === 0 ? "BALANCE" : "SELISIH"
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + header.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Audit_History_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-10 px-1 sm:px-0 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex bg-[var(--bg-surface)] p-1 rounded-2xl border border-[var(--border-surface)] w-full sm:w-fit">
                    <button onClick={() => setActiveTab('input')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'input' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-500'}`}>Input Audit</button>
                    <button onClick={() => setActiveTab('tasks')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeTab === 'tasks' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-gray-500'}`}>
                        <span>Investigasi</span>
                        {Array.isArray(localInvestigations) && localInvestigations.filter(i => i.status === 'Open').length > 0 && <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{localInvestigations.filter(i => i.status === 'Open').length}</span>}
                    </button>
                </div>
                {activeTab === 'tasks' && (
                    <button
                        onClick={handleDownloadAuditCSV}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-bold text-xs hover:bg-blue-500/30 transition"
                    >
                        <Download size={14} /> Download Audit CSV
                    </button>
                )}
            </div>

            {activeTab === 'input' ? (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-surface)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><CheckCircle className="text-emerald-400" size={20} /></div>
                            <div><h2 className="text-xl font-black">Kroscek Kas</h2><p className="text-[9px] text-gray-500 uppercase font-black">Audit fisik sebelum shift berakhir</p></div>
                        </div>
                        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-sm disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan Data'}</button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 glass-card p-6 rounded-[2rem]">
                            <h3 className="font-bold mb-6 flex items-center gap-2 text-amber-400 uppercase text-sm"><Coins size={14} /> Kalkulator Pecahan</h3>
                            <div className="space-y-1">
                                {Object.keys(pecahan).sort((a, b) => b - a).map(val => (
                                    <div key={val} className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition">
                                        <div className="w-20"><div className="text-[10px] text-gray-500 uppercase font-black">Pecahan</div><div className="font-bold text-sm">{parseInt(val).toLocaleString()}</div></div>
                                        <div className="flex-1"><input type="number" value={pecahan[val] || ''} onChange={e => setPecahan({ ...pecahan, [val]: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full bg-black/20 border border-white/10 rounded-lg p-1.5 text-center font-bold" /></div>
                                        <div className="w-24 text-right"><div className="text-[10px] text-gray-500 uppercase font-black">Total</div><div className="font-bold text-sm">{formatRupiah(val * (pecahan[val] || 0)).replace('Rp', '')}</div></div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 text-left"><span className="text-xs font-bold text-gray-500 uppercase">Total Tunai</span><p className="text-2xl font-black text-amber-500">{formatRupiah(totalFisikTunai)}</p></div>
                                <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 text-left"><span className="text-xs font-bold text-gray-500 uppercase">Saldo Bank/QRIS</span><input type="number" value={saldoBankManual} onChange={e => setSaldoBankManual(parseInt(e.target.value) || 0)} className="w-full bg-transparent text-2xl font-black text-blue-500 focus:outline-none" /></div>
                            </div>
                        </div>
                        <div className="glass-card p-6 rounded-[2rem] text-left">
                            <h4 className="text-center text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-60">Status Rekonsiliasi</h4>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-500">SALDO SISTEM</span><span className="font-mono font-bold">{formatRupiah(systemBalance)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-500">TOTAL AUDIT</span><span className="font-mono font-black text-blue-400">{formatRupiah(totalAsetReal)}</span></div>
                            </div>
                            <div className={`text-center py-6 bg-black/20 rounded-2xl ${selisih === 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                <p className="text-[9px] font-black uppercase mb-1 opacity-50">Selisih</p>
                                <p className="text-3xl font-black">{formatRupiah(selisih)}</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    {(!Array.isArray(localInvestigations) || localInvestigations.length === 0) ? (
                        <div className="glass-card p-10 text-center rounded-[2rem] border border-dashed border-white/10">
                            <Check className="text-emerald-400 mx-auto mb-4" size={48} />
                            <h4 className="font-bold text-lg">Semua Clear!</h4>
                        </div>
                    ) : (
                        localInvestigations.map(inv => (
                            <div key={inv.id} className={`glass-card p-5 rounded-[2rem] border ${inv.status === 'Open' ? 'border-orange-500/30' : 'border-emerald-500/30'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${inv.status === 'Open' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{inv.status === 'Open' ? <AlertTriangle size={20} /> : <Check size={20} />}</div>
                                        <div>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded text-white ${inv.status === 'Open' ? 'bg-orange-500' : 'bg-emerald-500'}`}>{inv.status ? inv.status.toUpperCase() : 'UNKNOWN'}</span>
                                            <h4 className="font-bold mt-1">{inv.shift}</h4>
                                            {inv.timestamp && <p className="text-[10px] text-gray-500 mt-0.5">{new Date(inv.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</p>}
                                        </div>
                                    </div>
                                    <div className="text-right"><p className="text-[10px] font-bold text-gray-500">SELISIH</p><p className={`text-lg font-black ${inv.discrepancy < 0 ? 'text-rose-500' : 'text-amber-500'}`}>{formatRupiah(inv.discrepancy)}</p></div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    <div className="bg-black/20 p-3 rounded-xl text-left">
                                        <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Saldo Sistem</p>
                                        <p className="font-mono font-bold text-sm text-blue-400">{formatRupiah(inv.systemBalance || 0)}</p>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-xl text-left">
                                        <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Saldo Riil</p>
                                        <p className="font-mono font-bold text-sm text-emerald-400">{formatRupiah(inv.realBalance || 0)}</p>
                                    </div>
                                </div>

                                {inv.auditor && (
                                    <div className="mb-3 text-left">
                                        <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Auditor</p>
                                        <p className="text-xs font-medium text-[var(--text-secondary)]">{inv.auditor}</p>
                                    </div>
                                )}

                                {inv.status === 'Resolved' && inv.resolvedBy && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl mb-3 text-left">
                                        <p className="text-[9px] font-bold text-emerald-400 uppercase mb-1">Diselesaikan oleh</p>
                                        <p className="text-xs font-bold text-emerald-300">{inv.resolvedBy}</p>
                                        {inv.resolvedAt && <p className="text-[10px] text-gray-500 mt-1">{new Date(inv.resolvedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</p>}
                                        {inv.resolvedNotes && <p className="text-xs text-gray-400 mt-2 italic">"{inv.resolvedNotes}"</p>}
                                    </div>
                                )}

                                {inv.status === 'Open' && (
                                    <button onClick={() => {
                                        const notes = prompt('Catatan penyelesaian:');
                                        if (notes) resolveTask(inv.id, notes);
                                    }} className="w-full py-3 bg-black/20 border border-orange-500/30 text-orange-400 rounded-xl font-black text-xs">Selesaikan Investigasi</button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default KroscekKasView;
