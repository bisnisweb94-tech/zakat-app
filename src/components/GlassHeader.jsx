import React from 'react';

/**
 * Full-Width Glassmorphism Header
 * 
 * Spesifikasi:
 * - Width: 100%
 * - Position: Fixed, Top: 0
 * - Effect: Strong Glassmorphism (blur 20px, light background)
 * - Safe Area: Padding-top: env(safe-area-inset-top)
 * - Border: Thin bottom border (white/10)
 */
const GlassHeader = ({ title, children, className = "" }) => {
    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 
                 bg-white/5 backdrop-blur-[20px] 
                 border-b border-white/10 
                 pt-safe ${className}`}
        >
            <div className="px-6 py-4 flex items-center justify-between">
                {title && (
                    <h1 className="text-lg font-bold text-white tracking-tight">
                        {title}
                    </h1>
                )}
                {children}
            </div>
        </header>
    );
};

export default GlassHeader;
