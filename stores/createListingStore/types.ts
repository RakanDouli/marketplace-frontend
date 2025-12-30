import { ImageItem } from '@/components/slices/ImageUploadGrid/ImageUploadGrid';

// Match backend AttributeType enum
export type AttributeType =
  | 'TEXT'
  | 'NUMBER'
  | 'SELECTOR'
  | 'MULTI_SELECTOR'
  | 'RANGE'
  | 'CURRENCY'
  | 'TEXTAREA'
  | 'BOOLEAN';

export type AttributeValidation = 'REQUIRED' | 'OPTIONAL';

export interface AttributeOption {
  id: string;
  key: string;
  value: string; // Arabic
  sortOrder: number;
  isActive: boolean;
}

export interface Attribute {
  id: string;
  key: string;
  name: string; // Arabic
  type: AttributeType;
  validation: AttributeValidation;
  sortOrder: number;
  group: string | null;
  groupOrder: number;
  storageType: string; // "column" | "specs" | "location" - where the value is stored
  columnName: string | null; // Column name if storageType is "column"
  isActive: boolean;
  isGlobal: boolean;
  isSystemCore: boolean;
  canBeCustomized: boolean;
  canBeDeleted: boolean;
  requiredPermission: string;
  showInGrid: boolean;
  showInList: boolean;
  showInDetail: boolean;
  showInFilter: boolean;
  options: AttributeOption[];
  maxSelections?: number; // For MULTI_SELECTOR
}

export interface AttributeGroup {
  name: string;
  groupOrder: number;
  attributes: Attribute[];
}

// Step types
export type StepType = 'basic' | 'images' | 'attribute_group' | 'location_review';

export interface Step {
  id: string;
  type: StepType;
  title: string;
  isValid: boolean;
  attributeGroup?: AttributeGroup; // For dynamic attribute steps
}

// Form data structure
export interface CreateListingFormData {
  // Step 1: Basic Info
  categoryId: string;
  title: string;
  description: string;
  priceMinor: number; // USD dollars
  allowBidding: boolean;
  biddingStartPrice?: number;

  // Step 2: Images & Video
  images: ImageItem[];
  video: ImageItem[]; // Optional video upload (max 1 video, uses ImageItem for consistency)

  // Step 3-N: Dynamic specs from attributes
  specs: Record<string, any>;

  // Final Step: Location
  location: {
    province: string;
    city?: string;
    area?: string;
    link?: string;
  };
}

// Store state
export interface CreateListingStore {
  // Form data
  formData: CreateListingFormData;

  // Steps
  currentStep: number;
  steps: Step[];

  // Attributes from backend
  attributes: Attribute[];
  attributeGroups: AttributeGroup[];

  // Loading states
  isLoadingAttributes: boolean;
  isSubmitting: boolean;

  // Error handling
  error: string | null;

  // Actions
  setFormField: <K extends keyof CreateListingFormData>(
    field: K,
    value: CreateListingFormData[K]
  ) => void;
  setSpecField: (key: string, value: any) => void;
  setLocationField: (
    field: keyof CreateListingFormData['location'],
    value: string
  ) => void;

  // Step navigation
  goToStep: (stepIndex: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  // Validation
  validateCurrentStep: () => boolean;
  validateStep: (stepIndex: number) => boolean;

  // Attribute management
  fetchAttributes: (categoryId: string) => Promise<void>;
  generateSteps: () => void;

  // Image upload
  uploadImages: () => Promise<string[]>;

  // Submission
  submitListing: () => Promise<void>;

  // Reset
  reset: () => void;
}
