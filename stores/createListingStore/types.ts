import { ImageItem } from '@/components/slices/ImageUploadGrid/ImageUploadGrid';

// Match backend AttributeType enum
export type AttributeType =
  | 'TEXT'
  | 'NUMBER'
  | 'SELECTOR'
  | 'MULTI_SELECTOR'
  | 'RANGE'
  | 'RANGE_SELECTOR'
  | 'CURRENCY'
  | 'TEXTAREA'
  | 'BOOLEAN'
  | 'DATE_RANGE';

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

// Draft listing from backend
export interface DraftListing {
  id: string;
  title: string;
  description: string | null;
  priceMinor: number;
  allowBidding: boolean;
  biddingStartPrice: number | null;
  listingType: string | null;
  condition: string | null;
  imageKeys: string[];
  videoUrl: string | null;
  specs: Record<string, any>;
  location: {
    province?: string;
    city?: string;
    area?: string;
    link?: string;
  } | null;
  status: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    nameAr: string;
    icon?: string;
  };
  createdAt: string;
  updatedAt: string;
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
  // Column-stored global attributes
  listingType: string; // "sale" | "rent"
  condition: string; // "new" | "used_like_new" | "used"

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
  // Draft state
  draftId: string | null;
  isDraftSaving: boolean;
  lastSavedAt: Date | null;
  isCreatingDraft: boolean;

  // Draft listings for "Continue" feature
  myDrafts: DraftListing[];
  isLoadingDrafts: boolean;

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

  // ===== DRAFT ACTIONS =====

  // Set category and fetch attributes (NO database draft yet - lazy creation)
  setCategory: (categoryId: string) => Promise<void>;

  // Internal: Create draft only when needed (first media upload)
  ensureDraftExists: () => Promise<string | null>;

  // Load existing draft by ID (for "Continue" feature)
  loadDraft: (draftId: string) => Promise<void>;

  // Load all user's drafts (for dashboard "Continue Draft" cards)
  fetchMyDrafts: () => Promise<void>;

  // Auto-save form data to draft (only if draft exists)
  saveDraft: () => Promise<void>;

  // Delete draft and all media
  deleteDraft: () => Promise<boolean>;

  // ===== IMAGE/VIDEO ACTIONS =====

  // Upload and add image to draft
  uploadAndAddImage: (file: File, position?: number) => Promise<string | null>;

  // Remove image from draft (also deletes from Cloudflare)
  removeImage: (imageKey: string) => Promise<void>;

  // Upload and add video to draft (via REST API)
  uploadAndAddVideo: (file: File) => Promise<string | null>;

  // Remove video from draft (also deletes from R2)
  removeVideo: () => Promise<void>;

  // ===== FORM FIELD UPDATERS =====
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

  // Submission (submits draft to PENDING_APPROVAL)
  submitListing: () => Promise<void>;

  // Reset
  reset: () => void;
}
