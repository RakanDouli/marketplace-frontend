// GraphQL queries and mutations for admin ad clients management

export const GET_ALL_AD_CLIENTS_QUERY = `
  query GetAllAdClients {
    adClients {
      id
      companyName
      contactName
      contactEmail
      contactPhone
      website
      description
      industry
      status
      notes
      createdByUserId
      createdByUser {
        id
        email
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_AD_CLIENT_BY_ID_QUERY = `
  query GetAdClientById($id: ID!) {
    adClient(id: $id) {
      id
      companyName
      contactName
      contactEmail
      contactPhone
      website
      description
      industry
      status
      notes
      createdByUserId
      createdByUser {
        id
        email
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ACTIVE_AD_CLIENTS_QUERY = `
  query GetActiveAdClients {
    activeAdClients {
      id
      companyName
      contactName
      contactEmail
      contactPhone
      industry
      status
      createdAt
    }
  }
`;

export const CREATE_AD_CLIENT_MUTATION = `
  mutation CreateAdClient($input: CreateAdClientInput!) {
    createAdClient(input: $input) {
      id
      companyName
      contactName
      contactEmail
      contactPhone
      website
      description
      industry
      status
      notes
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_AD_CLIENT_MUTATION = `
  mutation UpdateAdClient($input: UpdateAdClientInput!) {
    updateAdClient(input: $input) {
      id
      companyName
      contactName
      contactEmail
      contactPhone
      website
      description
      industry
      status
      notes
      updatedAt
    }
  }
`;

export const DELETE_AD_CLIENT_MUTATION = `
  mutation DeleteAdClient($input: DeleteAdClientInput!) {
    deleteAdClient(input: $input)
  }
`;
