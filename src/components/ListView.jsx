import React, { useState } from 'react';
import {
    TrendingUp, TrendingDown, Users, FileText, X, Plus,
    Eye, Edit2, Trash2, MapPin, Phone, Calendar, MessageSquare, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatRupiah, getTotal, getTotalBeras, calculateTotalJiwa } from '../utils/format';
import { generateWhatsAppMessage } from '../utils/whatsapp';
import DetailViewModal from './DetailViewModal';

    const [detailView, setDetailView] = useState(null);
    const [displayLimit, setDisplayLimit] = useState(30);
    const [searchTerm, setSearchTerm] = useState('');

    const Icon = { penerimaan: TrendingUp, pengeluaran: TrendingDown, mustahik: Users }[type] || FileText;
    const iconColor = type === 'pengeluaran' ? 'text-red-500' : type === 'penerimaan' ? 'text-emerald-500' : 'text-purple-500';

    const filteredData = React.useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return data || [];

        return (data || []).filter(item => {
            const dateStr = item.tanggal ? item.tanggal.toString().toLowerCase() : '';
            const jenisStr = Array.isArray(item.jenis) ? item.jenis.join(' ').toLowerCase() : (item.jenis || '').toLowerCase();

            return (
                (item.muzakki || item.donatur || item.penerima || item.nama || '').toLowerCase().includes(term) ||
                (item.id || '').toString().toLowerCase().includes(term) ||
                (item.alamat || '').toLowerCase().includes(term) ||
                (item.lokasi || '').toLowerCase().includes(term) ||
                jenisStr.includes(term) ||
                dateStr.includes(term)
            );
        });
    }, [data, searchTerm]);

    const displayedData = filteredData.slice(0, displayLimit);

    const handleWhatsApp = (item) => {
        const message = generateWhatsAppMessage(item, settings);
        const phoneNumber = item.noHP?.replace(/\D/g, '');
        if (!phoneNumber) {
            alert('Nomor HP tidak ditemukan!');
            return;
        }
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const exportToExcel = () => {
        const exportData = filteredData.map((item, index) => {
            const base = {
                No: index + 1,
                ID: item.id,
                Tanggal: item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-',
                Lokasi: item.lokasi || '-',
                Petugas: item.petugas || '-',
            };

            if (type === 'penerimaan') {
                return {
                    ...base,
                    Muzakki: item.muzakki || item.donatur,
                    HP: item.noHP || '-',
                    Alamat: item.alamat || '-',
                    Jenis: Array.isArray(item.jenis) ? item.jenis.join(', ') : item.jenis,
                    'Total Jiwa': calculateTotalJiwa(item),
                    'Total Beras (Kg)': getTotalBeras(item),
                    'Total Uang (Rp)': getTotal(item),
                    'Metode': item.metodePembayaran || 'Tunai'
                };
            }

            if (type === 'pengeluaran') {
                return {
                    ...base,
                    Penerima: item.penerima,
                    Kategori: item.kategori,
                    Jumlah: item.jumlah,
                    Metode: item.metodePembayaran || 'Tunai',
                    Keterangan: item.keterangan || '-'
                };
            }

            if (type === 'mustahik') {
                return {
                    ...base,
                    Nama: item.nama,
                    Alamat: item.alamat,
                    Kategori: item.kategori,
                    Keterangan: item.keterangan || '-'
                };
            }

            return base;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data " + type);
        XLSX.writeFile(wb, `Data_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <>
            <div className="space-y-6 pb-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="text-left">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2 capitalize">
                            <Icon className={iconColor} size={24} />
                            Data {type}
                        </h2>
                        <p className="text-[var(--text-muted)] text-xs mt-1 font-medium tracking-wide">
                            Ditampilkan {displayedData.length} dari {filteredData.length} data
                        </p>
                    </div>

                    <div className="flex w-full md:w-auto gap-3 items-stretch">
                        <div className="relative group flex-1 md:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)] group-focus-within:text-emerald-500 transition">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari..."
                                className="glass-input w-full pl-9 pr-8 py-2 rounded-xl text-sm border border-[var(--border-surface)] bg-[var(--bg-surface)] focus:ring-2 focus:ring-emerald-500/20 transition h-full"
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setDisplayLimit(30); }}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => { setSearchTerm(''); setDisplayLimit(30); }}
                                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-[var(--text-muted)] hover:text-red-400 transition"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-surface)] h-full items-center shadow-sm">
                            <button
                                onClick={exportToExcel}
                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-500/10 transition flex items-center justify-center aspect-square mr-1"
                                title="Export Excel"
                            >
                                <Download size={18} />
                            </button>
                            <div className="w-[1px] bg-[var(--border-surface)] h-2/3 mx-1"></div>
                            <button
                                onClick={onAdd}
                                className="p-2 rounded-lg text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white transition flex items-center justify-center aspect-square"
                                title="Input Data Baru"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block glass-card rounded-2xl border border-[var(--border-surface)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--bg-surface)] text-[var(--text-secondary)] uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="p-4 w-16 text-center">No</th>
                                    <th className="p-4 w-32">Tanggal</th>
                                    {type === 'penerimaan' && (
                                        <>
                                            <th className="p-4">Nama Muzakki</th>
                                            <th className="p-4">Alamat</th>
                                            <th className="p-4">Jenis Zakat</th>
                                            <th className="p-4 text-center">Jiwa</th>
                                            <th className="p-4 text-center">Beras</th>
                                            <th className="p-4 text-right">Uang</th>
                                            <th className="p-4">Petugas</th>
                                        </>
                                    )}
                                    {type === 'pengeluaran' && (
                                        <>
                                            <th className="p-4">Penerima</th>
                                            <th className="p-4">Kategori</th>
                                            <th className="p-4">Metode</th>
                                            <th className="p-4">Ket</th>
                                            <th className="p-4 text-right">Jumlah</th>
                                        </>
                                    )}
                                    {type === 'mustahik' && (
                                        <>
                                            <th className="p-4">Nama Mustahik</th>
                                            <th className="p-4">Alamat</th>
                                            <th className="p-4">Kategori</th>
                                            <th className="p-4">Keterangan</th>
                                        </>
                                    )}
                                    <th className="p-4 text-center w-32">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {displayedData.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="p-8 text-center text-[var(--text-muted)]">
                                            {searchTerm ? 'Data tidak ditemukan' : 'Belum ada data'}
                                        </td>
                                    </tr>
                                ) : (
                                    displayedData.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-[var(--bg-surface)] transition group">
                                            <td className="p-4 text-center text-[var(--text-muted)]">{index + 1}</td>
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</span>
                                                    <span className="text-xs text-[var(--text-muted)] text-[10px]">{item.id}</span>
                                                </div>
                                            </td>

                                            {type === 'penerimaan' && (
                                                <>
                                                    <td className="p-4 font-bold text-[var(--text-primary)]">
                                                        {item.muzakki || item.donatur}
                                                        {item.noHP && <div className="text-xs text-[var(--text-secondary)] font-normal mt-0.5">{item.noHP}</div>}
                                                    </td>
                                                    <td className="p-4 text-[var(--text-secondary)] text-xs max-w-[150px] truncate">{item.alamat || '-'}</td>
                                                    <td className="p-4">
                                                        {Array.isArray(item.jenis) ? item.jenis.map(j => (
                                                            <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mr-1 inline-block mb-1">{j}</span>
                                                        )) : <span className="text-xs bg-[var(--bg-surface)] px-2 py-1 rounded">{item.jenis}</span>}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">
                                                            {calculateTotalJiwa(item)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center font-medium text-orange-400">
                                                        {getTotalBeras(item) > 0 ? getTotalBeras(item) + ' Kg' : '-'}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className="font-mono font-bold text-emerald-400 text-sm bg-emerald-500/10 px-3 py-1.5 rounded-lg inline-block whitespace-nowrap border border-emerald-500/20">
                                                            {formatRupiah(getTotal(item))}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-xs font-bold text-slate-700">{item.petugas || '-'}</td>
                                                </>
                                            )}

                                            {type === 'pengeluaran' && (
                                                <>
                                                    <td className="p-4 font-bold text-[var(--text-primary)]">{item.penerima || '-'}</td>
                                                    <td className="p-4">
                                                        <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs border border-red-500/20">{item.kategori}</span>
                                                    </td>
                                                    <td className="p-4 text-xs text-[var(--text-secondary)]">{item.metodePembayaran || 'Tunai'}</td>
                                                    <td className="p-4 text-xs text-[var(--text-secondary)] max-w-[150px] truncate">{item.keterangan || '-'}</td>
                                                    <td className="p-4 text-right font-mono font-bold text-red-400">
                                                        {formatRupiah(item.jumlah)}
                                                    </td>
                                                </>
                                            )}

                                            {type === 'mustahik' && (
                                                <>
                                                    <td className="p-4 font-bold text-[var(--text-primary)]">{item.nama}</td>
                                                    <td className="p-4 text-[var(--text-secondary)] text-xs max-w-[200px] truncate">{item.alamat}</td>
                                                    <td className="p-4">
                                                        <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">{item.kategori}</span>
                                                    </td>
                                                    <td className="p-4 text-xs text-[var(--text-secondary)] max-w-[150px] truncate">{item.keterangan || '-'}</td>
                                                </>
                                            )}

                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDetailView(item); }}
                                                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDel(item.id); }}
                                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                                                        title="Hapus Data"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden grid grid-cols-1 gap-4">
                    {displayedData.length === 0 ? (
                        <div className="text-center p-8 text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-surface)]">
                            {searchTerm ? 'Data tidak ditemukan' : 'Belum ada data'}
                        </div>
                    ) : (
                        displayedData.map(item => (
                            <div key={item.id} className="glass-card p-5 rounded-3xl border border-[var(--border-surface)] relative active:scale-[0.98] transition-all" onClick={() => setDetailView(item)}>
                                {/* Header: Icon & Actions */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${type === 'pengeluaran' ? 'bg-red-500/10 text-red-400' : type === 'mustahik' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                        <Icon size={24} />
                                    </div>

                                    <div className="flex gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); setDetailView(item); }} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition"><Eye size={18} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); onDel(item.id); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={18} /></button>
                                    </div>
                                </div>

                                {/* Main Title */}
                                <h4 className="font-bold text-lg text-[var(--text-primary)] line-clamp-1 mb-1">
                                    {item.muzakki || item.donatur || item.penerima || item.nama}
                                </h4>

                                {/* Subtitle / ID / Date */}
                                <p className="text-xs text-[var(--text-muted)] mb-4">
                                    {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : item.id}
                                </p>

                                {/* Details Section (Simplified) */}
                                <div className="space-y-2 pt-3 border-t border-[var(--border-surface)]">
                                    {type === 'penerimaan' && (
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-wrap gap-1">
                                                {Array.isArray(item.jenis) ? item.jenis.map(j => (
                                                    <span key={j} className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{j}</span>
                                                )) : <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{item.jenis}</span>}
                                            </div>
                                            <span className="font-mono font-bold text-emerald-400 text-lg">{formatRupiah(getTotal(item))}</span>
                                        </div>
                                    )}

                                    {type === 'pengeluaran' && (
                                        <>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">{item.kategori}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-[var(--text-secondary)] italic max-w-[60%] truncate">{item.keterangan || '-'}</span>
                                                <span className="font-mono font-bold text-red-400 text-lg">{formatRupiah(item.jumlah)}</span>
                                            </div>
                                        </>
                                    )}

                                    {type === 'mustahik' && (
                                        <div className="flex flex-col gap-2">
                                            <div>
                                                <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">{item.kategori}</span>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                                                <MapPin size={12} className="shrink-0" /> <span className="truncate">{item.alamat}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Load More Button */}
                {filteredData.length > displayLimit && (
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={() => setDisplayLimit(prev => prev + 30)}
                            className="px-8 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-surface)] text-sm font-bold text-emerald-400 hover:bg-emerald-500/10 transition shadow-lg active:scale-95"
                        >
                            Lihat Lebih Banyak ({filteredData.length - displayLimit} data lagi)
                        </button>
                    </div>
                )}
            </div>

            {detailView && (
                <DetailViewModal
                    item={detailView}
                    type={type}
                    settings={settings}
                    onClose={() => setDetailView(null)}
                    onEdit={onEdit}
                />
            )}
        </>
    );
}

export default ListView;
