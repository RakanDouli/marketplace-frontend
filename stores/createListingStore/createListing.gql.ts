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

// Create listing mutation
export const CREATE_MY_LISTING_MUTATION = `
  mutation CreateMyListing($input: CreateListingInput!) {
    createMyListing(input: $input) {
      id
      title
      description
      priceMinor
      allowBidding
      biddingStartPrice
      imageKeys
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
