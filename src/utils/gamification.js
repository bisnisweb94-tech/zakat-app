
export const getLevel = (xp) => {
    // Top Tier / Legendary
    if (xp >= 15000) return { title: 'Amil Mujahid', icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', limit: 30000, next: 'Max Level', badgeId: 'lvl_mujahid' };

    // Gold Tier (Senior) - Unified Badge
    if (xp >= 10000) return { title: 'Amil Senior III', icon: '👑', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', limit: 15000, next: 'Amil Mujahid', badgeId: 'lvl_senior' };
    if (xp >= 7500) return { title: 'Amil Senior II', icon: '👑', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', limit: 10000, next: 'Amil Senior III', badgeId: 'lvl_senior' };
    if (xp >= 5000) return { title: 'Amil Senior I', icon: '👑', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', limit: 7500, next: 'Amil Senior II', badgeId: 'lvl_senior' };

    // Silver Tier (Teladan) - Unified Badge
    if (xp >= 3500) return { title: 'Amil Teladan III', icon: '⚔️', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/20', limit: 5000, next: 'Amil Senior I', badgeId: 'lvl_teladan' };
    if (xp >= 2500) return { title: 'Amil Teladan II', icon: '⚔️', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/20', limit: 3500, next: 'Amil Teladan III', badgeId: 'lvl_teladan' };
    if (xp >= 1500) return { title: 'Amil Teladan I', icon: '⚔️', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/20', limit: 2500, next: 'Amil Teladan II', badgeId: 'lvl_teladan' };

    // Bronze Tier (Pemula) - Unified Badge
    if (xp >= 800) return { title: 'Amil Pemula III', icon: '🛡️', color: 'text-amber-700', bg: 'bg-orange-600/10 border-orange-600/20', limit: 1500, next: 'Amil Teladan I', badgeId: 'lvl_pemula' };
    if (xp >= 300) return { title: 'Amil Pemula II', icon: '🛡️', color: 'text-amber-600', bg: 'bg-orange-500/10 border-orange-500/20', limit: 800, next: 'Amil Pemula III', badgeId: 'lvl_pemula' };

    // Default
    return { title: 'Amil Pemula I', icon: '🛡️', color: 'text-amber-600', bg: 'bg-orange-500/5 border-orange-500/10', limit: 300, next: 'Amil Pemula II', badgeId: 'lvl_pemula' };
};
