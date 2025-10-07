// GraphQL queries and mutations for admin attributes management

// Categories queries
export const GET_CATEGORIES_QUERY = `
  query GetCategories {
    categories {
      id
      name
      nameAr
      slug
      isActive
      biddingEnabled
    }
  }
`;

export const CREATE_CATEGORY_MUTATION = `
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      nameAr
      slug
      isActive
      biddingEnabled
    }
  }
`;

export const UPDATE_CATEGORY_MUTATION = `
  mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      nameAr
      slug
      isActive
      biddingEnabled
    }
  }
`;

export const DELETE_CATEGORY_MUTATION = `
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

// Attributes queries
export const GET_CATEGORY_ATTRIBUTES_QUERY = `
  query GetAttributesByCategorySlug($categorySlug: String!) {
    getAttributesByCategorySlug(categorySlug: $categorySlug) {
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

export const GET_ALL_ATTRIBUTES_QUERY = `
  query GetAllAttributes {
    getAllAttributes {
      id
      key
      name
      type
      validation
      sortOrder
      group
      groupOrder
      categoryId
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

export const CREATE_ATTRIBUTE_MUTATION = `
  mutation CreateAttribute($input: CreateAttributeInput!) {
    createAttribute(input: $input) {
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

export const UPDATE_ATTRIBUTE_MUTATION = `
  mutation UpdateAttribute($input: UpdateAttributeInput!) {
    updateAttribute(input: $input) {
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

export const DELETE_ATTRIBUTE_MUTATION = `
  mutation DeleteAttribute($id: ID!) {
    deleteAttribute(id: $id)
  }
`;

export const UPDATE_ATTRIBUTE_ORDER_MUTATION = `
  mutation ReorderAttributes($input: ReorderAttributesInput!) {
    reorderAttributes(input: $input)
  }
`;

export const REORDER_ATTRIBUTES_MUTATION = UPDATE_ATTRIBUTE_ORDER_MUTATION;

export const UPDATE_ATTRIBUTE_FILTER_VISIBILITY_MUTATION = `
  mutation UpdateAttributeFilterVisibility($id: ID!, $showInFilter: Boolean!) {
    updateAttribute(input: { id: $id, showInFilter: $showInFilter }) {
      id
      showInFilter
    }
  }
`;

// Attribute options mutations
export const CREATE_ATTRIBUTE_OPTION_MUTATION = `
  mutation CreateAttributeOption($input: CreateAttributeOptionInput!) {
    createAttributeOption(input: $input) {
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
`;

export const UPDATE_ATTRIBUTE_OPTION_MUTATION = `
  mutation UpdateAttributeOption($id: ID!, $input: UpdateAttributeOptionInput!) {
    updateAttributeOption(id: $id, input: $input) {
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
`;

export const DELETE_ATTRIBUTE_OPTION_MUTATION = `
  mutation DeleteAttributeOption($id: ID!) {
    deleteAttributeOption(id: $id)
  }
`;