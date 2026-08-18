export interface IStaff {
  _id: string;
  rut: string;
  firstName: string;
  lastName: string;
  birthDate?: Date;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  contractType?: string;
  isActive?: boolean;
  roleId: any;
  positionId: any;
  isDeleted?: boolean;
}

export interface StaffRegistration {
  rut: string;
  firstName: string;
  lastName: string;
  birthDate?: Date;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  roleId: any;
  positionId?: any;
  contractType?: string;
  isActive?: boolean;
}
