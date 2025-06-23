export enum RoleEnum {
  Admin = 'admin',
  Member = 'member',
}

export interface User {
  id: number;
  username: string;
  fullname: string;
  phone_number: string;
  role: RoleEnum;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RawUserApiResponse {
  id: number;
  username: string;
  fullname: string;
  phone_number: string | null;
  role: RoleEnum;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserDto {
  username: string;
  fullname: string;
  password: string;
  phone_number: string;
}

export interface UpdateUserDto {
  fullname?: string;
  password?: string;
  phone_number?: string;
}

export interface UserListResponse {
  items: RawUserApiResponse[];
  total: number;
  limit: number;
  skip: number;
} 