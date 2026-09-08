import axios from 'axios';
import { getLoginDefaults } from '../../../shared/utils/helper';
import { BASE_URL } from '../../../shared/utils/constants';
import type {
  ApiKeyItem,
  ApiKeyListResponse,
  CreateApiKeyPayload,
  UpdateApiKeyPayload,
} from './types';

const getAuthToken = (): string => {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('userToken') ||
    ''
  );
};

/**
 * Fetch all API keys list
 */
export const fetchApiKeyList = async (): Promise<ApiKeyItem[]> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const response = await axios.get<ApiKeyListResponse>(
    `${BASE_URL}/v1/global-api/api-keys?platform=${platform}&language_code=${language_code}&action_when=api_key_list`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.data && response.data.status) {
    return response.data.data || [];
  }
  throw new Error(response.data?.message || 'Failed to fetch API keys');
};

/**
 * Create a new API key
 */
export const createApiKey = async (payload: CreateApiKeyPayload): Promise<string> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const payloadData: Record<string, any> = {
    platform,
    language_code,
    action_when: 'api_key_create',
    api_url: payload.api_url,
    api_key: payload.api_key,
    status: payload.status,
  };

  if (payload.user_agent && payload.user_agent.trim()) {
    payloadData.user_agent = payload.user_agent.trim();
  }

  const response = await axios.post<{ status: boolean; message?: string }>(
    `${BASE_URL}/v1/global-api/create-api-key`,
    payloadData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to create API key');
  }

  return response.data.message || 'API key created successfully';
};

/**
 * Update an existing API key
 */
export const updateApiKey = async (payload: UpdateApiKeyPayload): Promise<string> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const payloadData: Record<string, any> = {
    platform,
    language_code,
    action_when: 'api_key_update',
    uuid: payload.uuid,
    api_url: payload.api_url,
    api_key: payload.api_key,
    status: payload.status,
  };

  if (payload.user_agent && payload.user_agent.trim()) {
    payloadData.user_agent = payload.user_agent.trim();
  }

  // Attempt POST to /update-api-key; fallback to PUT if needed
  let response;
  try {
    response = await axios.post<{ status: boolean; message?: string }>(
      `${BASE_URL}/v1/global-api/update-api-key`,
      payloadData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err: any) {
    if (err.response?.status === 405) {
      // Method not allowed, try PUT
      response = await axios.put<{ status: boolean; message?: string }>(
        `${BASE_URL}/v1/global-api/update-api-key`,
        payloadData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      throw err;
    }
  }

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to update API key');
  }

  return response.data.message || 'API key updated successfully';
};

/**
 * Delete an API key
 */
export const deleteApiKey = async (uuid: string, status: string = 'ACTIVE'): Promise<string> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();

  const payloadData = {
    platform,
    language_code,
    action_when: 'api_key_delete',
    status,
    uuid,
  };

  const queryParams = new URLSearchParams({
    platform,
    language_code,
    action_when: 'api_key_delete',
    status,
    uuid,
  });

  const response = await axios.delete<{ status: boolean; message?: string }>(
    `${BASE_URL}/v1/global-api/delete-api-key?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: payloadData,
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to delete API key');
  }

  return response.data.message || 'API key deleted successfully';
};
