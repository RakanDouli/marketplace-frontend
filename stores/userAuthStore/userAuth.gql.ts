// GraphQL queries for user authentication

export const ME_QUERY = `
  query Me {
    me {
      user {
        id
        email
        name
        phone
        role
        accountType
        isEmailConfirmed
        companyName
        accountBadge
        avatar
        website
        kvkNumber
        contactPhone
        businessVerified
        createdAt
        updatedAt
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
