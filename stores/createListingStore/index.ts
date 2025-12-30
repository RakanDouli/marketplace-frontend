import { create } from "zustand";
import { cachedGraphQLRequest, invalidateGraphQLCache } from "../../utils/graphql-cache";
import { GET_ATTRIBUTES_BY_CATEGORY } from "./createListing.gql";
import { ListingValidationConfig } from "../../lib/validation/listingValidation";
import { uploadMultipleToCloudflare } from "@/utils/cloudflare-upload";
import type {
  CreateListingStore,
  CreateListingFormData,
  Attribute,
  AttributeGroup,
  Step,
} from "./types";

// ===== INITIAL FORM DATA =====
const initialFormData: CreateListingFormData = {
  categoryId: "",
  title: "",
  description: "",
  priceMinor: 0,
  allowBidding: false,
  biddingStartPrice: undefined,
  images: [],
  video: [], // Video upload (max 1 video)
  specs: {},
  location: {
    province: "",
    city: "",
    area: "",
    link: "",
  },
};

// ===== INITIAL STEPS =====
const initialSteps: Step[] = [
  {
    id: "basic",
    type: "basic",
    title: "المعلومات الأساسية",
    isValid: false,
  },
  {
    id: "images",
    type: "images",
    title: "الصور",
    isValid: false,
  },
  {
    id: "location_review",
    type: "location_review",
    title: "الموقع والمراجعة",
    isValid: false,
  },
];

