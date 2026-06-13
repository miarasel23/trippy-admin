import axios from 'axios';
import { getLoginDefaults } from '../../../shared/utils/helper';
import { BASE_URL } from '../../../shared/utils/constants';
import type { CustomerUserItem, UpdateCustomerProfilePayload } from './types';

// Re-export types
export type { CustomerUserItem, UpdateCustomerProfilePayload } from './types';

export const fetchCustomerList = async (): Promise<CustomerUserItem[]> => {
  const token = localStorage.getItem('authToken');
  const { language_code } = getLoginDefaults();
  const response = await axios.get(
    `${BASE_URL}/v1/admin/customer-list?platform=web&language_code=${language_code}&action_when=customer_list`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch customer list');
};

export const updateCustomerProfile = async (
  payload: UpdateCustomerProfilePayload
): Promise<void> => {
  const token = localStorage.getItem('authToken');
  const { platform, language_code } = getLoginDefaults();

  const formData = new URLSearchParams();
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', 'customer_profile_edit');
  formData.append('uuid', payload.uuid);
  formData.append('full_name', payload.full_name);
  formData.append('email', payload.email);
  formData.append('phone_number', payload.phone_number);
  formData.append('country_code', payload.country_code);
  formData.append('is_notification_enabled', payload.is_notification_enabled ? 'true' : 'false');
  formData.append('device_token_for_notification', payload.device_token_for_notification);
  formData.append('is_active', payload.is_active ? 'true' : 'false');

  const response = await axios.post(
    `${BASE_URL}/v1/customer/profile-update`,
    formData.toString(),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to update customer profile');
  }
};

export const uploadCustomerProfilePicture = async (
  customerUuid: string,
  avatarFile: File
): Promise<{ profile_picture: string }> => {
  const token = localStorage.getItem('authToken');
  const { platform, language_code } = getLoginDefaults();

  const formData = new FormData();
  formData.append('customer_uuid', customerUuid);
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', 'customer_profile_picture_upload');
  formData.append('avatar', avatarFile);

  const response = await axios.post(
    `${BASE_URL}/v1/customer/customer-profile-picture-update`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to upload customer profile picture');
  }

  return response.data.data;
};

export const fetchCurrentCustomerUser = async (): Promise<any> => {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(
    `${BASE_URL}/v1/customer/get-current-customer-user?platform=web&language_code=bn&action_when=admin_login`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch current customer user');
};
