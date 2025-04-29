// API configuration file
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default {
  baseURL: API_URL,
  endpoints: {
    auth: {
      login: `${API_URL}/auth/signin`,
      signup: `${API_URL}/auth/signup`,
    },
    users: {
      me: `${API_URL}/users/me`,
      base: `${API_URL}/users`,
      resetPassword: (userId) => `${API_URL}/users/${userId}/reset-password`,
    },
    travelRequests: {
      base: `${API_URL}/travel-requests`,
      pending: `${API_URL}/travel-requests/pending`,
      checkExpiredCodes: `${API_URL}/travel-requests/check-expired-codes`,
    },
    notifications: {
      base: `${API_URL}/notifications`,
    }
  }
};
