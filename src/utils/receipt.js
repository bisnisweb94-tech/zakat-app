import { jsPDF } from 'jspdf';
import { calculateTotalJiwa, getTotal, getTotalBeras } from './format';

export const cetakKwitansi = (item, settings) => {
    const fmt = (n) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(n);

    const splitText = (doc, text, maxWidth) => {
        return doc.splitTextToSize(text, maxWidth);
    };

    const dummyDoc = new jsPDF({ unit: 'mm', format: [80, 200] });
    dummyDoc.setFont('helvetica', 'normal');
    dummyDoc.setFontSize(9);

    // SIMULATED HEIGHT CALCULATION (Exact Match)
    let y = 8; // Start y same as drawing
    const margin = 4;
    const width = 80 - (margin * 2);
    const lineHeight = 4.5;

    // Header (Nama Masjid + Bukti + Line)
    y += 5;
    y += 5;
    y += 4;

    // No & Tanggal
    y += lineHeight;

    // Diterima Dari
    y += 2;
    y += lineHeight;
    y += lineHeight; // Nama Muzakki

    // Alamat
    if (item.alamat) {
        y += splitText(dummyDoc, item.alamat, width).length * lineHeight;
    }

    // Family / Jiwa
    const totalJiwa = calculateTotalJiwa(item);
    if (totalJiwa > 1 || (item.anggotaKeluarga && item.anggotaKeluarga.length > 0)) {
        y += 2; // Spacing
        y += lineHeight; // Header "Untuk..."
        y += lineHeight; // Kepala Keluarga
        if (item.anggotaKeluarga) {
            const familyCount = item.anggotaKeluarga.filter(n => n && n.trim()).length;
            y += familyCount * lineHeight;
        }
    }

    // Divider & Rincian Header
    y += 3; y += 4;
    y += lineHeight;

    // Items
    if (item.jenis && Array.isArray(item.jenis)) {
        item.jenis.forEach(j => {
            if ((item.jumlah?.[j]) || (item.beratBeras?.[j])) y += lineHeight;
        });
    }

    // Footer Divider
    y += 2; y += 5;

    // Totals
    const tUang = getTotal(item);
    const tBeras = getTotalBeras(item);
    if (tUang > 0) y += 6;
    if (tBeras > 0) y += 6;

    // Petugas & Doa
    y += 5;
    y += 5;
    y += 3;

    // Add small buffer at bottom
    const pageHeight = y + 5;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, pageHeight] });
    y = 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(settings?.namaMasjid || 'MASJID JAMI', 40, y, { align: 'center' });
    y += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Bukti Penerimaan Zakat/Infaq/Sedekah', 40, y, { align: 'center' });
    y += 5;

    doc.setLineDash([1, 1], 0);
    doc.line(margin, y, 80 - margin, y);
    y += 4;

    doc.setFontSize(9);
    doc.text(`No: ${item.id}`, margin, y);
    doc.text(new Date(item.tanggal).toLocaleDateString('id-ID'), 80 - margin, y, { align: 'right' });
    y += lineHeight;

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Diterima Dari:', margin, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(item.muzakki || item.donatur || 'Hamba Allah', margin, y);
    y += lineHeight;

    if (item.alamat) {
        doc.setFontSize(8);
        const alamatLines = splitText(doc, item.alamat, width);
        doc.text(alamatLines, margin, y);
        y += lineHeight * alamatLines.length;
    }

    if (totalJiwa > 1 || (item.anggotaKeluarga && item.anggotaKeluarga.length > 0)) {
        y += 2;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`Untuk (${totalJiwa} Jiwa):`, margin, y);
        y += lineHeight;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`1. ${item.muzakki || item.donatur} (KK)`, margin + 2, y);
        y += lineHeight;
        if (item.anggotaKeluarga) {
            item.anggotaKeluarga.filter(n => n && n.trim()).forEach((nama, idx) => {
                doc.text(`${idx + 2}. ${nama}`, margin + 2, y);
                y += lineHeight;
            });
        }
    }

    y += 3;
    doc.line(margin, y, 80 - margin, y);
    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Rincian', margin, y);
    doc.text('Jumlah', 80 - margin, y, { align: 'right' });
    y += lineHeight;
    doc.setFont('helvetica', 'normal');

    if (item.jenis && Array.isArray(item.jenis)) {
        item.jenis.forEach(j => {
            const uang = item.jumlah?.[j] || 0;
            const beras = item.beratBeras?.[j] || 0;
            if (uang > 0 || beras > 0) {
                doc.text(j, margin, y);
                let valStr = '';
                if (uang > 0) valStr = fmt(uang);
                if (beras > 0) valStr = (valStr ? valStr + ' + ' : '') + beras + ' Kg';
                doc.text(valStr, 80 - margin, y, { align: 'right' });
                y += lineHeight;
            }
        });
    }

    y += 2;
    doc.setLineDash([], 0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, 80 - margin, y);
    y += 5;

    const totalUang = getTotal(item);
    const totalBeras = getTotalBeras(item);

    if (totalUang > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL UANG', margin, y);
        doc.text(fmt(totalUang), 80 - margin, y, { align: 'right' });
        y += 6;
    }
    if (totalBeras > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL BERAS', margin, y);
        doc.text(totalBeras + ' Kg', 80 - margin, y, { align: 'right' });
        y += 6;
    }

    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Petugas: ${item.petugas || '-'}`, margin, y);
    doc.text(item.metodePembayaran || 'Tunai', 80 - margin, y, { align: 'right' });
    y += 5;
    doc.setFontSize(7);
    doc.text('Semoga Allah menerima amal ibadah Bapak/Ibu', 40, y, { align: 'center' });
    y += 3;
    doc.text('dan memberkahi harta yang tersisa. Aamiin.', 40, y, { align: 'center' });

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
};
