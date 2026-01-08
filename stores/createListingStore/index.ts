import { create } from "zustand";
import { cachedGraphQLRequest, invalidateGraphQLCache } from "../../utils/graphql-cache";
import { uploadToCloudflare, uploadVideoToR2 } from "@/utils/cloudflare-upload";
import {
  GET_ATTRIBUTES_BY_CATEGORY,
  GET_MY_DRAFTS,
  GET_MY_LISTING_BY_ID,
  CREATE_DRAFT_LISTING,
  UPDATE_DRAFT_LISTING,
  ADD_IMAGE_TO_DRAFT,
  REMOVE_IMAGE_FROM_DRAFT,
  ADD_VIDEO_TO_DRAFT,
  REMOVE_VIDEO_FROM_DRAFT,
  DELETE_DRAFT,
  CREATE_MY_LISTING_MUTATION,
} from "./createListing.gql";
import { ListingValidationConfig } from "../../lib/validation/listingValidation";
import type {
  CreateListingStore,
  CreateListingFormData,
  Attribute,
  AttributeGroup,
  Step,
  DraftListing,
} from "./types";

// ===== INITIAL FORM DATA =====
const initialFormData: CreateListingFormData = {
  categoryId: "",
  title: "",
  description: "",
  priceMinor: 0,
  allowBidding: false,
  biddingStartPrice: undefined,
  listingType: "",
  condition: "",
  images: [],
  video: [],
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
  // Draft state
  draftId: null,
  isDraftSaving: false,
  lastSavedAt: null,
  isCreatingDraft: false,

  // Draft listings for "Continue" feature
  myDrafts: [],
  isLoadingDrafts: false,

  // Form state
  formData: initialFormData,
  currentStep: 0,
  steps: initialSteps,
  attributes: [],
  attributeGroups: [],
  isLoadingAttributes: false,
  isSubmitting: false,
  error: null,

  // ===== DRAFT ACTIONS =====

  /**
   * Set category and fetch attributes - NO database draft yet
   * Draft is only created when first media is uploaded (lazy creation)
   */
  setCategory: async (categoryId: string): Promise<void> => {
    set({
      formData: { ...get().formData, categoryId },
      error: null,
    });

    // Fetch attributes for this category
    await get().fetchAttributes(categoryId);
  },

  /**
   * Internal helper: Create draft in database only when needed
   * Called automatically before first media upload
   * Also saves all current form data to the draft immediately
   */
  ensureDraftExists: async (): Promise<string | null> => {
    const { draftId, formData, isCreatingDraft } = get();

    // Already have a draft
    if (draftId) return draftId;

    // Already creating one (prevent race condition)
    if (isCreatingDraft) return null;

    // Need a category first
    if (!formData.categoryId) {
      set({ error: "يرجى اختيار الفئة أولاً" });
      return null;
    }

    set({ isCreatingDraft: true });

    try {
      // 1. Create the draft
      const data = await cachedGraphQLRequest(
        CREATE_DRAFT_LISTING,
        { categoryId: formData.categoryId },
        { ttl: 0 }
      );
      const draft = (data as any).createDraftListing;
      const newDraftId = draft.id;

      set({
        draftId: newDraftId,
        isCreatingDraft: false,
        error: null,
      });

      // 2. Immediately save all current form data to the draft
      // This ensures title, price, specs, etc. are not lost
      await cachedGraphQLRequest(
        UPDATE_DRAFT_LISTING,
        {
          input: {
            draftId: newDraftId,
            title: formData.title || undefined,
            description: formData.description || undefined,
            priceMinor: formData.priceMinor || undefined,
            listingType: formData.listingType || undefined,
            condition: formData.condition || undefined,
            allowBidding: formData.allowBidding,
            biddingStartPrice: formData.biddingStartPrice,
            specs: Object.keys(formData.specs).length > 0 ? formData.specs : undefined,
            location: formData.location.province ? formData.location : undefined,
          },
        },
        { ttl: 0 }
      );

      set({ lastSavedAt: new Date() });

      return newDraftId;
    } catch (error: any) {
      console.error('Error creating draft:', error);
      set({ error: error.message || "فشل إنشاء المسودة", isCreatingDraft: false });
      return null;
    }
  },

  /**
   * Load existing draft by ID (for "Continue" feature)
   */
  loadDraft: async (draftId: string): Promise<void> => {
    try {
      const data = await cachedGraphQLRequest(
        GET_MY_LISTING_BY_ID,
        { id: draftId },
        { ttl: 0 }
      );
      const draft = (data as any).myListingById as DraftListing;

      if (!draft || draft.status.toUpperCase() !== 'DRAFT') {
        set({ error: "المسودة غير موجودة أو تم إرسالها" });
        return;
      }

      // Convert backend imageKeys to ImageItem format
      const images = (draft.imageKeys || []).map((key: string) => ({
        id: key,
        url: `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH}/${key}/public`,
        file: undefined,
      }));

      // Convert videoUrl to ImageItem format
      const video = draft.videoUrl ? [{
        id: draft.videoUrl,
        url: draft.videoUrl,
        file: undefined,
        isVideo: true,
      }] : [];

      // Parse specs - backend returns JSON string, we need object
      let parsedSpecs: Record<string, any> = {};
      if (draft.specs) {
        try {
          parsedSpecs = typeof draft.specs === 'string' ? JSON.parse(draft.specs) : draft.specs;
        } catch (e) {
          console.error('Error parsing specs:', e);
          parsedSpecs = {};
        }
      }

      // Backend returns enum values in UPPERCASE (e.g., "RENT", "USED_LIKE_NEW")
      // Frontend dropdowns expect lowercase (e.g., "rent", "used_like_new")
      const listingType = draft.listingType ? draft.listingType.toLowerCase() : "";
      const condition = draft.condition ? draft.condition.toLowerCase() : "";

      set({
        draftId: draft.id,
        formData: {
          categoryId: draft.categoryId,
          title: draft.title || "",
          description: draft.description || "",
          priceMinor: draft.priceMinor || 0,
          allowBidding: draft.allowBidding || false,
          biddingStartPrice: draft.biddingStartPrice ?? undefined,
          listingType,
          condition,
          images,
          video,
          specs: parsedSpecs,
          location: {
            province: draft.location?.province || "",
            city: draft.location?.city || "",
            area: draft.location?.area || "",
            link: draft.location?.link || "",
          },
        },
        error: null,
      });

      // Fetch attributes for this category
      await get().fetchAttributes(draft.categoryId);
    } catch (error: any) {
      console.error('Error loading draft:', error);
      set({ error: error.message || "فشل تحميل المسودة" });
    }
  },

  /**
   * Fetch all user's draft listings (for dashboard "Continue Draft" cards)
   */
  fetchMyDrafts: async (): Promise<void> => {
    set({ isLoadingDrafts: true });

    try {
      const data = await cachedGraphQLRequest(
        GET_MY_DRAFTS,
        { status: 'DRAFT' },
        { ttl: 0 }
      );
      const drafts = (data as any).myListings || [];
      set({ myDrafts: drafts, isLoadingDrafts: false });
    } catch (error: any) {
      console.error('Error fetching drafts:', error);
      set({ myDrafts: [], isLoadingDrafts: false });
    }
  },

  /**
   * Save form data to draft (auto-save)
   * Only saves if draft already exists - draft creation happens via image/video upload
   * All form data is stored locally in Zustand, this just syncs to backend
   */
  saveDraft: async (): Promise<void> => {
    const { isDraftSaving, draftId, formData } = get();

    // Only save if we have a draft and not already saving
    if (!draftId || isDraftSaving) return;

    set({ isDraftSaving: true });

    try {
      await cachedGraphQLRequest(
        UPDATE_DRAFT_LISTING,
        {
          input: {
            draftId,
            title: formData.title || undefined,
            description: formData.description || undefined,
            priceMinor: formData.priceMinor || undefined,
            listingType: formData.listingType || undefined,
            condition: formData.condition || undefined,
            allowBidding: formData.allowBidding,
            biddingStartPrice: formData.biddingStartPrice,
            specs: Object.keys(formData.specs).length > 0 ? formData.specs : undefined,
            location: formData.location.province ? formData.location : undefined,
          },
        },
        { ttl: 0 }
      );

      set({ isDraftSaving: false, lastSavedAt: new Date() });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      set({ isDraftSaving: false });
    }
  },

  /**
   * Delete draft and all associated media
   */
  deleteDraft: async (): Promise<boolean> => {
    const { draftId } = get();
    if (!draftId) return false;

    try {
      await cachedGraphQLRequest(DELETE_DRAFT, { draftId }, { ttl: 0 });
      get().reset();
      return true;
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      set({ error: error.message || "فشل حذف المسودة" });
      return false;
    }
  },

  // ===== IMAGE/VIDEO ACTIONS =====

  /**
   * Upload image to Cloudflare and add to draft
   * Creates draft lazily on first upload (no wasted API calls)
   */
  uploadAndAddImage: async (file: File, position?: number): Promise<string | null> => {
    const { formData } = get();

    // Ensure we have a category
    if (!formData.categoryId) {
      set({ error: "يرجى اختيار الفئة أولاً" });
      return null;
    }

    try {
      // 1. Upload to Cloudflare FIRST (before creating draft)
      const imageKey = await uploadToCloudflare(file, 'image');

      // 2. Ensure draft exists (creates if needed - lazy creation)
      const draftId = await get().ensureDraftExists();
      if (!draftId) {
        // Failed to create draft - image is orphaned but will be cleaned up
        throw new Error("فشل إنشاء المسودة");
      }

      // 3. Add to draft in backend
      await cachedGraphQLRequest(
        ADD_IMAGE_TO_DRAFT,
        {
          draftId,
          imageKey,
          position,
        },
        { ttl: 0 }
      );

      // 4. Update local state with new image
      const newImage = {
        id: imageKey,
        url: `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH}/${imageKey}/public`,
        file: undefined,
      };

      // Insert at position or append
      const currentFormData = get().formData;
      const newImages = [...currentFormData.images];
      if (position !== undefined && position >= 0 && position <= newImages.length) {
        newImages.splice(position, 0, newImage);
      } else {
        newImages.push(newImage);
      }

      set({
        formData: { ...currentFormData, images: newImages },
      });

      return imageKey;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      set({ error: error.message || "فشل رفع الصورة" });
      return null;
    }
  },

  /**
   * Remove image from draft (also deletes from Cloudflare)
   */
  removeImage: async (imageKey: string): Promise<void> => {
    const { draftId, formData } = get();
    if (!draftId) return;

    try {
      await cachedGraphQLRequest(
        REMOVE_IMAGE_FROM_DRAFT,
        {
          draftId,
          imageKey,
        },
        { ttl: 0 }
      );

      // Update local state
      set({
        formData: {
          ...formData,
          images: formData.images.filter(img => img.id !== imageKey),
        },
      });
    } catch (error: any) {
      console.error('Error removing image:', error);
      set({ error: error.message || "فشل حذف الصورة" });
    }
  },

  /**
   * Upload video to R2 via REST API and add to draft
   * Creates draft lazily on first upload (no wasted API calls)
   */
  uploadAndAddVideo: async (file: File): Promise<string | null> => {
    const { formData } = get();

    // Ensure we have a category
    if (!formData.categoryId) {
      set({ error: "يرجى اختيار الفئة أولاً" });
      return null;
    }

    try {
      // 1. Upload video to R2 FIRST (before creating draft)
      const videoUrl = await uploadVideoToR2(file);

      // 2. Ensure draft exists (creates if needed - lazy creation)
      const draftId = await get().ensureDraftExists();
      if (!draftId) {
        // Failed to create draft - video is orphaned but will be cleaned up
        throw new Error("فشل إنشاء المسودة");
      }

      // 3. Add video URL to draft
      await cachedGraphQLRequest(
        ADD_VIDEO_TO_DRAFT,
        {
          draftId,
          videoUrl,
        },
        { ttl: 0 }
      );

      // 4. Update local state
      const currentFormData = get().formData;
      set({
        formData: {
          ...currentFormData,
          video: [{
            id: videoUrl,
            url: videoUrl,
            file: undefined,
            isVideo: true,
          }],
        },
      });

      return videoUrl;
    } catch (error: any) {
      console.error('Error uploading video:', error);
      set({ error: error.message || "فشل رفع الفيديو" });
      return null;
    }
  },

  /**
   * Remove video from draft (also deletes from R2)
   */
  removeVideo: async (): Promise<void> => {
    const { draftId, formData } = get();
    if (!draftId) return;

    try {
      await cachedGraphQLRequest(REMOVE_VIDEO_FROM_DRAFT, { draftId }, { ttl: 0 });

      // Update local state
      set({
        formData: {
          ...formData,
          video: [],
        },
      });
    } catch (error: any) {
      console.error('Error removing video:', error);
      set({ error: error.message || "فشل حذف الفيديو" });
    }
  },

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

  // ===== SUBMIT LISTING =====
  submitListing: async () => {
    const { draftId, formData, validateStep, steps } = get();

    if (!draftId) {
      set({ error: "لم يتم إنشاء مسودة. يرجى اختيار الفئة أولاً." });
      return;
    }

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
      // Extract brand/model names from specs
      const brandName = formData.specs._brandName || undefined;
      const modelName = formData.specs._modelName || undefined;

      // Build clean specs object (remove temp fields)
      const specs = { ...formData.specs };
      delete specs._brandName;
      delete specs._modelName;
      if (specs.brandId?.startsWith('temp_')) delete specs.brandId;
      if (specs.modelId?.startsWith('temp_')) delete specs.modelId;

      // Submit draft via GraphQL mutation
      await cachedGraphQLRequest(
        CREATE_MY_LISTING_MUTATION,
        {
          input: {
            draftId,
            categoryId: formData.categoryId,
            title: formData.title,
            description: formData.description || undefined,
            priceMinor: formData.priceMinor,
            allowBidding: formData.allowBidding,
            biddingStartPrice: formData.allowBidding ? formData.biddingStartPrice : undefined,
            listingType: formData.listingType || undefined,
            condition: formData.condition || undefined,
            brandName: brandName || undefined,
            modelName: modelName || undefined,
            specs: Object.keys(specs).length > 0 ? specs : undefined,
            location: formData.location.province ? formData.location : undefined,
          },
        },
        { ttl: 0 }
      );

      // Invalidate user listings cache so dashboard refreshes
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
      draftId: null,
      isDraftSaving: false,
      lastSavedAt: null,
      isCreatingDraft: false,
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
