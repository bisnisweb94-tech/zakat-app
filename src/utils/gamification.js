
export const getLevel = (xp) => {
    // Top Tier / Legendary
    if (xp >= 15000) return { title: 'Amil Mujahid', icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', limit: 30000, next: 'Max Level', badgeId: 'lvl_mujahid' };

    // Gold Tier (Senior)
    if (xp >= 10000) return { title: 'Amil Senior III', icon: '👑', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', limit: 15000, next: 'Amil Mujahid', badgeId: 'gold_3' };
    if (xp >= 7500) return { title: 'Amil Senior II', icon: '👑', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', limit: 10000, next: 'Amil Senior III', badgeId: 'gold_2' };
    if (xp >= 5000) return { title: 'Amil Senior I', icon: '👑', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', limit: 7500, next: 'Amil Senior II', badgeId: 'gold_1' };

    // Silver Tier (Teladan)
    if (xp >= 3500) return { title: 'Amil Teladan III', icon: '⚔️', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/20', limit: 5000, next: 'Amil Senior I', badgeId: 'silver_3' };
    if (xp >= 2500) return { title: 'Amil Teladan II', icon: '⚔️', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/20', limit: 3500, next: 'Amil Teladan III', badgeId: 'silver_2' };
    if (xp >= 1500) return { title: 'Amil Teladan I', icon: '⚔️', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/20', limit: 2500, next: 'Amil Teladan II', badgeId: 'silver_1' };

    // Bronze Tier (Pemula)
    if (xp >= 800) return { title: 'Amil Pemula III', icon: '🛡️', color: 'text-amber-700', bg: 'bg-orange-600/10 border-orange-600/20', limit: 1500, next: 'Amil Teladan I', badgeId: 'bronze_3' };
    if (xp >= 300) return { title: 'Amil Pemula II', icon: '🛡️', color: 'text-amber-600', bg: 'bg-orange-500/10 border-orange-500/20', limit: 800, next: 'Amil Pemula III', badgeId: 'bronze_2' };

    // Default
    return { title: 'Amil Pemula I', icon: '🛡️', color: 'text-amber-600', bg: 'bg-orange-500/5 border-orange-500/10', limit: 300, next: 'Amil Pemula II', badgeId: 'bronze_1' };
};
