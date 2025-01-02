export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

export const authUtils = {
    setToken: (token) => {
        localStorage.setItem(TOKEN_KEY, token);
    },

    getToken: () => {
        return localStorage.getItem(TOKEN_KEY);
    },

    removeToken: () => {
        localStorage.removeItem(TOKEN_KEY);
    },

    setUser: (user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    getUser: () => {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    removeUser: () => {
        localStorage.removeItem(USER_KEY);
    },

    isAuthenticated: () => {
        return !!authUtils.getToken();
    },

    clearAuth: () => {
        authUtils.removeToken();
        authUtils.removeUser();
    }
}; 