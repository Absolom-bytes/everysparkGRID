import { Device, ComplianceCheck, SecurityCert, SystemLog } from './types';

export const INITIAL_DEVICES: Device[] = [
  {
    id: 'ES-8829',
    studentId: 'STU-99482-BR',
    hardwareId: 'HW-ADR-90A81F2',
    department: 'K-12 General Education',
    os: 'Android 13',
    osVersion: 'Android 13.0.0_r82',
    enrolledAt: '2026-06-19 14:22:11',
    complianceRating: 6,
    status: 'Pass',
  },
  {
    id: 'ES-4412',
    studentId: 'STU-10492-MK',
    hardwareId: 'HW-ADR-77F6C1E',
    department: 'Higher Ed Technical',
    os: 'Android 12',
    osVersion: 'Android 12.1.0_r12',
    enrolledAt: '2026-06-20 09:33:05',
    complianceRating: 5,
    status: 'Pass',
  },
  {
    id: 'ES-3091',
    studentId: 'STU-30948-AB',
    hardwareId: 'HW-ADR-00B23AC',
    department: 'K-12 General Education',
    os: 'Android 11',
    osVersion: 'Android 11.0.0_r23 (Legacy)',
    enrolledAt: '2026-06-18 11:10:45',
    complianceRating: 3,
    status: 'Fail',
  },
  {
    id: 'ES-7128',
    studentId: 'STU-58392-ZX',
    hardwareId: 'HW-ADR-55E8D2C',
    department: 'Higher Ed Technical',
    os: 'Android 14',
    osVersion: 'Android 14.0.0_r4',
    enrolledAt: '2026-06-20 16:15:30',
    complianceRating: 6,
    status: 'Pass',
  }
];

export const INITIAL_COMPLIANCE_CHECKLIST: ComplianceCheck[] = [
  {
    id: 'os-ver',
    name: 'OS Version',
    description: 'Min Required: Android 12',
    status: 'Pass',
  },
  {
    id: 'root-integrity',
    name: 'Root Integrity',
    description: 'Hardware Attestation',
    status: 'Pass',
  },
  {
    id: 'storage-enc',
    name: 'Storage Encryption',
    description: 'AES-256 Check',
    status: 'Pass',
  },
  {
    id: 'secure-boot',
    name: 'Secure Boot',
    description: 'Verified Boot State',
    status: 'Pass',
  },
  {
    id: 'policy-controller',
    name: 'Policy Controller',
    description: 'DPC Profile Check',
    status: 'Pending',
  },
  {
    id: 'app-sandbox',
    name: 'App Sandbox',
    description: 'Isolation Layer Check',
    status: 'Pending',
  },
];

export const INITIAL_LOGS: SystemLog[] = [
  {
    id: 'log-1',
    timestamp: '09:44:21',
    level: 'success',
    message: 'SDK_INIT_SUCCESS: Android SDK wrapper loaded successfully',
  },
  {
    id: 'log-2',
    timestamp: '09:44:22',
    level: 'info',
    message: 'CERT_FETCH: OK - Retrieved active server-side cert hashes',
  },
  {
    id: 'log-3',
    timestamp: '09:44:23',
    level: 'info',
    message: 'PWA_PORTAL_SYNC: Local browser sandbox indexed and listening',
  },
];

export const INITIAL_CERTIFICATES: SecurityCert[] = [
  {
    id: 'cert-1',
    name: 'EverySpark Root Authority CA',
    type: 'Root CA',
    issuer: 'EverySpark Public Trust',
    status: 'Valid',
    expiresAt: '2029-12-31',
  },
  {
    id: 'cert-2',
    name: 'Hardware Attestation SubCA V3',
    type: 'Intermediate CA',
    issuer: 'Google Attestation Root',
    status: 'Valid',
    expiresAt: '2028-06-15',
  },
  {
    id: 'cert-3',
    name: 'Local Portal Client Certificate',
    type: 'Client Cert',
    issuer: 'EverySpark Root Authority CA',
    status: 'Valid',
    expiresAt: '2027-06-21',
  },
  {
    id: 'cert-4',
    name: 'Legacy OAuth RSA Keypair (Expired)',
    type: 'Signing Key',
    issuer: 'Self-Signed Legacy',
    status: 'Expired',
    expiresAt: '2026-01-01',
  }
];
