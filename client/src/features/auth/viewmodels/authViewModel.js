import { useState } from 'react';
import { authApi } from '../../../core/api/authApi';
import { authUtils } from '../../../core/utils/authUtils';

export const useAuthViewModel = () => {
    const [user, setUser] = useState(authUtils.getUser());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            const response = await authApi.login({ email, password });
            authUtils.setToken(response.token);
            authUtils.setUser(response.user);
            setUser(response.user);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Giriş yapılırken bir hata oluştu');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await authApi.register(userData);
            authUtils.setToken(response.token);
            authUtils.setUser(response.user);
            setUser(response.user);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Kayıt olurken bir hata oluştu');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        authUtils.clearAuth();
        setUser(null);
    };

    const checkAuthStatus = async () => {
        try {
            if (!authUtils.isAuthenticated()) {
                return false;
            }
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
            return true;
        } catch (err) {
            logout();
            return false;
        }
    };

    return {
        user,
        loading,
        error,
        login,
        register,
        logout,
        checkAuthStatus,
        isAuthenticated: authUtils.isAuthenticated
    };
}; 