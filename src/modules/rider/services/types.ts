export interface Role {
  uuid: string;
  name: string;
  description: string;
}

export interface Permission {
  uuid: string;
  name: string;
  code: string;
}

export interface RiderItem {
  uuid: string;
  full_name: string | null;
  email: string | null;
  phone_number: string;
  country_code: string;
  profile_picture: string | null;
  is_notification_enabled: boolean;
  device_token_for_notification: string | null;
  is_active: string;
  nid_number?: string;
  role: Role;
  permissions: Permission[];
}

export interface UpdateRiderProfilePayload {
  phone_number: string;
  country_code: string;
  uuid: string;
  is_active: string;
  is_notification_enabled: boolean;
  device_token_for_notification: string | null;
  full_name?: string;
  email?: string;
  password?: string;
  nid_number?: string;
}

export interface UpdateRiderProfilePicturePayload {
  driver_uuid: string;
  avatar: File;
}

export interface DriverDocumentItem {
  id: number;
  document_type: string | null;
  document_url: string;
  document_number: string | null;
  is_verified: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CarPhotoItem {
  id: number;
  document_type: string | null;
  document_url: string;
  car_categories_uuid: string;
  is_verified: string | null;
  created_at: string | null;
  updated_at: string | null;
}
