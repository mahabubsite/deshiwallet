
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  dob: string;
  status: VerificationStatus;
  role: UserRole;
  profilePhoto?: string;
  createdAt: any;
  appPin?: string;
  pinProtectionEnabled?: boolean;
}

export interface BankCard {
  id: string;
  userId: string;
  bankName: string;
  holderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string; // Encrypted
  pin: string; // Encrypted
  paymentMethod: 'Visa' | 'MasterCard' | 'Amex';
  design: string;
  createdAt: any;
}

export interface VaultDocument {
  id: string;
  userId: string;
  title: string;
  category: string;
  fileUrl: string;
  notes: string;
  createdAt: any;
  metadata?: Record<string, string>;
}

export interface Notification {
  id: string;
  userId: string; // Can be 'global', 'admin_alert', or specific UID
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  imageUrl?: string;
  images?: string[]; // Array for multiple images/carousel
}
