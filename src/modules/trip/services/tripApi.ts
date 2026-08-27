import axios from 'axios';
import { getLoginDefaults } from '../../../shared/utils/helper';
import { BASE_URL } from '../../../shared/utils/constants';
import type {
  RentalTripCustomerItem,
  AllRentalTripItem,
  UpdateTripBidPayload,
  CancelTripPayload,
  AcceptTripPayload,
} from './types';

export interface AllRentalTripListResponse {
  data: AllRentalTripItem[];
  total: number;
  page: number;
  limit: number;
}

// Re-export types
export type {
  RentalTripCustomerItem,
  AllRentalTripItem,
  UpdateTripBidPayload,
  CancelTripPayload,
  AcceptTripPayload,
  TripLocationPoint,
  TripBidderItem,
  TripPersonDetails,
  TripCancellationComment,
} from './types';

export const fetchCustomerTripHistory = async (
  customerUuid: string,
  tripStatus: string
): Promise<RentalTripCustomerItem[]> => {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(
    `${BASE_URL}/v1/rental-trip/rental-bid-trip-list_for_customer?platform=web&language_code=bn&action_when=rental_bid_trip_list_for_customer&customer_uuid=${customerUuid}&trip_status=${tripStatus}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch customer trip history');
};

export const fetchAllRentalTripList = async (params: {
  customer_uuid?: string;
  trip_status?: string;
  start_date?: string;
  end_date?: string;
  phone?: string;
  customer_phone?: string;
  driver_phone?: string;
  today?: boolean;
  page?: number;
}): Promise<AllRentalTripListResponse> => {
  const token = localStorage.getItem('authToken');
  const query = new URLSearchParams();
  query.append('platform', 'web');
  query.append('language_code', 'bn');
  query.append('action_when', 'all_rental_trip_list');
  if (params.customer_uuid) query.append('customer_uuid', params.customer_uuid);
  if (params.trip_status) query.append('trip_status', params.trip_status);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.phone) query.append('phone', params.phone);
  if (params.customer_phone) query.append('customer_phone', params.customer_phone);
  if (params.driver_phone) query.append('driver_phone', params.driver_phone);
  if (params.today !== undefined) query.append('today', String(params.today));
  if (params.page) query.append('page', String(params.page));

  const response = await axios.get(
    `${BASE_URL}/v1/admin/trip/all-trip-list-for-admin?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (response.data && response.data.status) {
    return {
      data: response.data.data || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      limit: response.data.limit || 50,
    };
  }
  throw new Error(response.data.message || 'Failed to fetch all rental trip list');
};

export const updateTripBid = async (payload: UpdateTripBidPayload): Promise<string> => {
  const token = localStorage.getItem('authToken');
  const { platform, language_code } = getLoginDefaults();

  const formData = new URLSearchParams();
  formData.append('platform', platform);
  formData.append('action_when', 'update_trip_bid');
  formData.append('language_code', language_code);
  formData.append('trip_uuid', payload.trip_uuid);
  formData.append('driver_uuid', payload.driver_uuid);
  formData.append('bid_amount', payload.bid_amount);

  const response = await axios.post(
    `${BASE_URL}/v1/rental-trip/update-trip-bid`,
    formData.toString(),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to update bid');
  }
  return response.data.message || 'Bid updated successfully.';
};

export const cancelTripByAdmin = async (payload: CancelTripPayload): Promise<string> => {
  const token = localStorage.getItem('authToken');
  const { platform, language_code } = getLoginDefaults();

  const formData = new URLSearchParams();
  formData.append('platform', platform);
  formData.append('action_when', 'cancel_trip_driver_or_customer_admin');
  formData.append('language_code', language_code);
  formData.append('trip_uuid', payload.trip_uuid);
  formData.append('comment', payload.comment);
  if (payload.driver_uuid) {
    formData.append('driver_uuid', payload.driver_uuid);
  }

  console.log("push data", formData.toString())

  const response = await axios.post(
    `${BASE_URL}/v1/rental-trip/cancel-trip-driver-or-customer-admin`,
    formData.toString(),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to cancel trip');
  }
  return response.data.message || 'Trip cancelled successfully.';
};

export const acceptTripForCustomer = async (payload: AcceptTripPayload): Promise<string> => {
  const token = localStorage.getItem('authToken');
  const { platform, language_code } = getLoginDefaults();

  const formData = new URLSearchParams();
  formData.append('platform', platform);
  formData.append('action_when', 'accept_trip_for_customer');
  formData.append('language_code', language_code);
  formData.append('bid_uuid', payload.bid_uuid);
  if (payload.customer_uuid) {
    formData.append('customer_uuid', payload.customer_uuid);
  }

  const response = await axios.post(
    `${BASE_URL}/v1/rental-trip/accept_trip_for_customer`,
    formData.toString(),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (!response.data || !response.data.status) {
    throw new Error(response.data?.message || 'Failed to accept trip');
  }
  return response.data.message || 'Trip accepted successfully.';
};

export const fetchRiderTripHistory = async (
  driverUuid: string,
  tripStatus: string
): Promise<RentalTripCustomerItem[]> => {
  const token = localStorage.getItem('authToken');
  const { platform, language_code } = getLoginDefaults();

  const formData = new URLSearchParams();
  formData.append('platform', platform);
  formData.append('language_code', language_code);
  formData.append('action_when', 'accept_or_cancel_or_complete_trip_for_driver');
  formData.append('driver_uuid', driverUuid);
  formData.append('status', tripStatus);

  const response = await axios.post(
    `${BASE_URL}/v1/rental-trip/accept-or-cancel-or-complete-trip-for-driver`,
    formData.toString(),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }
  );

  if (response.data && response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch rider trip history');
};
