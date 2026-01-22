import React, { useEffect, useState } from 'react';

/**
 * Floating Dock Navigation
 * 
 * Spesifikasi:
 * - Glassmorphism style (blur, semi-transparent)
 * - Detects Standalone (PWA) mode.
 * - If Standalone: Fixed at bottom, with pb-safe (safe-area-inset-bottom).
 * - If Browser: Relative/Normal position or at bottom of content.
 */
const FloatingDock = ({ items = [], activeTab, onTabChange, className = "" }) => {
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Detect standalone mode (iOS or Android/Chrome)
        const checkStandalone = () => {
            const isIOSStandalone = window.navigator.standalone === true;
            const isOtherStandalone = window.matchMedia('(display-mode: standalone)').matches;
            setIsStandalone(isIOSStandalone || isOtherStandalone);
        };

        checkStandalone();
        // Re-check on window changes if needed
        window.matchMedia('(display-mode: standalone)').addListener(checkStandalone);

        return () => {
            window.matchMedia('(display-mode: standalone)').removeListener(checkStandalone);
        };
    }, []);

    return (
        <nav
            className={`
        ${isStandalone
                    ? 'fixed bottom-0 left-0 w-full z-50 px-4 pb-safe'
                    : 'relative mt-auto px-4 pb-4'} 
        flex justify-center transition-all duration-500 ease-in-out
        ${className}
      `}
        >
            <ul className={`
        flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 rounded-2xl
        bg-white/10 backdrop-blur-[15px] 
        border border-white/10 shadow-2xl
        overflow-x-auto scrollbar-hide max-w-full
        ${isStandalone ? 'mb-4' : ''}
      `}>
                {items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <li key={item.id}>
                            <button
                                onClick={() => onTabChange(item.id)}
                                className={`
                  relative flex flex-col items-center justify-center 
                  px-4 py-2 rounded-xl transition-all duration-300
                  ${isActive ? 'text-white scale-110' : 'text-white/40 hover:text-white/70'}
                `}
                            >
                                {/* Active Indicator Background */}
                                {isActive && (
                                    <span className="absolute inset-0 bg-white/10 rounded-xl animate-ios-spring -z-10" />
                                )}

                                {item.icon && (
                                    <span className="text-xl mb-1">{item.icon}</span>
                                )}
                                <span className="text-[10px] font-medium uppercase tracking-wider">
                                    {item.label}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default FloatingDock;
