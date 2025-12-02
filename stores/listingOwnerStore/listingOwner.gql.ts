// GraphQL queries for listing owner data

export const GET_OWNER_DATA_QUERY = `
  query GetOwnerData($userId: ID!) {
    userById(id: $userId) {
      id
      name
      companyName
      email
      phone
      contactPhone
      phoneIsWhatsApp
      showPhone
      showContactPhone
      website
      avatar
      accountType
      businessVerified
      accountBadge
      companyRegistrationNumber
      isEmailConfirmed
      isPhoneConfirmed
      createdAt
    }
  }
`;
