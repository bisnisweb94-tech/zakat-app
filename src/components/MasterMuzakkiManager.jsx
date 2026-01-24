import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Users, Phone, MapPin, Trash2, Edit2,
    MessageSquare, Download, Save, Plus, X, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import gasClient from '../api/gasClient';

function MasterMuzakkiManager({ data, setData, save }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcasting, setBroadcasting] = useState(false);
    const [editingMuzakki, setEditingMuzakki] = useState(null);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const muzakkiDB = data.muzakkiDB || [];

    const filteredMuzakki = useMemo(() => {
        return muzakkiDB
            .filter(m => m && m.id)
            .filter(m => {
                const term = searchTerm.toLowerCase();
                const nama = (m.nama || '').toLowerCase();
                const hp = String(m.noHP || '').toLowerCase();
                const alamat = (m.alamat || '').toLowerCase();
                return nama.includes(term) || hp.includes(term) || alamat.includes(term);
            });
    }, [muzakkiDB, searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const displayedMuzakki = filteredMuzakki.slice(0, page * ITEMS_PER_PAGE);

    const handleDelete = (id) => {
        if (!confirm('Hapus data Muzakki ini?')) return;
        const updated = muzakkiDB.filter(m => m.id !== id);
        setData({ ...data, muzakkiDB: updated });
        save('muzakki', updated);
    };

    const handleSaveMuzakki = () => {
        if (!editingMuzakki.nama || !editingMuzakki.nama.trim()) {
            alert('Nama wajib diisi!');
            return;
        }

        let updated;
        if (editingMuzakki.id) {
            updated = muzakkiDB.map(m => m.id === editingMuzakki.id ? editingMuzakki : m);
        } else {
            const newMuzakki = {
                ...editingMuzakki,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            };
            updated = [...muzakkiDB, newMuzakki];
        }

        setData({ ...data, muzakkiDB: updated });
        save('muzakki', updated);
        setEditingMuzakki(null);
    };

    const handleBroadcast = async () => {
        if (!broadcastMessage.trim()) {
            alert('Pesan tidak boleh kosong!');
            return;
        }

        const phoneNumbers = filteredMuzakki
            .map(m => m.noHP)
            .filter(p => p && p.trim());

        if (phoneNumbers.length === 0) {
            alert('Tidak ada nomor telepon yang valid!');
            return;
        }

        if (!confirm(`Kirim broadcast ke ${phoneNumbers.length} nomor?`)) return;

        setBroadcasting(true);
        try {
            const result = await gasClient.request('broadcastMessage', { phoneNumbers, message: broadcastMessage });
            alert(`✅ Broadcast selesai!\nTerkirim: ${result.sent}/${result.total}\nGagal: ${result.failed}`);
            setShowBroadcast(false);
            setBroadcastMessage('');
        } catch (error) {
            console.error('Broadcast error:', error);
            alert('❌ Gagal broadcast');
        } finally {
            setBroadcasting(false);
        }
    };

    const handleExport = () => {
        if (filteredMuzakki.length === 0) {
            alert('Tidak ada data untuk diekspor!');
            return;
        }

        const exportData = filteredMuzakki.map(m => ({
            'Nama': m.nama || '',
            'No HP': m.noHP || '',
            'Alamat': m.alamat || '',
            'Jml Jiwa': m.jumlahKeluarga || (m.anggotaKeluarga?.length || 0),
            'Anggota Keluarga': (m.anggotaKeluarga || []).join(', ')
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Muzakki');
        XLSX.writeFile(wb, `Data_Muzakki_${new Date().toISOString().split('T')[0]}.xlsx`);
        alert(`✅ ${filteredMuzakki.length} data berhasil diekspor!`);
    };

    const handleExcelImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws);

                if (jsonData.length === 0) {
                    alert('⚠️ File Excel kosong!');
                    return;
                }

                let addedCount = 0;
                const updatedMuzakkiDB = [...muzakkiDB];

                jsonData.forEach(row => {
                    // Flexible Column Matching
                    const nama = row['Nama'] || row['nama'] || row['NAMA'] || row['Nama Lengkap'] || row['Name'] || row['name'];
                    if (!nama) return;

                    // Flexible matching for HP
                    let noHP = row['No HP'] || row['no hp'] || row['nomor hp'] || row['HP'] || row['No. HP'] || row['Handphone'] || row['No Telp'] || '';
                    if (noHP) {
                        noHP = String(noHP).replace(/\D/g, '');
                        if (noHP.startsWith('0')) noHP = '62' + noHP.substring(1);
                        if (noHP.startsWith('8')) noHP = '62' + noHP;
                    }

                    const alamat = row['Alamat'] || row['alamat'] || row['ALAMAT'] || row['Address'] || row['Domisili'] || '';
                    let jumlahKeluarga = parseInt(row['Jml Jiwa'] || row['jml jiwa'] || row['Jumlah Keluarga'] || row['jumlah keluarga'] || row['Anggota'] || 0) || 0;

                    // Family Members Logic
                    let anggotaKeluarga = [];
                    const rawAnggota = row['Namanya'] || row['namanya'] || row['Nama Anggota'] || row['nama anggota'] || row['Daftar Keluarga'] || '';

                    if (rawAnggota && typeof rawAnggota === 'string') {
                        let cleanStr = rawAnggota.replace(/^\d+\.\s*/gm, ',').replace(/•\s*/g, ',').replace(/-\s+/g, ',').replace(/\r\n/g, ',').replace(/\n/g, ',');
                        anggotaKeluarga = cleanStr.split(/[,;|/]/).map(s => s.trim()).filter(s => s && s.length > 2);
                    }

                    // Scan individual columns for family members
                    Object.keys(row).forEach(key => {
                        const lowerKey = key.toLowerCase();
                        if (['nama', 'no hp', 'alamat', 'jml jiwa', 'namanya'].includes(lowerKey)) return;

                        const isMemberCol = /^(nama|anggota|anak|istri|suami).*?(\d+)?$/i.test(key)
                            && !lowerKey.includes('ayah') && !lowerKey.includes('ibu');

                        if (isMemberCol) {
                            const val = row[key];
                            if (val && typeof val === 'string' && val.trim().length > 2) {
                                const cleanVal = val.trim();
                                if (cleanVal.toLowerCase() !== key.toLowerCase() && !anggotaKeluarga.includes(cleanVal)) {
                                    anggotaKeluarga.push(cleanVal);
                                }
                            }
                        }
                    });

                    if (jumlahKeluarga === 0 && anggotaKeluarga.length > 0) {
                        jumlahKeluarga = anggotaKeluarga.length;
                    }

                    // Check duplicates
                    const existingIndex = updatedMuzakkiDB.findIndex(m => m.nama.toLowerCase() === nama.toLowerCase());

                    if (existingIndex !== -1) {
                        // Update existing
                        const old = updatedMuzakkiDB[existingIndex];
                        updatedMuzakkiDB[existingIndex] = {
                            ...old,
                            noHP: noHP || old.noHP,
                            alamat: alamat || old.alamat,
                            jumlahKeluarga: jumlahKeluarga || old.jumlahKeluarga || 0,
                            anggotaKeluarga: anggotaKeluarga.length > 0 ? anggotaKeluarga : (old.anggotaKeluarga || [])
                        };
                        addedCount++;
                    } else {
                        // Insert new
                        updatedMuzakkiDB.push({
                            id: Date.now() + Math.random().toString(),
                            nama: nama,
                            noHP: noHP,
                            alamat: alamat,
                            jumlahKeluarga: jumlahKeluarga,
                            anggotaKeluarga: anggotaKeluarga,
                            createdAt: new Date().toISOString()
                        });
                        addedCount++;
                    }
                });

                setData({ ...data, muzakkiDB: updatedMuzakkiDB });
                save('muzakki', updatedMuzakkiDB);
                alert(`✅ Berhasil memproses ${addedCount} data!`);

            } catch (err) {
                console.error("Excel import error", err);
                alert("Gagal membaca file Excel");
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-24">
            {/* Header Unified */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="text-left">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Phone className="text-emerald-500" size={24} />
                        Data Muzakki
                    </h2>
                    <p className="text-[var(--text-muted)] text-xs mt-1 font-medium tracking-wide">
                        Total {filteredMuzakki.length} Muzakki Terdaftar
                    </p>
                </div>

                {/* Right Side: Search + Actions */}
                <div className="flex w-full md:w-auto gap-3 items-stretch">
                    {/* Search Bar */}
                    <div className="relative group flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)] group-focus-within:text-emerald-500 transition">
                            <Search size={16} strokeWidth={2.5} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari..."
                            className="glass-input w-full pl-9 pr-8 py-2 rounded-xl text-sm border border-[var(--border-surface)] bg-[var(--bg-surface)] focus:ring-2 focus:ring-emerald-500/20 transition h-full"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-2 flex items-center text-[var(--text-muted)] hover:text-red-400 transition"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Unified Action Toolbar */}
                    <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-surface)] h-full items-center shadow-sm">
                        {/* Hidden Input for Excel */}
                        <input
                            type="file"
                            id="excelUpload"
                            accept=".xlsx, .xls"
                            onChange={handleExcelImport}
                            className="hidden"
                        />

                        <button
                            onClick={() => document.getElementById('excelUpload').click()}
                            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)] transition flex items-center justify-center aspect-square text-xs font-medium border border-transparent hover:border-[var(--glass-border)]"
                            title="Import Excel"
                        >
                            <FileSpreadsheet size={18} />
                        </button>

                        <button
                            onClick={() => setShowBroadcast(true)}
                            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-emerald-400 transition flex items-center justify-center aspect-square text-xs font-medium border border-transparent hover:border-[var(--glass-border)]"
                            title="Broadcast WhatsApp"
                        >
                            <Phone size={18} />
                        </button>

                        <button
                            onClick={handleExport}
                            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-purple-400 transition flex items-center justify-center aspect-square text-xs font-medium border border-transparent hover:border-[var(--glass-border)]"
                            title="Export Excel"
                        >
                            <Download size={18} />
                        </button>

                        <div className="w-[1px] bg-[var(--border-surface)] h-2/3 mx-1"></div>

                        <button
                            onClick={() => setEditingMuzakki({ nama: '', noHP: '', alamat: '', anggotaKeluarga: [] })}
                            className="p-2 rounded-lg text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white transition flex items-center justify-center aspect-square"
                            title="Tambah Baru"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            {showBroadcast && (
                <div className="glass-card p-6 rounded-3xl border-2 border-purple-500/30 bg-purple-500/5 animate-fade-in text-left">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold flex items-center gap-2 text-purple-400"><MessageSquare size={18} /> Broadcast WhatsApp ({filteredMuzakki.length} target)</h3>
                        <button onClick={() => setShowBroadcast(false)} className="text-[var(--text-muted)] hover:text-white"><X size={20} /></button>
                    </div>
                    <textarea
                        value={broadcastMessage}
                        onChange={e => setBroadcastMessage(e.target.value)}
                        placeholder="Tulis pesan untuk para muzakki..."
                        className="w-full glass-input p-4 rounded-2xl h-32 text-sm mb-4"
                    />
                    <div className="flex justify-end gap-3">
                        <button disabled={broadcasting} onClick={handleBroadcast} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${broadcasting ? 'bg-gray-500 opacity-50' : 'bg-purple-500 text-white hover:bg-purple-600'}`}>
                            {broadcasting ? 'Mengirim...' : '🚀 Kirim Sekarang'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedMuzakki.map(muzakki => (
                    <div key={muzakki.id} className="glass-card p-5 rounded-3xl border border-[var(--border-surface)] hover:border-blue-500/30 transition group relative overflow-hidden text-left">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-xl">
                                {muzakki.nama.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => setEditingMuzakki(muzakki)} className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(muzakki.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <h4 className="font-bold text-lg mb-1 line-clamp-1">{muzakki.nama}</h4>
                        <div className="space-y-2 mt-3">
                            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                <Phone size={12} className="text-emerald-400" /> <span>{muzakki.noHP || '-'}</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                                <MapPin size={12} className="mt-0.5 shrink-0" /> <span className="line-clamp-2">{muzakki.alamat || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase mt-2">
                                <Users size={12} /> <span>Anggota: {muzakki.jumlahKeluarga || (muzakki.anggotaKeluarga?.length || 0)} Jiwa</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {displayedMuzakki.length < filteredMuzakki.length && (
                <button
                    onClick={() => setPage(page + 1)}
                    className="w-full py-4 bg-[var(--bg-surface)] hover:bg-white/5 rounded-2xl font-bold text-[var(--text-secondary)] transition border border-dashed border-[var(--border-surface)] mt-6"
                >
                    Lihat Lebih Banyak ({filteredMuzakki.length - displayedMuzakki.length})
                </button>
            )}

            {editingMuzakki && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setEditingMuzakki(null)}>
                    <div className="glass-card w-full max-w-lg rounded-[2.5rem] p-8 border border-white/10 shadow-3xl text-left" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black">{editingMuzakki.id ? 'Edit Muzakki' : 'Muzakki Baru'}</h3>
                            <button onClick={() => setEditingMuzakki(null)} className="text-[var(--text-muted)] hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Nama Lengkap</label>
                                <input value={editingMuzakki.nama || ''} onChange={e => setEditingMuzakki({ ...editingMuzakki, nama: e.target.value })} className="w-full glass-input p-4 rounded-2xl text-lg font-bold" placeholder="Contoh: Haji Ahmad" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">WhatsApp</label>
                                <input value={editingMuzakki.noHP || ''} onChange={e => setEditingMuzakki({ ...editingMuzakki, noHP: e.target.value })} className="w-full glass-input p-4 rounded-2xl text-sm" placeholder="628..." />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Jml Jiwa</label>
                                <input type="number" value={editingMuzakki.jumlahKeluarga || ''} onChange={e => setEditingMuzakki({ ...editingMuzakki, jumlahKeluarga: parseInt(e.target.value) })} className="w-full glass-input p-4 rounded-2xl text-sm" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">Alamat / ID Lokasi</label>
                                <textarea value={editingMuzakki.alamat || ''} onChange={e => setEditingMuzakki({ ...editingMuzakki, alamat: e.target.value })} className="w-full glass-input p-4 rounded-2xl text-sm h-24" placeholder="Contoh: Cluster Sanur No. 12" />
                            </div>
                            <button onClick={handleSaveMuzakki} className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black hover:bg-blue-500 transition shadow-2xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3">
                                <Save size={20} /> <span>SIMPAN DATA</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MasterMuzakkiManager;
