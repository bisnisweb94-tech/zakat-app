import React, { useState } from 'react';
import { X, LogIn } from 'lucide-react';
import gasClient from '../api/gasClient';

const DB = {
    USERS: 'masjid-users'
};

function LoginScreen({ onLogin, onBack }) {
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handle = async () => {
        // HARDCODED FALLBACK: Always allow admin/admin123 for troubleshooting
        if (u === 'admin' && p === 'admin123') {
            onLogin({ username: 'admin', password: 'admin123', nama: 'Administrator (Fallback)', role: 'Admin' });
            return;
        }

        try {
            // Load users from GAS
            const result = await gasClient.loadAllData();
            let users = (result && result.users) || [];

            if (!users.length) {
                users = [
                    { username: 'admin', password: 'admin123', nama: 'Administrator', role: 'Admin' },
                    { username: 'petugas1', password: 'petugas123', nama: 'Petugas 1', role: 'Petugas' }
                ];
                // Attempt to save defaults if empty, but don't block
                try { await gasClient.updateData(DB.USERS, users); } catch { /* silenty fail */ }
            }

            const found = users.find(x => x.username === u && x.password === p);
            if (found) {
                onLogin(found);
            } else {
                alert('Login Gagal! Username atau password salah.');
            }
        } catch (error) {
            console.error('Login error:', error);
            // Even if server fails, if they typed admin/admin123 (already handled above), they get in.
            // Otherwise show error.
            alert('Koneksi ke server bermasalah (GAS Server Error). \n\nTips: Gunakan username "admin" dan password "admin123" untuk masuk darurat.');
        }
    }

    return (
        <div className="h-screen w-full flex items-center justify-center p-6 relative">
            <button
                onClick={onBack}
                className="absolute top-6 left-6 p-3 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--border-surface)] transition"
            >
                <X className="text-[var(--text-primary)]" />
            </button>

            <div className="glass-card p-8 rounded-[2.5rem] w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-[var(--bg-surface)] rounded-2xl mx-auto flex items-center justify-center mb-4">
                        <LogIn className="w-8 h-8 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Login Petugas</h2>
                </div>

                <div className="space-y-4">
                    <input
                        value={u}
                        onChange={e => setU(e.target.value)}
                        className="w-full p-4 rounded-xl glass-input"
                        placeholder="Username"
                    />

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={p}
                            onChange={e => setP(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handle()}
                            className="w-full p-4 rounded-xl glass-input pr-12"
                            placeholder="Password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]/80"
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={handle}
                        className="w-full py-4 rounded-xl bg-purple-600/20 text-purple-600 dark:text-purple-300 font-bold hover:bg-purple-600/30 transition border border-purple-600/20 backdrop-blur-sm"
                    >
                        Masuk Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginScreen;
