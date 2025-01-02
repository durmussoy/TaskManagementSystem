import { authApi } from '../../../core/api/authApi';
import { authUtils } from '../../../core/utils/authUtils';

export class AuthService {
    static async validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        return password.length >= 6;
    }

    static async loginWithRemember(email, password, remember) {
        const response = await authApi.login({ email, password });
        if (remember) {
            authUtils.setToken(response.token);
            authUtils.setUser(response.user);
        }
        return response;
    }

    static async registerWithValidation(userData) {
        if (!this.validateEmail(userData.email)) {
            throw new Error('Geçersiz email formatı');
        }
        if (!this.validatePassword(userData.password)) {
            throw new Error('Şifre en az 6 karakter olmalıdır');
        }
        return await authApi.register(userData);
    }

    static async refreshUserSession() {
        if (!authUtils.isAuthenticated()) {
            throw new Error('Oturum bulunamadı');
        }
        return await authApi.getCurrentUser();
    }
} 