// ===== STORE =====
export const useCreateListingStore = create<CreateListingStore>((set, get) => ({
  // State
  formData: initialFormData,
  currentStep: 0,
  steps: initialSteps,
  attributes: [],
  attributeGroups: [],
  isLoadingAttributes: false,
  isSubmitting: false,
  error: null,

  // ===== FORM FIELD UPDATERS =====
  setFormField: (field, value) => {
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    }));
    setTimeout(() => get().validateCurrentStep(), 0);
  },

  setSpecField: (key, value) => {
    set((state) => ({
      formData: {
        ...state.formData,
        specs: { ...state.formData.specs, [key]: value },
      },
    }));
    setTimeout(() => get().validateCurrentStep(), 0);
  },

  setLocationField: (field, value) => {
    set((state) => ({
      formData: {
        ...state.formData,
        location: { ...state.formData.location, [field]: value },
      },
    }));
    setTimeout(() => get().validateCurrentStep(), 0);
  },

  // ===== STEP NAVIGATION =====
  goToStep: (stepIndex) => {
    const { steps } = get();
    if (stepIndex >= 0 && stepIndex < steps.length)
      set({ currentStep: stepIndex });
  },

  nextStep: () => {
    const { currentStep, steps, validateCurrentStep } = get();
    if (!validateCurrentStep()) return;
    if (currentStep < steps.length - 1) set({ currentStep: currentStep + 1 });
  },

  previousStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) set({ currentStep: currentStep - 1 });
  },

  // ===== VALIDATION =====
  validateCurrentStep: () => {
    const { currentStep } = get();
    return get().validateStep(currentStep);
  },

  validateStep: (stepIndex) => {
    const { steps, formData } = get();
    const step = steps[stepIndex];
    if (!step) return false;

    let isValid = false;

    switch (step.type) {
      case "basic":
        isValid = !!(
          formData.categoryId &&
          formData.title.trim() &&
          formData.priceMinor > 0 &&
          (!formData.allowBidding || (formData.biddingStartPrice !== undefined && formData.biddingStartPrice !== null && formData.biddingStartPrice >= 0))
        );
        break;

      case "images":
        isValid = formData.images.length >= ListingValidationConfig.images.min;
        break;

      case "attribute_group":
        if (step.attributeGroup) {
          isValid = step.attributeGroup.attributes.every((attr) => {
            if (attr.validation !== "REQUIRED") return true;
            const value = formData.specs[attr.key];
            if (Array.isArray(value)) return value.length > 0;
            return value !== undefined && value !== null && value !== "";
          });
        }
        break;

      case "location_review":
        isValid = !!formData.location.province;
        break;

      default:
        isValid = true;
    }

    set((state) => ({
      steps: state.steps.map((s, i) =>
        i === stepIndex ? { ...s, isValid } : s
      ),
    }));

    return isValid;
  },

  // ===== FETCH ATTRIBUTES =====
  fetchAttributes: async (categoryId) => {
    set({ isLoadingAttributes: true, error: null });

    try {
      const data = await cachedGraphQLRequest(GET_ATTRIBUTES_BY_CATEGORY, {
        categoryId,
      });
      const attributes: Attribute[] =
        (data as any).getAttributesByCategory || [];

      set({ attributes });
      get().generateSteps();
    } catch (error: any) {
      set({ error: error.message || "فشل تحميل الخصائص" });
    } finally {
      set({ isLoadingAttributes: false });
    }
  },

  // ===== GENERATE DYNAMIC STEPS =====
  generateSteps: () => {
    const { attributes, steps: currentSteps } = get();

    // Group attributes by group name
    const groupsMap = new Map<string, Attribute[]>();
    attributes.forEach((attr) => {
      if (["search", "title", "description", "price"].includes(attr.key))
        return;
      const groupName = attr.group || "other";
      if (!groupsMap.has(groupName)) groupsMap.set(groupName, []);
      groupsMap.get(groupName)!.push(attr);
    });

    // Sort attributes within each group
    groupsMap.forEach((attrs) =>
      attrs.sort((a, b) => a.sortOrder - b.sortOrder)
    );

    // Create attribute groups
    const attributeGroups: AttributeGroup[] = [];
    groupsMap.forEach((attrs, name) => {
      if (attrs.length && name !== "other") {
        attributeGroups.push({
          name,
          groupOrder: attrs[0].groupOrder,
          attributes: attrs,
        });
      }
    });

    attributeGroups.sort((a, b) => a.groupOrder - b.groupOrder);

    // Create dynamic attribute steps
    const dynamicSteps: Step[] = attributeGroups.map((group, i) => ({
      id: `group-${i}`,
      type: "attribute_group" as const,
      title: group.name,
      isValid: false,
      attributeGroup: group,
    }));

    // Get existing basic and images steps (preserve their validation state)
    const basicStep = currentSteps.find(s => s.type === "basic") || {
      id: "basic",
      type: "basic" as const,
      title: "المعلومات الأساسية",
      isValid: false,
    };

    const imagesStep = currentSteps.find(s => s.type === "images") || {
      id: "images",
      type: "images" as const,
      title: "الصور",
      isValid: false,
    };

    const locationReviewStep = currentSteps.find(s => s.type === "location_review") || {
      id: "location_review",
      type: "location_review" as const,
      title: "الموقع والمراجعة",
      isValid: false,
    };

    // Build new steps array: basic -> images -> dynamic attributes -> location_review
    const steps: Step[] = [
      basicStep,
      imagesStep,
      ...dynamicSteps,
      locationReviewStep,
    ];

    set({ steps, attributeGroups });
  },

  // ===== UPLOAD IMAGES TO CLOUDFLARE (using unified utility) =====
  uploadImages: async (): Promise<string[]> => {
    const { formData } = get();

    // Filter out images that are already uploaded (no file, just URL)
    const filesToUpload = formData.images
      .filter(imageItem => imageItem.file)
      .map(imageItem => imageItem.file!);

    if (filesToUpload.length === 0) {
      return [];
    }

    try {
      // Upload all images in parallel using unified utility
      const imageKeys = await uploadMultipleToCloudflare(filesToUpload, 'image');
      return imageKeys;
    } catch (error: any) {
      throw new Error(`فشل رفع الصور: ${error.message}`);
    }
  },

  // ===== SUBMIT LISTING =====
  submitListing: async () => {
    const { formData, validateStep, steps } = get();

    // Validate all steps
    for (let i = 0; i < steps.length; i++) {
      const isValid = validateStep(i);
      if (!isValid) {
        const errorMsg = `يرجى ملء جميع الحقول المطلوبة في الخطوة ${i + 1}`;
        set({ error: errorMsg });
        return;
      }
    }

    set({ isSubmitting: true, error: null });

    try {
      // Get auth token from user auth store (not Supabase session)
      const authData = localStorage.getItem('user-auth-storage');
      if (!authData) throw new Error("يرجى تسجيل الدخول أولاً");

      const { state } = JSON.parse(authData);
      const token = state?.user?.token;

      if (!token) throw new Error("يرجى تسجيل الدخول أولاً");

      // Extract brand/model names from specs
      const brandName = formData.specs._brandName || undefined;
      const modelName = formData.specs._modelName || undefined;

      // Build clean specs object (remove temp fields and temp IDs)
      const specs = { ...formData.specs };
      delete specs._brandName;
      delete specs._modelName;
      // Remove temp brandId/modelId (backend will create real ones)
      if (specs.brandId?.startsWith('temp_')) delete specs.brandId;
      if (specs.modelId?.startsWith('temp_')) delete specs.modelId;

      // Build FormData for REST API
      const formDataPayload = new FormData();
      formDataPayload.append('categoryId', formData.categoryId);
      formDataPayload.append('title', formData.title);
      if (formData.description) formDataPayload.append('description', formData.description);
      formDataPayload.append('priceMinor', formData.priceMinor.toString());
      formDataPayload.append('allowBidding', formData.allowBidding.toString());
      if (formData.allowBidding && formData.biddingStartPrice !== undefined && formData.biddingStartPrice !== null) {
        formDataPayload.append('biddingStartPrice', formData.biddingStartPrice.toString());
      }
      if (brandName) formDataPayload.append('brandName', brandName);
      if (modelName) formDataPayload.append('modelName', modelName);
      if (formData.location.province) formDataPayload.append('location', JSON.stringify(formData.location));
      formDataPayload.append('specs', JSON.stringify(specs));

      // Add images as files
      let imagesAdded = 0;
      formData.images.forEach((imageItem) => {
        if (imageItem.file) {
          formDataPayload.append('images', imageItem.file);
          imagesAdded++;
        }
      });

      if (imagesAdded < ListingValidationConfig.images.min) {
        throw new Error(`يجب إضافة ${ListingValidationConfig.images.min} صورة على الأقل`);
      }

      // Add video if present (max 1 video)
      console.log('📹 Video data:', formData.video);
      if (formData.video.length > 0 && formData.video[0].file) {
        console.log('📹 Appending video to FormData:', formData.video[0].file.name, formData.video[0].file.size);
        formDataPayload.append('video', formData.video[0].file);
      } else {
        console.log('📹 No video to append (length:', formData.video.length, ', file:', formData.video[0]?.file ? 'exists' : 'undefined', ')');
      }

      // Submit to REST API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT?.replace('/graphql', '')}/api/listings/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataPayload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'فشل إنشاء الإعلان');
      }

      const result = await response.json();

      // Invalidate user listings cache so the dashboard refreshes
      invalidateGraphQLCache('MyListings');

      set({ isSubmitting: false });
    } catch (error: any) {
      set({
        error: error.message || "فشل إنشاء الإعلان",
        isSubmitting: false,
      });
      throw error;
    }
  },

  // ===== RESET =====
  reset: () => {
    set({
      formData: initialFormData,
      currentStep: 0,
      steps: initialSteps,
      attributes: [],
      attributeGroups: [],
      isLoadingAttributes: false,
      isSubmitting: false,
      error: null,
    });
  },
}));
