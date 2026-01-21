import React, { useState, useEffect } from 'react';
import {
    Settings, Plus, Trash2, ChevronDown, Store, Coins,
    Calendar, Clock, Layout, RefreshCw, Save, MapPin, Navigation, X, Trophy
} from 'lucide-react';
import gasClient from '../api/gasClient';

const SettingsGroup = ({ title, icon: Icon, isOpen, onToggle, children, color = "emerald" }) => {
    const colors = {
        emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/10', iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-400' },
        cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/10', iconBg: 'bg-cyan-500/10', iconText: 'text-cyan-400' },
        purple: { bg: 'bg-purple-500/5', border: 'border-purple-500/10', iconBg: 'bg-purple-500/10', iconText: 'text-purple-400' },
        yellow: { bg: 'bg-yellow-500/5', border: 'border-yellow-500/10', iconBg: 'bg-yellow-500/10', iconText: 'text-yellow-400' }
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
                                <p className="text-[10px] text-[var(--text-muted)] mt-2 text-right italic border-t border-[var(--border-surface)] pt-1">
                                    *Nominal ini akan muncul di dashboard sebagai acuan petugas (Setara ~2,8 Kg Beras)
                                </p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="text-xs text-[var(--text-secondary)] block mb-1 text-left">Tanggal Pembagian Zakat</label>
                            <input
                                type="date"
                                className="glass-input w-full p-3 rounded-xl text-sm bg-[var(--bg-surface)]"
                                value={data.settings.tanggalDistribusi || ''}
                                onChange={e => setData({ ...data, settings: { ...data.settings, tanggalDistribusi: e.target.value } })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-[var(--border-surface)]">
                        <h5 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 text-left">Kategori Penerimaan (Zakat/Infaq)</h5>
                        <div className="flex flex-wrap gap-2">
                            {(data.settings.jenisPenerimaan || ['Zakat Fitrah', 'Zakat Mal', 'Fidyah', 'Infaq', 'Sedekah']).map((item, idx) => (
                                <div key={idx} className="bg-blue-500/10 text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-blue-500/20">
                                    {item}
                                    <button
                                        onClick={() => {
                                            const current = data.settings.jenisPenerimaan || ['Zakat Fitrah', 'Zakat Mal', 'Fidyah', 'Infaq', 'Sedekah'];
                                            const updated = current.filter((_, i) => i !== idx);
                                            setData({ ...data, settings: { ...data.settings, jenisPenerimaan: updated } });
                                        }}
                                        className="hover:text-[var(--text-primary)]"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Tambah jenis baru, tekan Enter..."
                            className="glass-input w-full p-3 rounded-xl text-sm mt-2"
                            onKeyDown={e => {
                                if (e.key === 'Enter' && e.target.value) {
                                    const current = data.settings.jenisPenerimaan || ['Zakat Fitrah', 'Zakat Mal', 'Fidyah', 'Infaq', 'Sedekah'];
                                    setData({ ...data, settings: { ...data.settings, jenisPenerimaan: [...current, e.target.value] } });
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>

                    <div className="space-y-2 pt-4 border-t border-[var(--border-surface)]">
                        <h5 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 text-left">Kategori Pengeluaran / Mustahik</h5>
                        <div className="flex flex-wrap gap-2">
                            {(data.settings.kategoriPengeluaran || ['Fakir', 'Miskin', 'Amil', 'Fisabilillah']).map((item, idx) => (
                                <div key={idx} className="bg-rose-500/10 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-rose-500/20">
                                    {item}
                                    <button
                                        onClick={() => {
                                            const updated = (data.settings.kategoriPengeluaran || []).filter((_, i) => i !== idx);
                                            setData({ ...data, settings: { ...data.settings, kategoriPengeluaran: updated } });
                                        }}
                                        className="hover:text-[var(--text-primary)]"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Tambah kategori baru, tekan Enter..."
                            className="glass-input w-full p-3 rounded-xl text-sm mt-2"
                            onKeyDown={e => {
                                if (e.key === 'Enter' && e.target.value) {
                                    const current = data.settings.kategoriPengeluaran || [];
                                    setData({ ...data, settings: { ...data.settings, kategoriPengeluaran: [...current, e.target.value] } });
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                </div>
            </SettingsGroup>

            <SettingsGroup
                title="Jadwal & Shift"
                icon={Calendar}
                isOpen={activeGroup === 'shift'}
                onToggle={() => setActiveGroup(activeGroup === 'shift' ? null : 'shift')}
                color="purple"
            >
                <div className="space-y-4">
                    <label className="text-xs text-[var(--text-secondary)] block uppercase tracking-wider font-bold mb-2 text-left">Konfigurasi Shift Jaga</label>
                    <div className="space-y-3">
                        {(data.settings.shifts || []).map((shift, idx) => (
                            <div key={idx} className="glass-card p-3 rounded-xl border border-[var(--border-surface)] relative group text-left">
                                <button
                                    onClick={() => {
                                        const updated = data.settings.shifts.filter((_, i) => i !== idx);
                                        setData({ ...data, settings: { ...data.settings, shifts: updated } });
                                    }}
                                    className="absolute top-2 right-2 text-red-400 hover:bg-red-500/10 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
                                ><X size={14} /></button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <span className="text-[10px] text-[var(--text-muted)] block mb-1 uppercase font-bold">Nama Shift</span>
                                                <input
                                                    value={shift.name}
                                                    onChange={e => {
                                                        const updated = [...data.settings.shifts];
                                                        updated[idx] = { ...updated[idx], name: e.target.value };
                                                        setData({ ...data, settings: { ...data.settings, shifts: updated } });
                                                    }}
                                                    className="glass-input w-full p-2.5 text-xs font-bold"
                                                />
                                            </div>
                                            <div className="w-20">
                                                <span className="text-[10px] text-[var(--text-muted)] block mb-1 uppercase font-bold">Kuota</span>
                                                <input
                                                    type="number"
                                                    value={shift.quota}
                                                    onChange={e => {
                                                        const updated = [...data.settings.shifts];
                                                        updated[idx] = { ...updated[idx], quota: parseInt(e.target.value) || 1 };
                                                        setData({ ...data, settings: { ...data.settings, shifts: updated } });
                                                    }}
                                                    className="glass-input w-full p-2.5 text-xs font-bold text-center"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <span className="text-[10px] text-[var(--text-muted)] block mb-1 uppercase font-bold">Jam Mulai</span>
                                                <input type="time" value={shift.startTime} onChange={e => {
                                                    const updated = [...data.settings.shifts];
                                                    updated[idx].startTime = e.target.value;
                                                    setData({ ...data, settings: { ...data.settings, shifts: updated } });
                                                }} className="glass-input w-full p-2 text-xs" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-[10px] text-[var(--text-muted)] block mb-1 uppercase font-bold">Jam Selesai</span>
                                                <input type="time" value={shift.endTime} onChange={e => {
                                                    const updated = [...data.settings.shifts];
                                                    updated[idx].endTime = e.target.value;
                                                    setData({ ...data, settings: { ...data.settings, shifts: updated } });
                                                }} className="glass-input w-full p-2 text-xs" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black/20 p-3 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={12} className="text-emerald-400" />
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Geofencing</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (navigator.geolocation) {
                                                        navigator.geolocation.getCurrentPosition((position) => {
                                                            const updated = [...data.settings.shifts];
                                                            updated[idx].lat = position.coords.latitude.toFixed(6);
                                                            updated[idx].lng = position.coords.longitude.toFixed(6);
                                                            setData({ ...data, settings: { ...data.settings, shifts: updated } });
                                                            alert('✅ Lokasi berhasil diambil!');
                                                        }, (err) => {
                                                            alert('❌ Gagal mengambil lokasi: ' + err.message);
                                                        });
                                                    } else {
                                                        alert('❌ Browser tidak mendukung GPS');
                                                    }
                                                }}
                                                className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/40 transition flex items-center gap-1 active:scale-95"
                                            >
                                                <Navigation size={10} /> Lokasi Saya
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="text-[9px] text-[var(--text-muted)] block mb-1">LATITUDE</span>
                                                <input type="text" placeholder="-6.1234" value={shift.lat || ''} onChange={e => {
                                                    const updated = [...data.settings.shifts];
                                                    updated[idx].lat = e.target.value;
                                                    setData({ ...data, settings: { ...data.settings, shifts: updated } });
                                                }} className="glass-input w-full p-1.5 text-[10px] font-mono" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-[var(--text-muted)] block mb-1">LONGITUDE</span>
                                                <input type="text" placeholder="106.8234" value={shift.lng || ''} onChange={e => {
                                                    const updated = [...data.settings.shifts];
                                                    updated[idx].lng = e.target.value;
                                                    setData({ ...data, settings: { ...data.settings, shifts: updated } });
                                                }} className="glass-input w-full p-1.5 text-[10px] font-mono" />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-[var(--text-muted)] block mb-1 uppercase font-bold">Radius (Meter)</span>
                                            <input type="number" placeholder="100" value={shift.radius || 100} onChange={e => {
                                                const updated = [...data.settings.shifts];
                                                updated[idx].radius = parseInt(e.target.value) || 100;
                                                setData({ ...data, settings: { ...data.settings, shifts: updated } });
                                            }} className="glass-input w-full p-1.5 text-xs text-center" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            const current = data.settings.shifts || [];
                            const newShift = { name: 'Shift Baru', startTime: '00:00', endTime: '00:00', quota: 2 };
                            setData({ ...data, settings: { ...data.settings, shifts: [...current, newShift] } });
                        }}
                        className="w-full py-2 bg-blue-500/10 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition flex items-center justify-center gap-2"
                    >
                        <Plus size={14} /> Tambah Shift
                    </button>
                </div>
            </SettingsGroup>

            <SettingsGroup
                title="Gamifikasi & Level"
                icon={Trophy}
                isOpen={activeGroup === 'gamifikasi'}
                onToggle={() => setActiveGroup(activeGroup === 'gamifikasi' ? null : 'gamifikasi')}
                color="yellow"
            >
                <div className="space-y-6 text-left">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <h5 className="text-sm font-bold text-yellow-400 mb-2">Konfigurasi Level</h5>
                        <p className="text-xs text-[var(--text-muted)]">
                            Pengaturan level dan badge saat ini dikelola otomatis oleh sistem berdasarkan aktivitas petugas.
                        </p>
                    </div>
                </div>
            </SettingsGroup>
        </div>
    );
}

export default SettingsView;
