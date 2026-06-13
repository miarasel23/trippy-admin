import axios from 'axios';
import { getLoginDefaults } from '../../../shared/utils/helper';
import { BASE_URL } from '../../../shared/utils/constants';
import type { RiderItem } from './types';

// Re-export types
export type { RiderItem, UpdateRiderProfilePicturePayload, DriverDocumentItem, CarPhotoItem } from './types';
import type { UpdateRiderProfilePicturePayload, DriverDocumentItem, CarPhotoItem } from './types';

export const fetchRiderList = async (): Promise<RiderItem[]> => {
  const token = localStorage.getItem('authToken');
  const { language_code } = getLoginDefaults();
  const response = await axios.get(
    `${BASE_URL}/v1/admin/driver-list?platform=web&language_code=${language_code}&action_when=driver_list`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch rider list');
};

export const updateRiderProfile = async (payload: import('./types').UpdateRiderProfilePayload): Promise<string> => {
  const token = localStorage.getItem('authToken');
  const { language_code, platform } = getLoginDefaults();
  
  const formData = new FormData();
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', 'driver_profile_edit');
  formData.append('phone_number', payload.phone_number);
  formData.append('country_code', payload.country_code);
  formData.append('uuid', payload.uuid);
  formData.append('is_active', payload.is_active);
  formData.append('is_notification_enabled', payload.is_notification_enabled ? 'true' : 'false');
  if (payload.device_token_for_notification) {
    formData.append('device_token_for_notification', payload.device_token_for_notification);
  }
  if (payload.full_name) formData.append('full_name', payload.full_name);
  if (payload.email) formData.append('email', payload.email);
  if (payload.password) formData.append('password', payload.password);
  if (payload.nid_number) formData.append('nid_number', payload.nid_number);

  try {
    const response = await axios.post(
      `${BASE_URL}/v1/driver/profile-update`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      }
    );

    if (response.data && response.data.status) {
      return response.data.message || 'Profile updated successfully';
    }
    throw new Error(response.data.message || 'Failed to update profile');
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};

export const updateRiderProfilePicture = async (payload: UpdateRiderProfilePicturePayload): Promise<string> => {
  const token = localStorage.getItem('authToken');
  try {
    const formData = new FormData();
    formData.append('platform', 'web');
    formData.append('language_code', 'en');
    formData.append('action_when', 'driver_profile_picture_upload');
    formData.append('driver_uuid', payload.driver_uuid);
    formData.append('avatar', payload.avatar);

    const response = await axios.post(
      `${BASE_URL}/v1/driver/driver-profile-picture-update`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to update profile picture');
    }
    
    return response.data.message || 'Profile picture updated successfully';
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update profile picture');
  }
};

export const fetchRiderDocuments = async (driver_uuid: string): Promise<DriverDocumentItem[]> => {
  const token = localStorage.getItem('authToken');
  const { language_code, platform } = getLoginDefaults();

  const formData = new FormData();
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', 'driver_document_list');
  formData.append('driver_uuid', driver_uuid);

  const response = await axios.post(
    `${BASE_URL}/v1/driver/driver-document-list`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    }
  );
  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch driver documents');
};

export const fetchRiderCarPhotos = async (driver_uuid: string): Promise<CarPhotoItem[]> => {
  const token = localStorage.getItem('authToken');
  const { language_code, platform } = getLoginDefaults();

  const formData = new FormData();
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', 'car_photo_list');
  formData.append('driver_uuid', driver_uuid);

  const response = await axios.post(
    `${BASE_URL}/v1/driver/car-setup-and-photo-list`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    }
  );
  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch car photos');
};

export const updateDriverDocumentStatus = async (id: number, status: string): Promise<string> => {
  const token = localStorage.getItem('authToken');
  const { language_code, platform } = getLoginDefaults();

  const formData = new FormData();
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', 'driver_document_status_update');
  formData.append('id', id.toString());
  formData.append('status', status);

  const response = await axios.post(
    `${BASE_URL}/v1/driver/driver-document-status-update`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    }
  );
  if (response.data && response.data.status) {
    return response.data.message || 'Status updated successfully';
  }
  throw new Error(response.data.message || 'Failed to update document status');
};

export const updateCarPhotoStatus = async (id: number, status: string): Promise<string> => {
  const token = localStorage.getItem('authToken');
  const { language_code, platform } = getLoginDefaults();

  const formData = new FormData();
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', 'car_setup_and_photo_upload_status_update');
  formData.append('id', id.toString());
  formData.append('status', status);

  const response = await axios.post(
    `${BASE_URL}/v1/driver/car-setup-and-photo-upload-status-update`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    }
  );
  if (response.data && response.data.status) {
    return response.data.message || 'Status updated successfully';
  }
  throw new Error(response.data.message || 'Failed to update car photo status');
};
