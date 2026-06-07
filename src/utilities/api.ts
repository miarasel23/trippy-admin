import axios from 'axios';
import { getLoginDefaults } from './common';
import type { User, LoginResponse } from '../store/userRedicure';

// Base URL for the backend API
const BASE_URL = 'http://3.209.161.158/api';
export const newwork_image_url = 'http://3.209.161.158/api/assets/uploads/images/'


export const adminLogin = async (
  email: string,
  password: string
): Promise<{ token: string; user: User }> => {
  const { platform, language_code, action_when } = getLoginDefaults();
  const formData = new URLSearchParams();
  formData.append('email', email);
  formData.append('password', password);
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', action_when);
  const response = await axios.post<LoginResponse>(
    `${BASE_URL}/v1/admin-auth/admin-login`,
    formData.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  // Store token and user information for later use
  const { access_token, user } = response.data.data;
  localStorage.setItem('authToken', access_token);
  localStorage.setItem('userData', JSON.stringify(user));
  localStorage.setItem(
    'userName',
    `${user.first_name} ${user.last_name}`
  );

  return { token: access_token, user };
};
