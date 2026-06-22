import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (
      original.url.includes('/auth/login') ||
      original.url.includes('/auth/register') ||
      original.url.includes('/auth/refresh')
    ) {
      return Promise.reject(err);
    }
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh');
        const { data } = await axios.post('/api/auth/refresh', { refresh });
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/auth';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
