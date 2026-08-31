import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const instance = axios.create({
  baseURL: '/api',
});

// Request interceptor: inject token if available
instance.interceptors.request.use(
  (config) => {
    const authHeader = tokenStorage.getAuthHeader();
    if (authHeader.Authorization) {
      config.headers.Authorization = authHeader.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors consistently
instance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default instance;
