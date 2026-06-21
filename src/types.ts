export interface Device {
  id: string;
  studentId: string;
  hardwareId: string;
  department: string;
  os: string;
  osVersion: string;
  enrolledAt: string;
  complianceRating: number; // e.g. 4/6 or 6/6
  status: 'Pass' | 'Pending' | 'Fail';
}

export interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  status: 'Pass' | 'Pending' | 'Fail' | 'Scanning';
}

export interface SecurityCert {
  id: string;
  name: string;
  type: string;
  issuer: string;
  status: 'Valid' | 'Expired' | 'Revoked';
  expiresAt: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'error';
  message: string;
}
