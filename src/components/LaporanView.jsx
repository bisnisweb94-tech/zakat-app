import React, { useState } from 'react';
import { FileText, Download, Copy, TrendingUp, TrendingDown } from 'lucide-react';
import { formatRupiah, getTotal } from '../utils/format';
import { jsPDF } from 'jspdf';

function LaporanView({ data }) {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [dateStart, setDateStart] = useState(firstDayOfMonth);
    const [dateEnd, setDateEnd] = useState(today);
    const [selectedLokasi, setSelectedLokasi] = useState('Semua');

    const handleDownloadReport = () => {
        const header = ["Tanggal", "Shift", "Petugas", "Saldo Sistem", "Saldo Riil", "Selisih", "Status"];
        const rows = (data.kroscekHistory || []).map(k => [
            new Date(k.timestamp).toLocaleDateString('id-ID'),
            k.shift,
            k.petugas,
            k.totalSistem,
            k.totalFisik,
            k.selisih,
            k.selisih === 0 ? "BALANCE" : "SELISIH"
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + header.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Laporan_Audit_${dateStart}_ke_${dateEnd}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filterByDate = (items) => {
        return (items || []).filter(item => {
            const itemDate = item.tanggal || '';
            const inDateRange = itemDate >= dateStart && itemDate <= dateEnd;
            const inLokasi = selectedLokasi === 'Semua' || item.lokasi === selectedLokasi;
            return inDateRange && inLokasi;
        });
    };

    const filteredPenerimaan = filterByDate(data.penerimaan);
    const filteredPengeluaran = filterByDate(data.pengeluaran);

    const totalPemasukan = filteredPenerimaan.reduce((sum, item) => sum + getTotal(item), 0);
    const totalPengeluaran = filteredPengeluaran.reduce((sum, item) => sum + (item.jumlah || 0), 0);
    const saldo = totalPemasukan - totalPengeluaran;

    const pemasukanByJenis = {};
    const berasByJenis = {};
    filteredPenerimaan.forEach(item => {
        if (Array.isArray(item.jenis)) {
            item.jenis.forEach(j => {
                if (item.jumlah && typeof item.jumlah === 'object') {
                    pemasukanByJenis[j] = (pemasukanByJenis[j] || 0) + (parseFloat(item.jumlah[j]) || 0);
                }
                if (item.beratBeras && typeof item.beratBeras === 'object') {
                    berasByJenis[j] = (berasByJenis[j] || 0) + (parseFloat(item.beratBeras[j]) || 0);
                }
            });
        } else if (item.jenis) {
            const jenis = item.jenis;
            if (item.jumlah && typeof item.jumlah === 'object') {
                pemasukanByJenis[jenis] = (pemasukanByJenis[jenis] || 0) + (parseFloat(item.jumlah[jenis]) || 0);
            } else {
                pemasukanByJenis[jenis] = (pemasukanByJenis[jenis] || 0) + (parseFloat(item.jumlah) || 0);
            }
            if (item.beratBeras && typeof item.beratBeras === 'object') {
                berasByJenis[jenis] = (berasByJenis[jenis] || 0) + (parseFloat(item.beratBeras[jenis]) || 0);
            } else if (item.beratBeras && typeof item.beratBeras === 'number') {
                berasByJenis[jenis] = (berasByJenis[jenis] || 0) + item.beratBeras;
            }
        }
    });

    const totalBeras = Object.values(berasByJenis).reduce((sum, v) => sum + v, 0);

    const pengeluaranByKategori = {};
    filteredPengeluaran.forEach(item => {
        const kat = item.kategori || 'Lainnya';
        pengeluaranByKategori[kat] = (pengeluaranByKategori[kat] || 0) + (item.jumlah || 0);
    });

    const exportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        doc.setFontSize(18);
        doc.text('LAPORAN KEUANGAN ZAKAT', pageWidth / 2, y, { align: 'center' });
        y += 10;
        doc.setFontSize(12);
        doc.text(data.settings?.namaMasjid || 'Masjid', pageWidth / 2, y, { align: 'center' });
        y += 10;
        doc.setFontSize(10);
        doc.text(`Periode: ${dateStart} - ${dateEnd}`, pageWidth / 2, y, { align: 'center' });
        y += 10;

        doc.text(`Total Pemasukan: ${formatRupiah(totalPemasukan)}`, 14, y);
        y += 6;
        doc.text(`Total Pengeluaran: ${formatRupiah(totalPengeluaran)}`, 14, y);
        y += 6;
        doc.text(`Saldo: ${formatRupiah(saldo)}`, 14, y);
        y += 10;

        doc.text('RINCIAN PEMASUKAN', 14, y);
        y += 7;
        Object.entries(pemasukanByJenis).forEach(([jenis, jumlah]) => {
            if (jumlah > 0) {
                doc.text(`${jenis}: ${formatRupiah(jumlah)}`, 20, y);
                y += 6;
            }
        });

        doc.save(`Laporan_${dateStart}_${dateEnd}.pdf`);
    };

    const createWAReport = () => {
        const report = `📢 *Laporan Penerimaan Zakat*\nMasjid Jami Baitul Hikmah\nPeriode: ${dateStart} - ${dateEnd}\n\n*TOTAL: ${formatRupiah(totalPemasukan)}*\n\nSyukron wa jazakumullahu khoiron.`;
        navigator.clipboard.writeText(report).then(() => {
            alert('✅ Laporan WhatsApp berhasil di-copy!');
        });
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <div className="glass-card p-6 rounded-3xl border border-[var(--border-surface)]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="text-left">
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                            <FileText className="text-blue-400" /> Laporan Keuangan
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Analisis dan ringkasan transaksi</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={createWAReport} className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-green-600/20 text-green-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-green-600/20">
                            <Copy size={16} /> Copy WA
                        </button>
                        <button onClick={exportPDF} className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-red-600/20 text-red-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-red-600/20">
                            <Download size={16} /> PDF
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] mb-1 block">Tanggal Mulai</label>
                        <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="glass-input w-full p-3 rounded-xl" />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] mb-1 block">Tanggal Akhir</label>
                        <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="glass-input w-full p-3 rounded-xl" />
                    </div>
                    <div className="text-left">
                        <label className="text-xs text-[var(--text-secondary)] mb-1 block">Lokasi</label>
                        <select value={selectedLokasi} onChange={e => setSelectedLokasi(e.target.value)} className="glass-input w-full p-3 rounded-xl">
                            <option>Semua</option>
                            {(data.settings?.daftarLokasi || ['Masjid']).map(lok => <option key={lok}>{lok}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-left">
                    <p className="text-xs text-emerald-400 font-bold mb-1">TOTAL PEMASUKAN</p>
                    <p className="text-3xl font-black text-emerald-400">{formatRupiah(totalPemasukan)}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-left">
                    <p className="text-xs text-red-400 font-bold mb-1">TOTAL PENGELUARAN</p>
                    <p className="text-3xl font-black text-red-400">{formatRupiah(totalPengeluaran)}</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-left">
                    <p className="text-xs text-blue-400 font-bold mb-1">SALDO</p>
                    <p className="text-3xl font-black text-blue-400">{formatRupiah(saldo)}</p>
                </div>
            </div>
        </div>
    );
}

export default LaporanView;
