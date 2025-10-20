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
