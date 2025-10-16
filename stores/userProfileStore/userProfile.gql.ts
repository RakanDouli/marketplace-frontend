// GraphQL mutations for user profile management

export const UPDATE_ME_MUTATION = `
  mutation UpdateMe($input: UpdateUserInput!) {
    updateMe(input: $input) {
      id
      name
      phone
      companyName
      website
      kvkNumber
      contactPhone
      updatedAt
    }
  }
`;

export const DELETE_MY_ACCOUNT_MUTATION = `
  mutation DeleteMyAccount {
    deleteMyAccount
  }
`;

// Note: There's no deactivate mutation in backend yet
// We'll use updateMe to change status to 'banned' as a workaround
export const DEACTIVATE_MY_ACCOUNT_MUTATION = `
  mutation UpdateMe($input: UpdateUserInput!) {
    updateMe(input: $input) {
      id
      status
    }
  }
`;

export const CHANGE_MY_PASSWORD_MUTATION = `
  mutation ChangeMyPassword($input: ChangePasswordInput!) {
    changeMyPassword(input: $input)
  }
`;

// Public mutation to request password reset email (no auth required)
export const REQUEST_PASSWORD_RESET_MUTATION = `
  mutation RequestPasswordReset($input: RequestLinkInput!) {
    requestPasswordReset(input: $input)
  }
`;

// Note: Email change requires password verification via Supabase
// Backend needs to implement changeEmail mutation with password check
export const CHANGE_EMAIL_MUTATION = `
  mutation UpdateMe($input: UpdateUserInput!) {
    updateMe(input: $input) {
      id
      email
    }
  }
`;

// ==============================
// AVATAR MANAGEMENT
// ==============================

// Get upload URL for avatar
export const CREATE_AVATAR_UPLOAD_URL_MUTATION = `
  mutation CreateAvatarUploadUrl {
    createAvatarUploadUrl {
      uploadUrl
    }
  }
`;

// Delete avatar from Cloudflare
export const DELETE_AVATAR_MUTATION = `
  mutation DeleteAvatar {
    deleteAvatar
  }
`;
