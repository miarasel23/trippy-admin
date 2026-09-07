import axios from 'axios';
import { BASE_URL } from '../../../shared/utils/constants';
import { getLoginDefaults } from '../../../shared/utils/helper';

export type PolicyType = 'TERMS_CONDITION' | 'PRIVACY_POLICY' | 'TRIP_POLICY' | 'HELP_AND_SUPPORT' | string;

export interface PrivacyPolicyItem {
  id: number;
  uuid: string;
  type: PolicyType;
  content: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  country_code: string;
  created_at: string;
  updated_at: string;
}

export interface PrivacyPolicyGroupedResponse {
  TERMS_CONDITION?: PrivacyPolicyItem[];
  PRIVACY_POLICY?: PrivacyPolicyItem[];
  TRIP_POLICY?: PrivacyPolicyItem[];
  HELP_AND_SUPPORT?: PrivacyPolicyItem[];
  [key: string]: PrivacyPolicyItem[] | undefined;
}

const getAuthToken = (): string => {
  return localStorage.getItem('authToken') || localStorage.getItem('userToken') || '';
};

const getSafePlatformAndLang = () => {
  const { platform, language_code } = getLoginDefaults();
  const safePlatform = ['web', 'android', 'ios'].includes(platform) ? platform : 'web';
  const safeLang = ['bn', 'en', 'hi', 'es', 'fr', 'de', 'zh', 'ja', 'ru', 'ar'].includes(language_code)
    ? language_code
    : 'en';
  return { platform: safePlatform, language_code: safeLang };
};

/**
 * Fetch Privacy Policy & Terms list grouped by type
 */
export const fetchPrivacyPolicyList = async (
  countryCode: string = 'BD',
  languageCode?: string
): Promise<PrivacyPolicyGroupedResponse> => {
  const token = getAuthToken();
  const { platform, language_code: defaultLang } = getSafePlatformAndLang();
  const lang = languageCode || defaultLang || 'bn';
  const cCode = (countryCode || 'BD').toUpperCase();

  try {
    const response = await axios.get<{
      status: boolean;
      message: string;
      data: PrivacyPolicyGroupedResponse;
    }>(
      `${BASE_URL}/v1/global-api/privacy-policy-terms-condition/list?platform=${platform}&language_code=${lang}&country_code=${cCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data && response.data.status) {
      return response.data.data || {};
    }
    throw new Error(response.data?.message || 'Failed to fetch privacy policy & terms items');
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'Failed to fetch privacy policy & terms items';
    throw new Error(message);
  }
};

/**
 * Create a new Privacy Policy / Terms item
 */
export const createPrivacyPolicyItem = async (payload: {
  type: PolicyType;
  content: string;
  country_code: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
}): Promise<any> => {
  const token = getAuthToken();
  const { platform, language_code } = getSafePlatformAndLang();

  const formData = new URLSearchParams();
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', 'privacy_policy_terms_condition_create');
  formData.append('type', payload.type);
  formData.append('content', payload.content);
  formData.append('country_code', (payload.country_code || 'BD').toUpperCase());
  formData.append('status', (payload.status || 'ACTIVE').toUpperCase());

  try {
    const response = await axios.post(
      `${BASE_URL}/v1/global-api/privacy-policy-terms-condition/create`,
      formData.toString(),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.data || !response.data.status) {
      throw new Error(response.data?.message || 'Failed to create privacy policy / terms item');
    }

    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'Failed to create privacy policy / terms item';
    throw new Error(message);
  }
};

/**
 * Update an existing Privacy Policy / Terms item
 */
export const updatePrivacyPolicyItem = async (payload: {
  uuid: string;
  type: PolicyType;
  content: string;
  country_code: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
}): Promise<any> => {
  const token = getAuthToken();
  const { platform, language_code } = getSafePlatformAndLang();

  const formData = new URLSearchParams();
  formData.append('uuid', payload.uuid);
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', 'privacy_policy_terms_condition_update');
  formData.append('type', payload.type);
  formData.append('content', payload.content);
  formData.append('country_code', (payload.country_code || 'BD').toUpperCase());
  formData.append('status', (payload.status || 'ACTIVE').toUpperCase());

  try {
    const response = await axios.put(
      `${BASE_URL}/v1/global-api/privacy-policy-terms-condition/update`,
      formData.toString(),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.data || !response.data.status) {
      throw new Error(response.data?.message || 'Failed to update privacy policy / terms item');
    }

    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'Failed to update privacy policy / terms item';
    throw new Error(message);
  }
};

/**
 * Delete an existing Privacy Policy / Terms item
 */
export const deletePrivacyPolicyItem = async (uuid: string): Promise<any> => {
  const token = getAuthToken();
  const { platform, language_code } = getSafePlatformAndLang();

  const formData = new URLSearchParams();
  formData.append('uuid', uuid);
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', 'privacy_policy_terms_condition_delete');

  try {
    const response = await axios.delete(
      `${BASE_URL}/v1/global-api/privacy-policy-terms-condition/delete`,
      {
        data: formData.toString(),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.data || !response.data.status) {
      throw new Error(response.data?.message || 'Failed to delete privacy policy / terms item');
    }

    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'Failed to delete privacy policy / terms item';
    throw new Error(message);
  }
};
