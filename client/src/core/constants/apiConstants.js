export const API_BASE_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/users/login',
        REGISTER: '/users/register',
        CURRENT_USER: '/users/me'
    },
    TASKS: {
        BASE: '/tasks',
        BY_ID: (id) => `/tasks/${id}`
    }
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
}; 