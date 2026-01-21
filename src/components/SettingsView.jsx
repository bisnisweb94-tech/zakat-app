import React, { useState, useEffect } from 'react';
import {
    Settings, Plus, Trash2, ChevronDown, Store, Coins,
    Calendar, Clock, Layout, RefreshCw, Save
} from 'lucide-react';
import gasClient from '../api/gasClient';

const SettingsGroup = ({ title, icon: Icon, isOpen, onToggle, children, color = "emerald" }) => {
    // Tailwind dynamic classes can be tricky if not whitelisted, but we'll use conditional styles
    const colors = {
        emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/10', iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-400' },
        cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/10', iconBg: 'bg-cyan-500/10', iconText: 'text-cyan-400' },
        purple: { bg: 'bg-purple-500/5', border: 'border-purple-500/10', iconBg: 'bg-purple-500/10', iconText: 'text-purple-400' }
    };

    const theme = colors[color] || colors.emerald;

    return (
        <div className={`rounded-2xl transition-all duration-300 border ${isOpen ? `${theme.bg} ${theme.border}` : 'bg-[var(--bg-surface)] border-[var(--border-surface)] hover:border-[var(--border-surface)]'}`}>
            <button onClick={onToggle} className="w-full flex items-center justify-between p-4 sm:p-5">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOpen ? theme.iconBg + ' ' + theme.iconText : 'bg-[var(--bg-page)] text-[var(--text-muted)]'}`}>
                        <Icon size={18} />
                    </div>
                    <span className={`font-bold text-sm uppercase tracking-widest ${isOpen ? theme.iconText : 'text-[var(--text-secondary)]'}`}>{title}</span>
                </div>
                <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 sm:p-6 pt-0 border-t border-dashed border-[var(--border-surface)] mt-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

function SettingsView({ data, setData, save }) {
    const [newCluster, setNewCluster] = useState({ nama: '', buka: false, tanggal: '', jamBuka: '', jamTutup: '' });
    const [showAddCluster, setShowAddCluster] = useState(false);
    const [saveStatus, setSaveStatus] = useState('saved');
    const [activeGroup, setActiveGroup] = useState('profil');

    const statusKonter = data.settings.statusKonter || { masjid: { buka: false, tanggal: '', jamBuka: '', jamTutup: '' }, cluster: [] };

    useEffect(() => {
        setSaveStatus('saving');
        const timer = setTimeout(() => {
            save('settings', data.settings).then(() => setSaveStatus('saved'));
        }, 1500);
        return () => clearTimeout(timer);
    }, [data.settings]);

    const handleUpdateCluster = (index, field, value) => {
        const updatedCluster = [...statusKonter.cluster];
        updatedCluster[index] = { ...updatedCluster[index], [field]: value };
        setData({
            ...data,
            settings: {
                ...data.settings,
                statusKonter: { ...statusKonter, cluster: updatedCluster }
            }
        });
    };

    const handleAddCluster = () => {
        if (newCluster.nama.trim()) {
            const updatedCluster = [...statusKonter.cluster, { ...newCluster }];
            setData({ ...data, settings: { ...data.settings, statusKonter: { ...statusKonter, cluster: updatedCluster } } });
            setNewCluster({ nama: '', buka: false, tanggal: '', jamBuka: '', jamTutup: '' });
            setShowAddCluster(false);
        }
    };

    const handleRemoveCluster = (index) => {
        const updatedCluster = statusKonter.cluster.filter((_, i) => i !== index);
        setData({ ...data, settings: { ...data.settings, statusKonter: { ...statusKonter, cluster: updatedCluster } } });
    };

    return (
        <div className="glass-card p-4 sm:p-6 rounded-3xl space-y-6 max-w-2xl mx-auto mb-32 relative">
            <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-2xl flex items-center gap-3">
                    <Settings className="text-emerald-400" size={24} />
                    Pengaturan
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={async () => {
                            if (confirm('Reload data dari server?')) {
                                try {
                                    const newData = await gasClient.loadAllData();
                                    setData(prev => ({ ...prev, ...newData }));
                                    alert(`✅ Data Reloaded!`);
                                } catch (e) {
                                    alert('❌ Gagal reload data');
                                }
                            }
                        }}
                        className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/30 transition flex items-center gap-1"
                    >
                        <RefreshCw size={14} /> Refresh Data
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {saveStatus === 'saving' && <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>}
                    <span className={`text-xs font-medium transition-colors ${saveStatus === 'saving' ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                        {saveStatus === 'saving' ? 'Menyimpan...' : 'Tersimpan otomatis'}
                    </span>
                </div>
            </div>

            <SettingsGroup
                title="Profil & Operasional"
                icon={Store}
                isOpen={activeGroup === 'profil'}
                onToggle={() => setActiveGroup(activeGroup === 'profil' ? null : 'profil')}
                color="cyan"
            >
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h5 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-surface)] pb-2 mb-3">Informasi Dasar</h5>
                        <div>
                            <label className="text-xs text-[var(--text-secondary)] block mb-1">Nama Masjid / Musholla</label>
                            <input
                                type="text"
                                className="glass-input w-full p-3 rounded-xl text-sm font-bold tracking-wide"
                                value={data.settings.namaMasjid || ''}
                                placeholder="Nama Masjid"
                                onChange={e => setData({ ...data, settings: { ...data.settings, namaMasjid: e.target.value } })}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-[var(--text-secondary)] block mb-1">Nomor Konsultasi / WA Official</label>
                            <input
                                type="text"
                                className="glass-input w-full p-3 rounded-xl text-sm font-mono tracking-wider"
                                value={data.settings.nomorKonsultasi || ''}
                                placeholder="628..."
                                onChange={e => setData({ ...data, settings: { ...data.settings, nomorKonsultasi: e.target.value } })}
                            />
                        </div>

                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-3">
                                <label className="text-xs text-[var(--text-secondary)] block mb-1">Bank</label>
                                <input
                                    type="text"
                                    className="glass-input w-full p-2.5 rounded-xl text-sm text-center uppercase font-bold"
                                    value={data.settings.rekening?.bank || ''}
                                    placeholder="BCA"
                                    onChange={e => setData({ ...data, settings: { ...data.settings, rekening: { ...data.settings.rekening, bank: e.target.value } } })}
                                />
                            </div>
                            <div className="col-span-5">
                                <label className="text-xs text-[var(--text-secondary)] block mb-1">Nomor Rekening</label>
                                <input
                                    type="text"
                                    className="glass-input w-full p-2.5 rounded-xl text-sm font-mono font-bold tracking-wider"
                                    value={data.settings.rekening?.norek || ''}
                                    placeholder="1234567890"
                                    onChange={e => setData({ ...data, settings: { ...data.settings, rekening: { ...data.settings.rekening, norek: e.target.value } } })}
                                />
                            </div>
                            <div className="col-span-4">
                                <label className="text-xs text-[var(--text-secondary)] block mb-1">Atas Nama</label>
                                <input
                                    type="text"
                                    className="glass-input w-full p-2.5 rounded-xl text-sm truncate"
                                    value={data.settings.rekening?.atasNama || ''}
                                    placeholder="DKM..."
                                    onChange={e => setData({ ...data, settings: { ...data.settings, rekening: { ...data.settings.rekening, atasNama: e.target.value } } })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[var(--border-surface)] pb-2 mb-3">
                            <h5 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Jadwal Operasional</h5>
                            <button
                                onClick={() => setData({
                                    ...data,
                                    settings: {
                                        ...data.settings,
                                        statusKonter: { ...statusKonter, masjid: { ...statusKonter.masjid, buka: !statusKonter.masjid.buka } }
                                    }
                                })}
                                className={`w-9 h-5 rounded-full transition-colors relative ${statusKonter.masjid.buka ? 'bg-emerald-500' : 'bg-[var(--bg-surface)] border border-[var(--border-surface)]'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${statusKonter.masjid.buka ? 'translate-x-4' : ''}`}></div>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="col-span-1">
                                <label className="text-[10px] text-[var(--text-muted)] block mb-1">TANGGAL MULAI</label>
                                <input
                                    type="date"
                                    className="glass-input w-full p-2.5 rounded-xl text-sm"
                                    value={statusKonter.masjid.tanggal || ''}
                                    onChange={e => setData({ ...data, settings: { ...data.settings, statusKonter: { ...statusKonter, masjid: { ...statusKonter.masjid, tanggal: e.target.value } } } })}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] text-[var(--text-muted)] block mb-1">TANGGAL SELESAI</label>
                                <input
                                    type="date"
                                    className="glass-input w-full p-2.5 rounded-xl text-sm"
                                    value={statusKonter.masjid.tanggalSelesai || ''}
                                    onChange={e => setData({ ...data, settings: { ...data.settings, statusKonter: { ...statusKonter, masjid: { ...statusKonter.masjid, tanggalSelesai: e.target.value } } } })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-[var(--text-muted)] block mb-1">JAM BUKA</label>
                                <input type="time" className="glass-input w-full p-2.5 rounded-xl text-xs"
                                    value={statusKonter.masjid.jamBuka || ''}
                                    onChange={e => setData({ ...data, settings: { ...data.settings, statusKonter: { ...statusKonter, masjid: { ...statusKonter.masjid, jamBuka: e.target.value } } } })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-[var(--text-muted)] block mb-1">JAM TUTUP</label>
                                <input type="time" className="glass-input w-full p-2.5 rounded-xl text-xs"
                                    value={statusKonter.masjid.jamTutup || ''}
                                    onChange={e => setData({ ...data, settings: { ...data.settings, statusKonter: { ...statusKonter, masjid: { ...statusKonter.masjid, jamTutup: e.target.value } } } })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-[var(--border-surface)] pb-2 mb-3">
                            <h5 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Jadwal Cluster / Lokasi</h5>
                            <button
                                onClick={() => setShowAddCluster(!showAddCluster)}
                                className="px-3 py-1.5 bg-purple-600/50 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                                <Plus size={14} /> Tambah
                            </button>
                        </div>

                        {showAddCluster && (
                            <div className="mb-4 p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-surface)] animate-fade-in text-left">
                                <label className="text-xs text-[var(--text-muted)] mb-1 block">NAMA CLUSTER / LOKASI BARU</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCluster.nama}
                                        onChange={(e) => setNewCluster({ ...newCluster, nama: e.target.value })}
                                        className="flex-1 glass-input p-2.5 rounded-lg text-sm"
                                        placeholder="Nama cluster (contoh: Cluster Sanur)"
                                    />
                                    <button
                                        onClick={handleAddCluster}
                                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {statusKonter.cluster && statusKonter.cluster.length > 0 ? (
                                statusKonter.cluster.map((cluster, idx) => (
                                    <div key={idx} className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-surface)] hover:border-[var(--border-surface)] transition text-left">
                                        <div className="flex items-center justify-between mb-3 border-b border-[var(--border-surface)] pb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm w-5">{idx + 1}.</span>
                                                <span className="font-bold text-sm">{cluster.nama}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleUpdateCluster(idx, 'buka', !cluster.buka)}
                                                    className={`w-9 h-5 rounded-full transition-all relative flex items-center shadow-inner ${cluster.buka ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-[var(--bg-page)] border border-[var(--border-surface)] shadow-none'}`}
                                                >
                                                    <div className={`absolute w-4 h-4 bg-white rounded-full transition-all shadow-md duration-300 ${cluster.buka ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                                                </button>
                                                <button onClick={() => handleRemoveCluster(idx)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[9px] text-[var(--text-muted)] block mb-1 font-bold">MULAI</label>
                                                    <input type="date" className="glass-input w-full p-2.5 rounded-xl text-xs"
                                                        value={cluster.tanggal || ''}
                                                        onChange={e => handleUpdateCluster(idx, 'tanggal', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-[var(--text-muted)] block mb-1 font-bold">SELESAI</label>
                                                    <input type="date" className="glass-input w-full p-2.5 rounded-xl text-xs"
                                                        value={cluster.tanggalSelesai || ''}
                                                        onChange={e => handleUpdateCluster(idx, 'tanggalSelesai', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[9px] text-[var(--text-muted)] block mb-0.5">BUKA</label>
                                                    <input type="time" className="glass-input w-full p-1.5 rounded text-xs"
                                                        value={cluster.jamBuka || ''}
                                                        onChange={e => handleUpdateCluster(idx, 'jamBuka', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-[var(--text-muted)] block mb-0.5">TUTUP</label>
                                                    <input type="time" className="glass-input w-full p-1.5 rounded text-xs"
                                                        value={cluster.jamTutup || ''}
                                                        onChange={e => handleUpdateCluster(idx, 'jamTutup', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[var(--text-muted)] text-xs text-center py-4">Belum ada lokasi cluster</p>
                            )}
                        </div>
                    </div>
                </div>
            </SettingsGroup>

            <SettingsGroup
                title="Keuangan & Zakat"
                icon={Coins}
                isOpen={activeGroup === 'keuangan'}
                onToggle={() => setActiveGroup(activeGroup === 'keuangan' ? null : 'keuangan')}
                color="emerald"
            >
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h5 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-surface)] pb-2 mb-3 text-left">Parameter Zakat Fitrah</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="text-left">
                                <label className="text-xs text-[var(--text-secondary)] block mb-1 uppercase tracking-wider">Target Zakat (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">Rp</span>
                                    <input
                                        type="text"
                                        className="glass-input w-full pl-12 p-4 rounded-xl text-2xl font-mono text-[var(--text-primary)] font-bold"
                                        value={new Intl.NumberFormat('id-ID').format(data.settings.targetZakatFitrah)}
                                        onChange={e => {
                                            const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                            setData({ ...data, settings: { ...data.settings, targetZakatFitrah: val } });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="text-left">
                                <label className="text-xs text-[var(--text-secondary)] block mb-1 uppercase tracking-wider">Nilai Zakat / Jiwa (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 font-bold">Rp</span>
                                    <input
                                        type="text"
                                        className="glass-input w-full pl-12 p-4 rounded-xl text-2xl font-mono text-[var(--text-primary)] font-bold"
                                        value={new Intl.NumberFormat('id-ID').format(data.settings.nilaiZakatFitrah)}
                                        onChange={e => {
                                            const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                            setData({ ...data, settings: { ...data.settings, nilaiZakatFitrah: val } });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsGroup>
        </div>
    );
}

export default SettingsView;
