export const formatRupiah = (number) => {
    if (number === undefined || number === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

export const getTotal = (item) => {
    if (!item || !item.jumlah) return 0;
    if (typeof item.jumlah === 'number') return item.jumlah;
    return Object.values(item.jumlah).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
};

export const getTotalBeras = (item) => {
    if (!item || !item.beratBeras) return 0;
    if (typeof item.beratBeras === 'number') return item.beratBeras;
    return Object.values(item.beratBeras).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
};

export const calculateTotalJiwa = (item) => {
    if (!item || !item.muzakki) return 0;
    // Base is 1 (Kepala Keluarga) + length of anggotaKeluarga
    return 1 + (item.anggotaKeluarga?.length || parseInt(item.jumlahKeluarga) || 0);
};
