// GraphQL queries for user authentication

export const ME_QUERY = `
  query Me {
    me {
      user {
        id
        email
        name
        phone
        gender
        dateOfBirth
        role
        accountType
        status
        isEmailConfirmed
        companyName
        accountBadge
        avatar
        website
        companyRegistrationNumber
        contactPhone
        phoneIsWhatsApp
        showPhone
        showContactPhone
        businessVerified
        createdAt
        updatedAt
        warningCount
        currentWarningMessage
        warnedAt
        warningAcknowledged
        bannedUntil
        banReason
        bannedAt
      }
      tokenExpiresAt
    }
    myPackage {
      id
      status
      startDate
      endDate
      currentListings
      userSubscription {
        id
        name
        title
        description
        price
        billingCycle
        maxListings
        maxImagesPerListing
        videoAllowed
        priorityPlacement
        analyticsAccess
        customBranding
        featuredListings
      }
    }
  }
`;

export const SIGNUP_MUTATION = `
  mutation Signup($email: String!, $password: String!, $name: String!, $accountType: String!) {
    signup(email: $email, password: $password, name: $name, accountType: $accountType) {
      user {
        id
        email
        name
        accountType
        role
      }
      message
    }
  }
`;

export const ACKNOWLEDGE_WARNING_MUTATION = `
  mutation AcknowledgeWarning {
    acknowledgeWarning
  }
`;
