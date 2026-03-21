import api from './api';

const AUTH_TOKEN_KEY = 'examcraft_token';
const AUTH_USER_KEY = 'examcraft_user';

const authService = {
  // Register new user
  register: async (formData) => {
    // formData should be an instance of FormData
    const response = await api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const { data } = response.data;
    if (data && data.accessToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { data } = response.data;
    if (data && data.accessToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    }
    return response.data;
  },



  // Get current user from storage
  getCurrentUser: () => {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Fetch fresh user data from backend
  getMe: async () => {
    const response = await api.get('/auth/current-user');
    const { data } = response.data;
    if (data) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
    }
    return response.data;
  },

  // Get token
  getToken: () => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  // Check if logged in
  isAuthenticated: () => {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },

  // Update profile
  updateProfile: async (formData) => {
    // formData should be an instance of FormData
    const response = await api.patch('/auth/update-account', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const { data } = response.data;
    if (data) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
    }
    return response.data;
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout error", error);
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },

};

export default authService;
