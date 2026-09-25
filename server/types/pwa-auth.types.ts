export interface RequestOtpDTO {
  rut: string;
}

export interface RequestOtpResponseDTO {
  success: boolean;
  message: string;
  maskedPhone: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  deliveryStatus?: 'sent' | 'failed';
}

export interface VerifyOtpDTO {
  rut: string;
  otp: string;
}

export interface PwaStaffProfileDTO {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  contractType: 'PLANTA' | 'CONTRATA' | 'HONORARIO';
  positionId: string;
  positionName: string;
  estamento: 'MEDICO' | 'PROFESIONAL' | 'TECNICO' | 'ADMINISTRATIVO' | 'AUXILIAR';
}

export interface PwaAuthResponseDTO {
  success: boolean;
  message: string;
  data?: {
    staff: PwaStaffProfileDTO;
  };
}
