import React, { useState, useEffect } from 'react';
import { Users, Lock, Edit2, Trash2 } from 'lucide-react';
import gasClient from '../api/gasClient';

const DB = {
    USERS: 'masjid-users'
};

function UserManagementView({ currentUser, data, setData }) {
    // Gunakan data.users sebagai source of truth atau fallback ke array kosong
    const users = data.users || [];

    // Local state hanya untuk UI editing
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', nama: '', role: 'Petugas' });
    const [editId, setEditId] = useState(null);

    // Initial load sudah ditangani oleh App.jsx, jadi tidak perlu useEffect fetch disini.

    const handleSubmit = async (e) => {
        e.preventDefault();
        let newUsers = [...users];
        if (isEditing) {
            const idx = newUsers.findIndex(u => u.username === editId);
            if (idx >= 0) newUsers[idx] = formData;
        } else {
            if (newUsers.find(u => u.username === formData.username)) {
                alert('Username sudah ada!');
                return;
            }
            newUsers.push(formData);
        }

        // Optimistic Update ke Global State
        setData(prev => ({ ...prev, users: newUsers }));

        // Background sync ke server
        await gasClient.updateData(DB.USERS, newUsers);
        resetForm();
    };

    const handleEdit = (user) => {
        setFormData(user);
        setEditId(user.username);
        setIsEditing(true);
    };

    const handleDelete = async (username) => {
        if (username === 'admin') {
            alert('User admin utama tidak boleh dihapus!');
            return;
        }
        if (confirm('Hapus user ini?')) {
            const newUsers = users.filter(u => u.username !== username);

            // Optimistic Update
            setData(prev => ({ ...prev, users: newUsers }));

            // Sync Server
            await gasClient.updateData(DB.USERS, newUsers);
        }
    };

    const resetForm = () => {
        setFormData({ username: '', password: '', nama: '', role: 'Petugas' });
        setIsEditing(false);
        setEditId(null);
    };

    if (currentUser.role !== 'Admin') {
        return (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                <div className="text-center">
                    <Lock size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Akses Ditolak. Hanya untuk Admin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="text-blue-400" /> Kelola User
                </h2>
                <div className="text-xs text-[var(--text-muted)] font-bold bg-[var(--bg-surface)] px-3 py-1 rounded-full border border-[var(--border-surface)]">
                    Total: {users.length} Users
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <div className="glass-card p-6 rounded-2xl border border-[var(--border-surface)] sticky top-6">
                        <h3 className="font-bold mb-4 text-lg">{isEditing ? 'Edit User' : 'Tambah User'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Username</label>
                                <input
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="glass-input w-full p-3 rounded-xl disabled:opacity-50"
                                    required
                                    disabled={isEditing}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Nama Lengkap</label>
                                <input
                                    value={formData.nama}
                                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                    className="glass-input w-full p-3 rounded-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Password</label>
                                <input
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="glass-input w-full p-3 rounded-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="glass-input w-full p-3 rounded-xl"
                                >
                                    <option value="Petugas">Petugas</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-[var(--text-secondary)] mb-1 block">URL Foto Profil (opsional)</label>
                                <input
                                    type="url"
                                    value={formData.avatarUrl || ''}
                                    onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                                    className="glass-input w-full p-3 rounded-xl"
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">Link gambar dari Google Drive atau URL lain</p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 bg-blue-600/20 text-blue-600 dark:text-blue-300 hover:bg-blue-600/30 py-2 rounded-xl font-bold transition border border-blue-600/20 backdrop-blur-sm">
                                    {isEditing ? 'Simpan' : 'Tambah'}
                                </button>
                                {isEditing && (
                                    <button type="button" onClick={resetForm} className="px-4 bg-[var(--bg-surface)] hover:bg-white/20 rounded-xl transition">
                                        Batal
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-3 pb-24">
                    {users.length === 0 ? (
                        <div className="text-center p-8 text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-surface)]">
                            Belum ada user.
                        </div>
                    ) : (
                        users.map((user, idx) => (
                            <div key={idx} className="glass-card p-4 rounded-xl flex justify-between items-center group hover:bg-[var(--bg-surface)] transition border border-[var(--border-surface)]">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden ${user.role === 'Admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.nama || 'User'} className="w-full h-full object-cover" />
                                        ) : (
                                            (user.nama || 'U').charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold">{user.nama || 'Unknown'}</p>
                                        <p className="text-xs text-[var(--text-muted)]">@{user.username || 'noname'} • <span className={user.role === 'Admin' ? 'text-purple-400' : 'text-blue-400'}>{user.role || 'Petugas'}</span></p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => handleEdit(user)} className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(user.username)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserManagementView;
