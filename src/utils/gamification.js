
export const getLevel = (xp) => {
    // Top Tier / Legendary
    if (xp >= 15000) return { title: 'Mujahid Zakat', icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', limit: 30000, next: 'Max Level', badgeId: 'lvl_mujahid' };

    // Gold Tier
    if (xp >= 10000) return { title: 'Amil Gold III', icon: '👑', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', limit: 15000, next: 'Mujahid Zakat', badgeId: 'gold_3' };
    if (xp >= 7500) return { title: 'Amil Gold II', icon: '👑', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', limit: 10000, next: 'Amil Gold III', badgeId: 'gold_2' };
    if (xp >= 5000) return { title: 'Amil Gold I', icon: '👑', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', limit: 7500, next: 'Amil Gold II', badgeId: 'gold_1' };

    // Silver Tier
    if (xp >= 3500) return { title: 'Amil Silver III', icon: '⚔️', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/20', limit: 5000, next: 'Amil Gold I', badgeId: 'silver_3' };
    if (xp >= 2500) return { title: 'Amil Silver II', icon: '⚔️', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/20', limit: 3500, next: 'Amil Silver III', badgeId: 'silver_2' };
    if (xp >= 1500) return { title: 'Amil Silver I', icon: '⚔️', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/20', limit: 2500, next: 'Amil Silver II', badgeId: 'silver_1' };

    // Bronze Tier
    if (xp >= 800) return { title: 'Amil Bronze III', icon: '🛡️', color: 'text-amber-700', bg: 'bg-orange-600/10 border-orange-600/20', limit: 1500, next: 'Amil Silver I', badgeId: 'bronze_3' };
    if (xp >= 300) return { title: 'Amil Bronze II', icon: '🛡️', color: 'text-amber-600', bg: 'bg-orange-500/10 border-orange-500/20', limit: 800, next: 'Amil Bronze III', badgeId: 'bronze_2' };

    // Default
    return { title: 'Amil Bronze I', icon: '🛡️', color: 'text-amber-600', bg: 'bg-orange-500/5 border-orange-500/10', limit: 300, next: 'Amil Bronze II', badgeId: 'bronze_1' };
};
