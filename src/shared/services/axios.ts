import axios from 'axios';
import { BASE_URL } from '../utils/constants';

// Create a pre-configured axios instance
const api = axios.create({
  baseURL: BASE_URL,
});

// Intercept responses to extract API error messages centrally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiMessage = error.response?.data?.message || error.response?.data?.detail || error.response?.data?.error;
    if (apiMessage) {
      return Promise.reject(new Error(apiMessage));
    }
    return Promise.reject(error);
  }
);

export default api;
