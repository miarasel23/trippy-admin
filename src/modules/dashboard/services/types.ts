export interface DashboardOverviewFilter {
  type: string;
  start_date?: string;
  end_date?: string;
}

export interface DashboardDriverStats {
  total_drivers: number;
  total_active_drivers: number;
  total_offline_drivers: number;
  new_drivers: number;
}

export interface DashboardCustomerStats {
  total_customers: number;
  new_customers: number;
}

export interface DashboardTripStats {
  new_trip_requests: number;
  completed_trips: number;
  cancelled_trips: number;
  total_trips_in_period: number;
  all_time_total_trips: number;
  all_time_completed_trips: number;
  all_time_cancelled_trips: number;
}

export interface DashboardOverviewData {
  filter: DashboardOverviewFilter;
  drivers: DashboardDriverStats;
  customers: DashboardCustomerStats;
  trips: DashboardTripStats;
}

export interface DashboardOverviewResponse {
  status: boolean;
  message: string;
  data: DashboardOverviewData;
}

export interface DashboardFilterParams {
  start_date?: string;
  end_date?: string;
}
