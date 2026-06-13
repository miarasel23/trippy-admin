// ─── Rental Trip (Customer view) ────────────────────────────

export interface RentalTripCustomerItem {
  id: number;
  uuid: string;
  total_bids: number;
  bid_summary: {
    lowest_bid_amount: number | null;
    highest_bid_amount: number | null;
    total_bids: number;
  };
  platform: string;
  service_name: string;
  payment_method: string;
  start_datetime: string;
  end_datetime: string | null;
  country_code: string;
  hours_booked: number | null;
  trip_status: string;
  created_at: string;
  car_category?: {
    uuid: string;
    car_type: string;
    set_capacity: number;
    car_avatar: string;
  } | null;
  car_service?: {
    uuid: string;
    service_name: string;
    avatar: string;
  } | null;
  price_info?: {
    uuid: string;
    price_per_km: number;
    minimum_booking_price: number;
    waiting_price: number;
    cancellation_fee: number;
    busy_time_percentage: number;
  } | null;
  pickup_locations?: {
    uuid: string;
    place_id: string;
    latitude: string;
    longitude: string;
    address: string;
  }[];
  dropoff_locations?: {
    uuid: string;
    place_id: string;
    latitude: string;
    longitude: string;
    address: string;
  }[];
  drivers?: any[];
}

// ─── Rental Trip (Admin / All Trips view) ───────────────────

export interface TripLocationPoint {
  uuid: string;
  place_id: string;
  latitude: string;
  longitude: string;
  address: string;
}

export interface TripBidderItem {
  bid_uuid: string;
  bid_amount: number;
  commission_amount: number;
  booking_charge_amount: number;
  insurance_charge_amount: number;
  customer_discount_amount: number | null;
  total_amount: number;
  status: string;
  created_at: string;
  driver_details: {
    uuid: string;
    full_name: string | null;
    phone_number: string;
    email: string | null;
    profile_picture: string | null;
    car_photos?: string[];
  };
}

export interface TripPersonDetails {
  uuid: string;
  full_name: string | null;
  phone_number: string;
  email: string | null;
  profile_picture: string | null;
}

export interface TripCancellationComment {
  uuid: string;
  comment: string;
  cancelled_by: string;
  cancelled_by_uuid: string | null;
  created_at: string | null;
}

export interface AllRentalTripItem {
  trip_details: {
    uuid: string;
    platform: string;
    service_name: string;
    payment_method: string;
    start_datetime: string;
    end_datetime: string | null;
    hours_booked: number | null;
    trip_status: string;
    country_code: string;
    created_at: string;
  };
  location_details: {
    pickup_locations: TripLocationPoint[];
    dropoff_locations: TripLocationPoint[];
  };
  all_bidders: TripBidderItem[];
  amount_details: {
    accepted_bid_amount: number | null;
    commission_amount: number | null;
    booking_charge_amount: number | null;
    insurance_charge_amount: number | null;
    customer_discount_amount: number | null;
    total_amount: number | null;
    price_per_km: number;
    minimum_booking_price: number;
  };
  customer_details: TripPersonDetails;
  accepted_driver_details: TripPersonDetails | null;
  cancellation_comments: TripCancellationComment[];
}

// ─── Trip API Payloads ──────────────────────────────────────

export interface UpdateTripBidPayload {
  trip_uuid: string;
  driver_uuid: string;
  bid_amount: string;
}

export interface CancelTripPayload {
  trip_uuid: string;
  comment: string;
  driver_uuid?: string;
}

export interface AcceptTripPayload {
  bid_uuid: string;
  customer_uuid?: string;
}
