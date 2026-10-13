export interface Brand {
  id: string;
  name: string;
  country: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Sku {
  id: string;
  productId: string;
  weight: string; // 3U, 4U, 5U
  gripSize: string; // G5, G6
  balancePointMm: number;
  stiffness: string;
  maxTensionLbs: number;
  price: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  brandId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  playerType: string;
  imageUrl: string;
  warrantyMonths: number;
  skus: Sku[];
  brand?: Brand;
}

export interface SecondHandUnit {
  id: string;
  serialNumber: string;
  modelName: string;
  grade: 'A' | 'B' | 'C' | 'D';
  conditionNotes: string;
  inspectionChecklist: Record<string, boolean>;
  images: string[];
  branchId: string;
  branchName: string;
  buybackPrice: number;
  resalePrice: number;
  warrantyDays: number;
  status: 'PURCHASED' | 'APPROVED_FOR_SALE' | 'RESERVED' | 'SOLD';
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'ADMIN' | 'BRANCH_MANAGER' | 'STAFF' | 'CUSTOMER';
  branchAssignments?: string[];
}
