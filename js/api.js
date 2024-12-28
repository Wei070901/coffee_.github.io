import config from './config.js';

const API_BASE_URL = config.apiUrl;

// 處理 API 響應
const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || 'Something went wrong');
    }
    return data;
};

// API 請求工具
const api = {
    // 認證相關
    auth: {
        register: async (userData) => {
            try {
                console.log('Sending register request:', userData);
                const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(userData)
                });
                const result = await handleResponse(response);
                console.log('Register response:', result);
                if (result.token) {
                    localStorage.setItem('token', result.token);
                }
                return result;
            } catch (error) {
                console.error('Register error:', error);
                throw error;
            }
        },

        login: async (credentials) => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(credentials)
                });
                const result = await handleResponse(response);
                if (result.token) {
                    localStorage.setItem('token', result.token);
                }
                return result;
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        },

        getProfile: async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Get profile error:', error);
                throw error;
            }
        },

        logout: async () => {
            try {
                localStorage.removeItem('token');
                const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Logout error:', error);
                throw error;
            }
        }
    },

    // 產品相關
    products: {
        getAll: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/products`);
                return handleResponse(response);
            } catch (error) {
                console.error('Get products error:', error);
                throw error;
            }
        }
    },

    // 訂單相關
    orders: {
        create: async (orderData) => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/api/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify(orderData)
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Create order error:', error);
                throw error;
            }
        },

        getMyOrders: async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/api/orders`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Get orders error:', error);
                throw error;
            }
        }
    },

    // 聯繫相關
    contact: {
        submit: async (contactData) => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(contactData)
                });
                return handleResponse(response);
            } catch (error) {
                console.error('Submit contact error:', error);
                throw error;
            }
        }
    }
};

export { api };
