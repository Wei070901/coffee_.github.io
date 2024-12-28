import config from './config.js';

const API_BASE_URL = config.apiUrl;

// 處理 API 響應
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Something went wrong');
    }
    return response.json();
};

// API 請求工具
const api = {
    // 認證相關
    auth: {
        login: async (credentials) => {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(credentials)
            });
            return handleResponse(response);
        },

        register: async (userData) => {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            return handleResponse(response);
        },

        getProfile: async () => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return handleResponse(response);
        },

        updateProfile: async (profileData) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });
            return handleResponse(response);
        }
    },

    // 產品相關
    products: {
        getAll: async () => {
            const response = await fetch(`${API_BASE_URL}/api/products`);
            return handleResponse(response);
        },

        getOne: async (productId) => {
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
            return handleResponse(response);
        }
    },

    // 訂單相關
    orders: {
        create: async (orderData) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
            return handleResponse(response);
        },

        getMyOrders: async () => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return handleResponse(response);
        },

        getOrder: async (orderId) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return handleResponse(response);
        }
    }
};

export { api };
