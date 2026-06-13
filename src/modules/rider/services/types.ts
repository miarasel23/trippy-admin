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
