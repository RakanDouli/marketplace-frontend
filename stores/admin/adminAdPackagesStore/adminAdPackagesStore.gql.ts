// GraphQL queries and mutations for admin ad packages management

export const GET_ALL_AD_PACKAGES_QUERY = `
  query GetAllAdPackages {
    adPackages {
      id
      packageName
      description
      adType
      placement
      format
      dimensions {
        desktop {
          width
          height
        }
        mobile {
          width
          height
        }
      }
      durationDays
      impressionLimit
      basePrice
      currency
      isActive
      mediaRequirements
      includedPackages
      customDiscount
      createdAt
      updatedAt
    }
  }
`;

export const GET_AD_PACKAGE_BY_ID_QUERY = `
  query GetAdPackageById($id: ID!) {
    adPackage(id: $id) {
      id
      packageName
      description
      adType
      placement
      format
      dimensions {
        desktop {
          width
          height
        }
        mobile {
          width
          height
        }
      }
      durationDays
      impressionLimit
      basePrice
      currency
      isActive
      mediaRequirements
      includedPackages
      customDiscount
      createdAt
      updatedAt
    }
  }
`;

export const GET_ACTIVE_AD_PACKAGES_QUERY = `
  query GetActiveAdPackages {
    activeAdPackages {
      id
      packageName
      description
      adType
      placement
      format
      dimensions {
        desktop {
          width
          height
        }
        mobile {
          width
          height
        }
      }
      durationDays
      impressionLimit
      basePrice
      currency
      isActive
      mediaRequirements
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_AD_PACKAGE_MUTATION = `
  mutation CreateAdPackage($input: CreateAdPackageInput!) {
    createAdPackage(input: $input) {
      id
      packageName
      description
      adType
      placement
      format
      dimensions {
        desktop {
          width
          height
        }
        mobile {
          width
          height
        }
      }
      durationDays
      impressionLimit
      basePrice
      currency
      isActive
      mediaRequirements
      includedPackages
      customDiscount
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_AD_PACKAGE_MUTATION = `
  mutation UpdateAdPackage($input: UpdateAdPackageInput!) {
    updateAdPackage(input: $input) {
      id
      packageName
      description
      adType
      placement
      format
      dimensions {
        desktop {
          width
          height
        }
        mobile {
          width
          height
        }
      }
      durationDays
      impressionLimit
      basePrice
      currency
      isActive
      mediaRequirements
      includedPackages
      customDiscount
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_AD_PACKAGE_MUTATION = `
  mutation DeleteAdPackage($input: DeleteAdPackageInput!) {
    deleteAdPackage(input: $input)
  }
`;
