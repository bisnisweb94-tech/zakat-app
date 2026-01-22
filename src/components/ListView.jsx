import React, { useState } from 'react';
import {
    TrendingUp, TrendingDown, Users, FileText, X, Plus,
    Eye, Edit2, Trash2, MapPin, Phone, Calendar
} from 'lucide-react';
import { formatRupiah, getTotal, getTotalBeras, calculateTotalJiwa } from '../utils/format';

function ListView({ type, data, settings, onAdd, onEdit, onDel }) {
    const [detailView, setDetailView] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const Icon = { penerimaan: TrendingUp, pengeluaran: TrendingDown, mustahik: Users }[type] || FileText;
    const iconColor = type === 'pengeluaran' ? 'text-red-500' : type === 'penerimaan' ? 'text-emerald-500' : 'text-purple-500';

    const filteredData = (data || []).filter(item => {
        const term = searchTerm.toLowerCase();
        const dateStr = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID').toLowerCase() : '';
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
                            Total {filteredData.length} data
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

                        <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-surface)] h-full items-center shadow-sm">
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
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="p-8 text-center text-[var(--text-muted)]">
                                            Belum ada data
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => (
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
                                                    <td className="p-4 text-xs text-[var(--text-secondary)]">{item.petugas || '-'}</td>
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
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                                        className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDel(item.id); }}
                                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
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
                <div className="sm:hidden space-y-4">
                    {filteredData.length === 0 ? (
                        <div className="text-center p-8 text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-surface)]">
                            Belum ada data
                        </div>
                    ) : (
                        filteredData.map(item => (
                            <div key={item.id} className="glass-card p-4 rounded-2xl border border-[var(--border-surface)] relative active:scale-[0.98] transition-all" onClick={() => setDetailView(item)}>
                                {/* Header: Type specific icon & main identifier */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'pengeluaran' ? 'bg-red-500/10 text-red-400' : type === 'mustahik' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[var(--text-primary)] line-clamp-1">
                                                {item.muzakki || item.donatur || item.penerima || item.nama}
                                            </h4>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Context Menu / Actions could go here, for now relying on detail view trigger */}
                                </div>

                                {/* Content based on type */}
                                <div className="space-y-2 mb-4">
                                    {type === 'penerimaan' && (
                                        <>
                                            <div className="flex flex-wrap gap-1">
                                                {Array.isArray(item.jenis) ? item.jenis.map(j => (
                                                    <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{j}</span>
                                                )) : <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{item.jenis}</span>}
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="text-xs text-[var(--text-secondary)]">Total</div>
                                                <div className="font-bold text-lg text-emerald-400">{formatRupiah(getTotal(item))}</div>
                                            </div>
                                        </>
                                    )}

                                    {type === 'pengeluaran' && (
                                        <>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{item.kategori}</span>
                                            </div>
                                            <div className="text-xs text-[var(--text-secondary)] line-clamp-2 italic mb-2">
                                                {item.keterangan || '-'}
                                            </div>
                                            <div className="flex items-center justify-between border-t border-white/5 pt-2">
                                                <div className="text-xs text-[var(--text-secondary)]">Jumlah</div>
                                                <div className="font-bold text-lg text-red-400">{formatRupiah(item.jumlah)}</div>
                                            </div>
                                        </>
                                    )}

                                    {type === 'mustahik' && (
                                        <>
                                            <div>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{item.kategori}</span>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                                                <MapPin size={10} /> {item.alamat}
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Actions Wrapper */}
                                <div className="flex gap-2 mt-2 pt-3 border-t border-[var(--border-surface)]">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                        className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold hover:bg-emerald-500/20"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDel(item.id); }}
                                        className="px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {detailView && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDetailView(null)}>
                        <div className="glass-card w-full max-w-md bg-[var(--bg-page)] rounded-3xl p-6 border border-white/10 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold capitalize">Detail {type}</h3>
                                <button onClick={() => setDetailView(null)} className="p-2 rounded-full hover:bg-white/10 transition">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{detailView.muzakki || detailView.penerima || detailView.nama}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{detailView.id}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1"><Calendar size={10} /> Tanggal</p>
                                        <p className="text-sm font-bold">{detailView.tanggal ? new Date(detailView.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-right">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1 justify-end">Uang</p>
                                        <p className="text-lg font-black text-emerald-400">{formatRupiah(getTotal(detailView))}</p>
                                    </div>
                                </div>

                                {detailView.alamat && (
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1"><MapPin size={10} /> Alamat</p>
                                        <p className="text-sm">{detailView.alamat}</p>
                                    </div>
                                )}

                                {detailView.noHP && (
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1"><Phone size={10} /> WhatsApp</p>
                                        <p className="text-sm font-bold text-green-400">{detailView.noHP}</p>
                                    </div>
                                )}

                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Keterangan / Catatan</p>
                                    <p className="text-sm italic text-[var(--text-secondary)]">"{detailView.keterangan || 'Tidak ada catatan special.'}"</p>
                                </div>

                                <button onClick={() => setDetailView(null)} className="w-full py-3 bg-[var(--bg-surface)] hover:bg-white/10 rounded-xl font-bold transition mt-4">Tutup</button>
                            </div>
                        </div>
                    </div>
                )}
            </>
            );
}

            export default ListView;
