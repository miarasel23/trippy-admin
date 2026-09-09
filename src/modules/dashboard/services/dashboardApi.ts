import axios from 'axios';
import { BASE_URL } from '../../../shared/utils/constants';
import { getLoginDefaults } from '../../../shared/utils/helper';
import type {
  DashboardFilterParams,
  DashboardOverviewData,
  DashboardOverviewResponse,
} from './types';

export * from './types';

/**
 * Retrieve the active authentication token from localStorage
 */
const getAuthToken = (): string => {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('userToken') ||
    ''
  );
};

/**
 * Fetches the Dashboard Overview statistics.
 * If params (start_date / end_date) are omitted, the backend automatically defaults to today's data.
 */
export const fetchDashboardOverview = async (
  params?: DashboardFilterParams
): Promise<DashboardOverviewData> => {
  const token = getAuthToken();
  const { platform, language_code } = getLoginDefaults();
  const lang = ['bn', 'en'].includes(language_code) ? language_code : 'bn';

  const query = new URLSearchParams();
  query.append('platform', platform || 'web');
  query.append('language_code', lang);
  query.append('action_when', 'dashboard_view');

  if (params?.start_date && params.start_date.trim()) {
    query.append('start_date', params.start_date.trim());
  }
  if (params?.end_date && params.end_date.trim()) {
    query.append('end_date', params.end_date.trim());
  }

  const response = await axios.get<DashboardOverviewResponse>(
    `${BASE_URL}/v1/admin/dashboard-overview?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data?.message || 'Failed to fetch dashboard overview');
};
