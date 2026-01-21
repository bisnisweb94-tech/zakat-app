const isGAS = typeof google !== 'undefined' && google.script && google.script.run;

// Jika Anda deploy ke Vercel, masukkan URL Web App GAS Anda di sini
// Cara dapatnya: Di Google Sheets -> Extensions -> Apps Script -> Deploy -> New Deployment -> Web App
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz7pZovlJTBuCapJYdasI5aqyVZCakHjUsb0iWAJc-EZ9XqKH6umi3eIQcJ2Dz80iU8/exec';

const gasClient = {
    request: async (functionName, args = {}) => {
        if (isGAS) {
            return new Promise((resolve, reject) => {
                google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                [functionName](args);
            });
        } else {
            // Fallback untuk Vercel / Local Host
            if (!WEB_APP_URL) {
                console.warn(`Local Environment: Mocking GAS call to ${functionName} (WEB_APP_URL is empty)`, args);
                // Return dummy data agar app tidak crash saat testing lokal
                if (functionName === 'loadAllData') return { users: [], settings: {} };
                return { success: true };
            }

            try {
                const response = await fetch(WEB_APP_URL, {
                    method: 'POST',
                    body: JSON.stringify({ functionName, args }),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                });
                const result = await response.json();

                // Jika server GAS mengembalikan error
                if (result && result.error) {
                    throw new Error(result.message || "GAS Server Error");
                }

                return result;
            } catch (error) {
                console.error("API Error:", error);
                throw error;
            }
        }
    },

    loadAllData: async () => {
        return gasClient.request('loadAllData');
    },

    updateData: async (key, value) => {
        return gasClient.request('updateData', { key, value });
    },

    logActivity: async (user, type, detail) => {
        return gasClient.request('logActivity', { user, type, detail });
    },

    logAttendance: async (user, location, shift, coords, type) => {
        return gasClient.request('logAttendance', { user, location, shift, coords, type });
    }
};

export default gasClient;
