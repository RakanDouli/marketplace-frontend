import { create } from "zustand";
import { cachedGraphQLRequest } from "../../utils/graphql-cache";
import { GET_ATTRIBUTES_BY_CATEGORY } from "./createListing.gql";
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
          (!formData.allowBidding || formData.biddingStartPrice)
        );
        break;

      case "images":
        isValid = formData.images.length >= 3;
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
      console.error("❌ Error fetching attributes:", error);
      set({ error: error.message || "فشل تحميل الخصائص" });
    } finally {
      set({ isLoadingAttributes: false });
    }
  },

  // ===== GENERATE DYNAMIC STEPS =====
  generateSteps: () => {
    const { attributes } = get();

    const groupsMap = new Map<string, Attribute[]>();
    attributes.forEach((attr) => {
      if (["search", "title", "description", "price"].includes(attr.key))
        return;
      const groupName = attr.group || "other";
      if (!groupsMap.has(groupName)) groupsMap.set(groupName, []);
      groupsMap.get(groupName)!.push(attr);
    });

    groupsMap.forEach((attrs) =>
      attrs.sort((a, b) => a.sortOrder - b.sortOrder)
    );

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

    const steps: Step[] = [
      {
        id: "basic",
        type: "basic",
        title: "المعلومات الأساسية",
        isValid: false,
      },
      { id: "images", type: "images", title: "الصور", isValid: false },
      ...attributeGroups.map((group, i) => ({
        id: `group-${i}`,
        type: "attribute_group" as const,
        title: group.name,
        isValid: false,
        attributeGroup: group,
      })),
      {
        id: "location_review",
        type: "location_review",
        title: "الموقع والمراجعة",
        isValid: false,
      },
    ];

    set({ steps, attributeGroups });
  },

  // ===== SUBMIT LISTING =====
  submitListing: async () => {
    const { formData, validateStep, steps } = get();
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        set({ error: `يرجى ملء جميع الحقول المطلوبة في الخطوة ${i + 1}` });
        return;
      }
    }

    set({ isSubmitting: true, error: null });
    try {
      console.log("Submitting listing:", formData);
      // TODO: replace with actual backend mutation
      throw new Error("Submission not yet implemented");
    } catch (error: any) {
      console.error("❌ Error submitting listing:", error);
      set({ error: error.message || "فشل إنشاء الإعلان" });
    } finally {
      set({ isSubmitting: false });
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
