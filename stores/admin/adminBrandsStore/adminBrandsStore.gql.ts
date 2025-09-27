// Categories queries
export const GET_CATEGORIES_QUERY = `
  query GetCategories {
    categories {
      id
      slug
      name
      nameAr
      isActive
      biddingEnabled
      createdAt
      updatedAt
    }
  }
`;

// Brands queries and mutations
export const GET_BRANDS_QUERY = `
  query GetBrands($categoryId: String!, $q: String, $limit: Int, $offset: Int) {
    brands(categoryId: $categoryId, q: $q, limit: $limit, offset: $offset) {
      id
      categoryId
      name
      slug
      externalId
      source
      status
      isActive
      createdAt
      updatedAt
      modelsCount
    }
  }
`;

export const GET_BRANDS_COUNT_QUERY = `
  query GetBrandsCount($categoryId: String!, $q: String) {
    brandsCount(categoryId: $categoryId, q: $q)
  }
`;

export const CREATE_BRAND_MUTATION = `
  mutation CreateBrand($input: UpsertBrandInput!) {
    upsertBrand(input: $input) {
      id
      categoryId
      name
      slug
      externalId
      source
      status
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_BRAND_MUTATION = `
  mutation UpdateBrand($input: UpsertBrandInput!) {
    upsertBrand(input: $input) {
      id
      categoryId
      name
      slug
      externalId
      source
      status
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_BRAND_MUTATION = `
  mutation DeleteBrand($id: String!) {
    deleteBrand(id: $id)
  }
`;

// Models queries and mutations
export const GET_MODELS_QUERY = `
  query GetModels($brandId: String!, $q: String) {
    models(brandId: $brandId, q: $q) {
      id
      brandId
      name
      slug
      externalId
      source
      status
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_MODEL_MUTATION = `
  mutation CreateModel($input: UpsertModelInput!) {
    upsertModel(input: $input) {
      id
      brandId
      name
      slug
      externalId
      source
      status
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_MODEL_MUTATION = `
  mutation UpdateModel($input: UpsertModelInput!) {
    upsertModel(input: $input) {
      id
      brandId
      name
      slug
      externalId
      source
      status
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_MODEL_MUTATION = `
  mutation DeleteModel($id: String!) {
    deleteModel(id: $id)
  }
`;

// Sync catalog mutation
export const SYNC_CATALOG_MUTATION = `
  mutation SyncCatalogNow {
    syncCatalogNow
  }
`;

// Alias mutations
export const ADD_BRAND_ALIAS_MUTATION = `
  mutation AddBrandAlias($input: AddAliasInput!) {
    addBrandAlias(input: $input)
  }
`;

export const ADD_MODEL_ALIAS_MUTATION = `
  mutation AddModelAlias($input: AddAliasInput!) {
    addModelAlias(input: $input)
  }
`;

// Extended brand query with models count (for future use)
export const GET_BRANDS_WITH_MODELS_COUNT_QUERY = `
  query GetBrandsWithModelsCount($categoryId: String!, $q: String) {
    brands(categoryId: $categoryId, q: $q) {
      id
      categoryId
      name
      slug
      externalId
      source
      status
      isActive
      createdAt
      updatedAt
      # modelsCount would need to be added as a resolver field in backend
    }
  }
`;

// For future: Get brand with its models
export const GET_BRAND_WITH_MODELS_QUERY = `
  query GetBrandWithModels($brandId: String!) {
    # This would need a new resolver in backend
    brandWithModels(id: $brandId) {
      id
      categoryId
      name
      slug
      externalId
      source
      status
      isActive
      createdAt
      updatedAt
      models {
        id
        name
        slug
        externalId
        source
        status
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

// Category attributes (already exists in catalog resolver)
export const GET_CATEGORY_ATTRIBUTES_QUERY = `
  query GetCategoryAttributes($categoryId: String!) {
    categoryAttributes(categoryId: $categoryId) {
      id
      key
      name
      type
      options {
        value
        label
      }
    }
  }
`;