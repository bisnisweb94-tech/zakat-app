import React, { useState, useEffect } from 'react';
import gasClient from './api/gasClient';
import PublicDashboard from './components/PublicDashboard';
import LoginScreen from './components/LoginScreen';
import AdminLayout from './components/AdminLayout';
import ProfileModal from './components/ProfileModal';

function App() {
  const [view, setView] = useState('loading'); // loading, login, admin, public
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showProfile, setShowProfile] = useState(false);
  const [data, setData] = useState({
    penerimaan: [],
    pengeluaran: [],
    mustahik: [],
    muzakkiDB: [],
    settings: {
      namaMasjid: 'Masjid Jami Baitul Hikmah',
      nilaiZakatFitrah: 45000,
      targetZakatFitrah: 100000000,
      daftarLokasi: ['Masjid'],
      jenisPenerimaan: ['Zakat Fitrah', 'Zakat Mal', 'Fidyah', 'Infaq', 'Sedekah'],
      kategoriPengeluaran: ['Distribusi Zakat', 'Program Infak', 'Operasional Masjid', 'Lainnya'],
      shifts: []
    },
    absensi: [],
    kroscekCash: {},
    kroscekBank: 0,
    kroscekHistory: [],
    kroscekInvestigations: []
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const loadData = async () => {
    try {
      const allData = await gasClient.loadAllData();
      if (allData) {
        setData(prev => {
          const merged = { ...prev, ...allData };
          // Pastikan data penting selalu berupa Array agar filter/map tidak error
          const arrayKeys = ['penerimaan', 'pengeluaran', 'mustahik', 'muzakkiDB', 'absensi', 'kroscekHistory', 'kroscekInvestigations', 'users'];
          arrayKeys.forEach(key => {
            if (!Array.isArray(merged[key])) merged[key] = [];
          });
          merged.settings = { ...prev.settings, ...(allData.settings || {}) };
          return merged;
        });
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  // SYNC USER SESSION: Dedicated effect to keep session in sync with fresh data
  useEffect(() => {
    if (user && user.username && data.users) {
      const freshUser = (data.users || []).find(u =>
        u.username?.trim().toLowerCase() === user.username?.trim().toLowerCase()
      );

      if (freshUser) {
        setTimeout(() => {
          setUser(prev => {
            if (!prev) return freshUser;
            // Check if data actually changed to prevent unnecessary re-renders
            const hasChanged =
              prev.xp !== freshUser.xp ||
              prev.avatarUrl !== freshUser.avatarUrl ||
              prev.equippedBadge !== freshUser.equippedBadge ||
              prev.nama !== freshUser.nama;

            if (!hasChanged) return prev;

            const updated = { ...prev, ...freshUser };
            localStorage.setItem('masjid-local-session', JSON.stringify(updated));
            return updated;
          });
        }, 0);
      }
    }
  }, [data.users, user?.username]);

  useEffect(() => {
    const initApp = async () => {
      const localSession = localStorage.getItem('masjid-local-session');
      let initialUser = null;

      if (localSession) {
        try {
          initialUser = JSON.parse(localSession);
          setUser(initialUser);
        } catch (e) {
          console.error('Session error', e);
        }
      }

      await loadData();
      setView(initialUser ? 'admin' : 'public');
    };
    initApp();
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('masjid-local-session', JSON.stringify(u));
    setView('admin');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('masjid-local-session');
    setView('public');
  };

  const handleCheckOut = async (session) => {
    try {
      const result = await gasClient.logAttendance(user.nama, session.location, session.shift, null, 'CHECK_OUT');
      if (result.success) {
        alert('✅ Berhasil Check-out! Shift selesai.');
        await loadData();
      } else {
        alert('❌ Gagal check-out: ' + result.message);
      }
    } catch (e) {
      alert('Error checkout: ' + e);
    }
  };

  if (view === 'loading') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)]">
        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 animate-bounce">
          <span className="text-3xl font-black text-[var(--text-primary)]">Z</span>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Zakat OS</h2>
        <div className="flex gap-2 mt-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans">
      <div className="mesh-bg"></div>

      {view === 'public' && (
        <PublicDashboard
          data={data}
          onGoToLogin={() => setView('login')}
          toggleTheme={toggleTheme}
          theme={theme}
        />
      )}

      {view === 'login' && (
        <LoginScreen
          onLogin={handleLogin}
          onBack={() => setView('public')}
          users={data.users}
        />
      )}

      {view === 'admin' && (
        <AdminLayout
          user={user}
          data={data}
          setData={setData}
          onLogout={handleLogout}
          onCheckOut={handleCheckOut}
          toggleTheme={toggleTheme}
          theme={theme}
          onOpenProfile={() => {
            setShowProfile(true);
            loadData(); // Refresh data in background
          }}
        />
      )}

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem('masjid-local-session', JSON.stringify(updatedUser));
          }}
        />
      )}
    </div>
  );
}

export default App;
