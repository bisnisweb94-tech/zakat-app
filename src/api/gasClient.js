const isGAS = typeof google !== 'undefined' && google.script && google.script.run;

const gasClient = {
    request: (functionName, args = {}) => {
        return new Promise((resolve, reject) => {
            if (!isGAS) {
                console.warn(`Local Environment: Mocking GAS call to ${functionName}`, args);
                // Return empty/dummy data for local dev
                if (functionName === 'loadAllData') return resolve({});
                return resolve({ success: true });
            }

            google.script.run
                .withSuccessHandler(resolve)
                .withFailureHandler(reject)
            [functionName](args);
        });
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
