import axios from 'axios';
import { getLoginDefaults } from '../../../shared/utils/helper';
import { BASE_URL } from '../../../shared/utils/constants';
import type {
  CommissionInsuranceItem,
  CommissionInsuranceListResponse,
  CreateOrUpdateCommissionInsurancePayload,
} from './types';

const getAuthToken = (): string => {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('userToken') ||
    ''
  );
};

export interface FetchCommissionInsuranceParams {
  status?: string;
  page?: number;
  page_size?: number;
}

/**
 * Fetch all commission and insurance slabs
 */
export const fetchCommissionInsuranceList = async (
  params?: FetchCommissionInsuranceParams
): Promise<{ total: number; page: number; page_size: number; items: CommissionInsuranceItem[] }> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const queryParams = new URLSearchParams({
    platform: platform || 'web',
    language_code: language_code || 'en',
    action_when: 'commission_insurance_list',
  });

  if (params?.status && params.status !== 'ALL') {
    queryParams.append('status', params.status);
  }
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.page_size) {
    queryParams.append('page_size', params.page_size.toString());
  }

  const response = await axios.get<CommissionInsuranceListResponse>(
    `${BASE_URL}/v1/commission-insurance/list?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data?.message || 'Failed to fetch commission & insurance slabs');
};

/**
 * Fetch a single commission and insurance slab by UUID
 */
export const fetchCommissionInsuranceSingle = async (
  uuid: string
): Promise<CommissionInsuranceItem> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const queryParams = new URLSearchParams({
    uuid,
    platform: platform || 'web',
    language_code: language_code || 'en',
    action_when: 'commission_insurance_single',
  });

  const response = await axios.get<{ status: boolean; message: string; data: CommissionInsuranceItem }>(
    `${BASE_URL}/v1/commission-insurance/single?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data?.message || 'Failed to fetch slab details');
};

/**
 * Create a new commission and insurance slab
 */
export const createCommissionInsurance = async (
  payload: CreateOrUpdateCommissionInsurancePayload
): Promise<string> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const formData = new FormData();
  formData.append('platform', platform || 'web');
  formData.append('language_code', language_code || 'en');
  formData.append('action_when', 'commission_insurance_create');
  formData.append('amount_range', payload.amount_range.toString());
  formData.append('percentage', payload.percentage.toString());
  formData.append('insurance_percentage', payload.insurance_percentage.toString());
  formData.append('booking_cancelled_fine_percentage', payload.booking_cancelled_fine_percentage.toString());
  formData.append('status', payload.status || 'ACTIVE');

  const response = await axios.post(
    `${BASE_URL}/v1/commission-insurance/create`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to create commission and insurance slab');
  }

  return response.data.message || 'Created successfully';
};

/**
 * Update an existing commission and insurance slab
 */
export const updateCommissionInsurance = async (
  payload: CreateOrUpdateCommissionInsurancePayload
): Promise<string> => {
  if (!payload.uuid) {
    throw new Error('UUID is required for updating slab');
  }

  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const formData = new FormData();
  formData.append('uuid', payload.uuid);
  formData.append('platform', platform || 'web');
  formData.append('language_code', language_code || 'en');
  formData.append('action_when', 'commission_insurance_update');
  formData.append('amount_range', payload.amount_range.toString());
  formData.append('percentage', payload.percentage.toString());
  formData.append('insurance_percentage', payload.insurance_percentage.toString());
  formData.append('booking_cancelled_fine_percentage', payload.booking_cancelled_fine_percentage.toString());
  formData.append('status', payload.status || 'ACTIVE');

  const response = await axios.post(
    `${BASE_URL}/v1/commission-insurance/update`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to update commission and insurance slab');
  }

  return response.data.message || 'Updated successfully';
};

/**
 * Delete a commission and insurance slab
 */
export const deleteCommissionInsurance = async (uuid: string): Promise<string> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const formData = new FormData();
  formData.append('uuid', uuid);
  formData.append('platform', platform || 'web');
  formData.append('language_code', language_code || 'en');
  formData.append('action_when', 'commission_insurance_delete');

  const response = await axios.post(
    `${BASE_URL}/v1/commission-insurance/delete?uuid=${uuid}&platform=${platform || 'web'}&language_code=${language_code || 'en'}&action_when=commission_insurance_delete`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to delete commission and insurance slab');
  }

  return response.data.message || 'Deleted successfully';
};
