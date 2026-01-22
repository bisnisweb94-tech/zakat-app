
export const getLevel = (xp) => {
    if (xp >= 5000) return { title: 'Mujahid Zakat', icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', limit: 10000, next: 'Master', badgeId: 'lvl_mujahid' };
    if (xp >= 2000) return { title: 'Amil Senior', icon: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', limit: 5000, next: 'Mujahid Zakat', badgeId: 'lvl_senior' };
    if (xp >= 500) return { title: 'Amil Teladan', icon: '🥈', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/20', limit: 2000, next: 'Amil Senior', badgeId: 'lvl_teladan' };
    return { title: 'Amil Pemula', icon: '🥉', color: 'text-amber-600', bg: 'bg-orange-500/5 border-orange-500/10', limit: 500, next: 'Amil Teladan', badgeId: 'lvl_pemula' };
};
