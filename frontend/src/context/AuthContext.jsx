import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session restoration disabled to prevent demo data persistence.
    // Auth state will remain null until a real login/register event occurs.
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      if (data && data.user) {
        setUser(data.user);
      }
      return data;
    } catch (error) {
      console.error("Auth Exception:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authService.register(userData);
      if (data && data.user) {
        setUser(data.user);
      }
      return data;
    } catch (error) {
      console.error("Auth Exception:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('examcraft_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
