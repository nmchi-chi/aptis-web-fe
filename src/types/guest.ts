export interface Guest {
  id: number;
  fullname: string;
  phone_number: string;
  is_called: boolean;
}

export interface GuestListResponse {
  items: Guest[];
  total: number;
  total_pages: number | null;
}

export interface GuestListParams {
  page?: number;
  limit?: number;
}
