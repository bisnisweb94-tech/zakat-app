import { formatRupiah, getTotal, getTotalBeras, calculateTotalJiwa } from './format';

export const generateWhatsAppMessage = (item, settings) => {
    const totalUang = getTotal(item);
    const totalBeras = getTotalBeras(item);
    const date = new Date(item.tanggal || new Date());
    const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const listAnggota = (item.anggotaKeluarga || [])
        .filter(n => n && n.trim())
        .map((n, i) => `${i + 1}. ${n}`)
        .join('\n');

    // Breakdown Nominal
    const getVal = (type) => {
        let uang = 0;
        let beras = 0;
        if (item.jumlah && typeof item.jumlah === 'object') uang = item.jumlah[type] || 0;
        // Fallback for flat numbers
        if (typeof item.jumlah === 'number' && item.jenis === type) uang = item.jumlah;

        if (item.beratBeras && typeof item.beratBeras === 'object') beras = item.beratBeras[type] || 0;
        return { uang, beras };
    };

    const zFitrah = getVal('Zakat Fitrah');
    const sedekah = getVal('Infak');
    const fidyah = getVal('Fidyah');
    const zMal = getVal('Zakat Mal');

    // Rekening & Kontak
    const bank = settings?.rekening?.bank || 'Bank Syariah Indonesia';
    const norek = settings?.rekening?.norek || '7019291698';
    const atasNama = settings?.rekening?.atasNama || 'Eko Andri QQ BAITUL HIKMAH';
    const adminWa = settings?.nomorKonsultasi || '6285694449192';

    return `📢 *Konfirmasi Penerimaan Zakat*

⏰ ${dateStr}
Bagi Bapak/ibu yang ingin menjadi Donatur bulanan tetap untuk memberikan mustahiq (orang yang membutuhkan) sekitar duta bintaro silahkan hubungi nomer ini,

👤 *Nama Kepala Keluarga:* ${item.muzakki || item.nama || '-'}
📍 *Alamat:* ${item.alamat || '-'}
👥 *Jumlah Keluarga:* ${calculateTotalJiwa(item)} orang

👨‍👩‍👧‍👦 *Anggota Keluarga:*
${listAnggota || '-'}

💵 *Metode Pembayaran:* ${item.metodePembayaran || 'Tunai'}

💰 *Zakat Fitrah:* ${formatRupiah(zFitrah.uang)} (${zFitrah.beras} Kg Beras)
🎁 *Sedekah:* ${formatRupiah(sedekah.uang)} (${sedekah.beras} Kg Beras)
🍚 *Fidyah:* ${formatRupiah(fidyah.uang)} (${fidyah.beras} Kg Beras)
🏦 *Zakat Mal:* ${formatRupiah(zMal.uang)}

📊 *TOTAL:*
   💰 Uang  : ${formatRupiah(totalUang)}
   🍚 Beras : ${totalBeras} Kg

👤 *Nama Petugas:* ${item.petugas || '-'}

🙏 *Terima kasih atas zakat & sedekah yang telah Anda tunaikan.*
Semoga Allah menerima amal ibadah kita dan memberikan keberkahan. Aamiin 🙏🏻

🏦 *Transfer Zakat/Sedekah:*
   • *${bank}*
   • ${norek}
   • a/n *${atasNama}*

📞 *Konfirmasi & Konsultasi:*
   1. *LazisMBH* : wa.me/${adminWa}

📜 *Jazakumullahu khairan, semoga rezeki Anda semakin berkah dan melimpah.*`;
};
