import React from 'react';

const AvatarFrame = ({ user, size = 'md', className = '' }) => {
    const { avatarUrl, avatarColor, xp, equippedBadge } = user;

    // Determine which badge to show. Preference: manually equipped > level based
    const getBadgeStyle = () => {
        if (equippedBadge) return equippedBadge;
        if (xp >= 15000) return 'lvl_mujahid';
        if (xp >= 5000) return 'lvl_senior';
        if (xp >= 1500) return 'lvl_teladan';
        return 'lvl_pemula';
    };

    const badge = getBadgeStyle();

    const sizeClasses = {
        sm: 'w-10 h-10 text-sm',
        md: 'w-16 h-16 text-xl',
        lg: 'w-24 h-24 text-3xl',
        xl: 'w-32 h-32 text-4xl'
    };

    const frameSizeClasses = {
        sm: 'p-1',
        md: 'p-1.5',
        lg: 'p-2',
        xl: 'p-3'
    };

    return (
        <div className={`avatar-container relative inline-flex items-center justify-center ${className}`}>
            {/* The Badge/Frame */}
            <div className={`avatar-frame-v2 badge-${badge} ${frameSizeClasses[size] || frameSizeClasses.md} rounded-full relative z-10`}>
                {/* The Avatar itself */}
                <div
                    className={`${sizeClasses[size] || sizeClasses.md} rounded-full overflow-hidden flex items-center justify-center border-2 border-[var(--bg-page)] shadow-inner relative z-20`}
                    style={{ backgroundColor: !avatarUrl ? `#${avatarColor || '333'}` : 'transparent' }}
                >
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={user.nama} className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-bold text-white uppercase">
                            {user.nama?.charAt(0) || '?'}
                        </span>
                    )}
                </div>

                {/* Optional Decorations for specific badges could go here */}
                {badge === 'lvl_mujahid' && (
                    <div className="absolute -inset-2 bg-mujahid-glitter pointer-events-none rounded-full z-0 animate-pulse-slow opacity-50 overflow-hidden"></div>
                )}
            </div>

            {/* Level Indicator (small float) */}
            {size !== 'sm' && (
                <div className="absolute -bottom-1 right-0 z-30 bg-[var(--bg-surface)] border border-[var(--border-surface)] rounded-full px-1.5 py-0.5 shadow-lg scale-90">
                    <span className="text-[8px] font-black tracking-tighter text-[var(--accent-primary)]">
                        XP {xp || 0}
                    </span>
                </div>
            )}
        </div>
    );
};

export default AvatarFrame;
