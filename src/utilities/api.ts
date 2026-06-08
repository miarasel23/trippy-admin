import axios from 'axios';
import { getLoginDefaults } from './common';
import type { User, LoginResponse } from '../store/userRedicure';
import type { ActionItem, ActionListResponse, ActionWithLanguageItem, RoleItem, PermissionItem } from '../store/action';

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

export const fetchActionList = async (): Promise<ActionItem[]> => {
  const token = localStorage.getItem('authToken');
  const { language_code } = getLoginDefaults();
  const response = await axios.get<ActionListResponse>(
    `${BASE_URL}/v1/global-api/action-list?platform=web&language_code=${language_code}&action_when=action_list`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch action list');
};

export const createAction = async (payload: {
  action_when: string;
}): Promise<void> => {
  const token = localStorage.getItem('authToken');
  const { platform, language_code } = getLoginDefaults();

  const payloadData = {
    platform,
    language_code,
    action_when: payload.action_when,
  };

  const response = await axios.post(
    `${BASE_URL}/v1/global-api/action-create`,
    payloadData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message);
  }
};



export const editAction = async (payload: {
  uuid: string;
  action_when: string;
}): Promise<void> => {
  const token = localStorage.getItem('authToken');
  const { platform, language_code } = getLoginDefaults();

  const payloadData = {
    platform,
    language_code,
    uuid: payload.uuid,
    action_when: payload.action_when,
  };

  const response = await axios.post(
    `${BASE_URL}/v1/global-api/action-create`,
    payloadData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message);
  }
};

export const fetchActionListWithLanguage = async (): Promise<ActionWithLanguageItem[]> => {
  const token = localStorage.getItem('authToken');
  const { language_code } = getLoginDefaults();
  const response = await axios.get(
    `${BASE_URL}/v1/global-api/action-list-with-language?platform=web&language_code=${language_code}&action_when=action_list`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch action list with language');
};

export const createUpdateLanguage = async (payload: {
  action_uuid: string;
  action_when: string;
  messages: { language_code: string; message: string; uuid?: string | null }[];
}): Promise<void> => {
  const token = localStorage.getItem('authToken');
  const { platform, language_code } = getLoginDefaults();

  const payloadData = {
    action_uuid: payload.action_uuid,
    platform,
    language_code,
    action_when: payload.action_when,
    messages: payload.messages,
  };

  const response = await axios.post(
    `${BASE_URL}/v1/global-api/create-update-language`,
    payloadData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to update action language');
  }
};

export const fetchRoleList = async (): Promise<RoleItem[]> => {
  const token = localStorage.getItem('authToken');
  const { language_code } = getLoginDefaults();
  const response = await axios.get(
    `${BASE_URL}/v1/admin/role-permissions/roles-list?platform=web&language_code=${language_code}&action_when=role_list`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch role list');
};

export const fetchPermissionList = async (): Promise<PermissionItem[]> => {
  try {
    const roles = await fetchRoleList();
    const permissionMap = new Map<string, PermissionItem>();
    roles.forEach(role => {
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach(perm => {
          if (perm.code && !permissionMap.has(perm.code)) {
            permissionMap.set(perm.code, perm);
          }
        });
      }
    });
    return Array.from(permissionMap.values());
  } catch (err: any) {
    throw new Error(err.message || 'Failed to fetch permission list');
  }
};

export const createRole = async (payload: {
  name: string;
  description?: string | null;
  permissions: string[];
}): Promise<void> => {
  const token = localStorage.getItem('authToken');
  const { platform, language_code } = getLoginDefaults();

  const payloadData = {
    platform,
    language_code,
    action_when: 'role_create',
    name: payload.name,
    description: payload.description,
    permissions: payload.permissions,
  };

  const response = await axios.post(
    `${BASE_URL}/v1/admin/role-permissions/create-role`,
    payloadData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to create role');
  }
};

export const fetchAdminUserList = async (): Promise<any[]> => {
  const token = localStorage.getItem('authToken');
  const { language_code } = getLoginDefaults();
  const response = await axios.get(
    `${BASE_URL}/v1/admin/admin-list?platform=web&language_code=${language_code}&action_when=admin_list`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch admin user list');
};

export const createAdminUser = async (payload: {
  first_name: string;
  last_name: string;
  phone_number: string;
  country_code: string;
  username: string;
  email: string;
  password: string;
  role: string;
  is_active?: number;
  is_superuser?: number;
}): Promise<void> => {
  const token = localStorage.getItem('authToken');
  const { platform, language_code } = getLoginDefaults();

  const payloadData = {
    platform,
    language_code,
    action_when: 'admin_create',
    ...payload,
    is_active: payload.is_active !== undefined ? payload.is_active : 1,
    is_superuser: payload.is_superuser !== undefined ? payload.is_superuser : 0,
  };

  const response = await axios.post(
    `${BASE_URL}/v1/admin/admin-create`,
    payloadData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to create admin user');
  }
};

export const editAdminUser = async (payload: {
  uuid: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  country_code: string;
  username: string;
  email: string;
  password?: string;
  role: string;
  is_active?: number;
  is_superuser?: number;
}): Promise<void> => {
  const token = localStorage.getItem('authToken');
  const { platform, language_code } = getLoginDefaults();

  const payloadData = {
    platform,
    language_code,
    action_when: 'admin_edit',
    ...payload,
    is_active: payload.is_active !== undefined ? payload.is_active : 1,
    is_superuser: payload.is_superuser !== undefined ? payload.is_superuser : 0,
  };

  const response = await axios.put(
    `${BASE_URL}/v1/admin/admin-edit`,
    payloadData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to edit admin user');
  }
};


