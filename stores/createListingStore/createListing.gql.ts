// Query to get attributes for a category
export const GET_ATTRIBUTES_BY_CATEGORY = `
  query GetAttributesByCategory($categoryId: String!) {
    getAttributesByCategory(categoryId: $categoryId) {
      id
      key
      name
      type
      validation
      sortOrder
      group
      groupOrder
      storageType
      columnName
      isActive
      isGlobal
      isSystemCore
      canBeCustomized
      canBeDeleted
      requiredPermission
      showInGrid
      showInList
      showInDetail
      showInFilter
      options {
        id
        key
        value
        sortOrder
        isActive
        showInGrid
        showInList
        showInDetail
        showInFilter
      }
    }
  }
`;

// Query to get categories (for dropdown)
export const GET_CATEGORIES = `
  query GetCategories {
    categories {
      id
      slug
      name
      icon
      isActive
    }
  }
`;

// Get Cloudflare upload URL for listing images
export const CREATE_IMAGE_UPLOAD_URL_MUTATION = `
  mutation CreateImageUploadUrl {
    createImageUploadUrl {
      uploadUrl
      assetKey
    }
  }
`;

// ============ DRAFT LISTING QUERIES ============

// Get user's draft listing for a specific category
export const GET_MY_DRAFT_LISTING = `
  query MyDraftListing($categoryId: ID!) {
    myDraftListing(categoryId: $categoryId) {
      id
      title
      description
      priceMinor
      allowBidding
      biddingStartPrice
      listingType
      condition
      imageKeys
      videoUrl
      specs
      location {
        province
        city
        area
        link
      }
      status
      categoryId
      createdAt
      updatedAt
    }
  }
`;

// Get all user's draft listings (for "Continue Draft" feature)
export const GET_MY_DRAFTS = `
  query MyListings($status: ListingStatus) {
    myListings(status: $status) {
      id
      title
      description
      priceMinor
      imageKeys
      categoryId
      category {
        id
        name
        nameAr
        icon
      }
      createdAt
      updatedAt
    }
  }
`;

// Get a specific listing by ID (for resuming draft)
export const GET_MY_LISTING_BY_ID = `
  query MyListingById($id: ID!) {
    myListingById(id: $id) {
      id
      title
      description
      priceMinor
      allowBidding
      biddingStartPrice
      listingType
      condition
      imageKeys
      videoUrl
      specs
      location {
        province
        city
        area
        link
      }
      status
      categoryId
      category {
        id
        name
        nameAr
      }
      createdAt
      updatedAt
    }
  }
`;

// ============ DRAFT LISTING MUTATIONS ============

// Create a new draft listing
export const CREATE_DRAFT_LISTING = `
  mutation CreateDraftListing($categoryId: ID!) {
    createDraftListing(categoryId: $categoryId) {
      id
      title
      categoryId
      status
      createdAt
    }
  }
`;

// Update draft with form data (auto-save)
export const UPDATE_DRAFT_LISTING = `
  mutation UpdateDraftListing($input: UpdateDraftInput!) {
    updateDraftListing(input: $input) {
      id
      title
      description
      priceMinor
      allowBidding
      biddingStartPrice
      listingType
      condition
      specs
      location {
        province
        city
        area
        link
      }
      updatedAt
    }
  }
`;

// Add image to draft
export const ADD_IMAGE_TO_DRAFT = `
  mutation AddImageToDraft($draftId: ID!, $imageKey: String!, $position: Int) {
    addImageToDraft(draftId: $draftId, imageKey: $imageKey, position: $position) {
      id
      imageKeys
    }
  }
`;

// Remove image from draft (also deletes from Cloudflare)
export const REMOVE_IMAGE_FROM_DRAFT = `
  mutation RemoveImageFromDraft($draftId: ID!, $imageKey: String!) {
    removeImageFromDraft(draftId: $draftId, imageKey: $imageKey) {
      id
      imageKeys
    }
  }
`;

// Add video to draft
export const ADD_VIDEO_TO_DRAFT = `
  mutation AddVideoToDraft($draftId: ID!, $videoUrl: String!) {
    addVideoToDraft(draftId: $draftId, videoUrl: $videoUrl) {
      id
      videoUrl
    }
  }
`;

// Remove video from draft (also deletes from R2)
export const REMOVE_VIDEO_FROM_DRAFT = `
  mutation RemoveVideoFromDraft($draftId: ID!) {
    removeVideoFromDraft(draftId: $draftId) {
      id
      videoUrl
    }
  }
`;

// Delete draft and all media
export const DELETE_DRAFT = `
  mutation DeleteDraft($draftId: ID!) {
    deleteDraft(draftId: $draftId)
  }
`;

// Submit draft - changes status to PENDING_APPROVAL
export const CREATE_MY_LISTING_MUTATION = `
  mutation CreateMyListing($input: CreateListingInput!) {
    createMyListing(input: $input) {
      id
      title
      description
      priceMinor
      allowBidding
      biddingStartPrice
      listingType
      condition
      imageKeys
      videoUrl
      location {
        province
        city
        area
        link
      }
      status
      createdAt
    }
  }
`;

// ============ BRANDS & MODELS ============

// Query to get brands by category
export const GET_BRANDS_QUERY = `
  query GetBrands($categoryId: String!) {
    brands(categoryId: $categoryId) {
      id
      name
      slug
      isActive
    }
  }
`;

// Query to get models by brand
export const GET_MODELS_QUERY = `
  query GetModels($brandId: String!) {
    models(brandId: $brandId) {
      id
      name
      slug
      isActive
    }
  }
`;

// Query to get auto-fill suggestions for brand + model + year
export const GET_MODEL_SUGGESTION_QUERY = `
  query GetModelSuggestion($brandId: String!, $modelId: String!, $year: Int) {
    getModelSuggestion(brandId: $brandId, modelId: $modelId, year: $year) {
      id
      brandId
      modelId
      year
      specs
    }
  }
`;
