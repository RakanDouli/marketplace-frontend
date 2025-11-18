// GraphQL queries and mutations for admin ad campaigns management

export const GET_ALL_AD_CAMPAIGNS_QUERY = `
  query GetAllAdCampaigns($filter: FilterAdCampaignsInput) {
    adCampaigns(filter: $filter) {
      id
      campaignName
      description
      clientId
      client {
        id
        companyName
        industry
        contactName
        contactEmail
        contactPhone
        status
      }
      packageId
      package {
        id
        packageName
        adType
        durationDays
        impressionLimit
        basePrice
        currency
      }
      isCustomPackage
      packageBreakdown
      status
      startPreference
      startDate
      endDate
      totalPrice
      currency
      paymentLink
      paymentLinkSentAt
      paidAt
      activatedAt
      completedAt
      createdByUserId
      createdByUser {
        id
        email
        name
      }
      notes
      desktopMediaUrl
      mobileMediaUrl
      clickUrl
      openInNewTab
      publicReportToken
      createdAt
      updatedAt
    }
  }
`;

export const GET_AD_CAMPAIGN_BY_ID_QUERY = `
  query GetAdCampaignById($id: ID!) {
    adCampaign(id: $id) {
      id
      campaignName
      description
      clientId
      client {
        id
        companyName
        industry
        contactName
        contactEmail
        contactPhone
        status
      }
      packageId
      package {
        id
        packageName
        adType
        durationDays
        impressionLimit
        basePrice
        currency
      }
      isCustomPackage
      packageBreakdown
      status
      startPreference
      startDate
      endDate
      totalPrice
      currency
      paymentLink
      paymentLinkSentAt
      paidAt
      activatedAt
      completedAt
      createdByUserId
      createdByUser {
        id
        email
        name
      }
      notes
      desktopMediaUrl
      mobileMediaUrl
      clickUrl
      openInNewTab
      publicReportToken
      createdAt
      updatedAt
    }
  }
`;

export const GET_ACTIVE_AD_CAMPAIGNS_QUERY = `
  query GetActiveAdCampaigns {
    activeAdCampaigns {
      id
      campaignName
      description
      clientId
      client {
        id
        companyName
        contactPerson
      }
      packageId
      package {
        id
        packageName
        adType
      }
      status
      startDate
      endDate
      totalPrice
      currency
      publicReportToken
      createdAt
    }
  }
`;

export const GET_CAMPAIGNS_BY_CLIENT_QUERY = `
  query GetCampaignsByClient($clientId: String!) {
    campaignsByClient(clientId: $clientId) {
      id
      campaignName
      status
      startDate
      endDate
      totalPrice
      currency
      createdAt
    }
  }
`;

export const GET_MY_CAMPAIGNS_QUERY = `
  query GetMyCampaigns {
    myCampaigns {
      id
      campaignName
      description
      status
      startDate
      endDate
      totalPrice
      currency
      publicReportToken
      createdAt
    }
  }
`;

export const CREATE_AD_CAMPAIGN_MUTATION = `
  mutation CreateAdCampaign($input: CreateAdCampaignInput!) {
    createAdCampaign(input: $input) {
      id
      campaignName
      description
      clientId
      client {
        id
        companyName
        industry
        contactName
        contactEmail
        contactPhone
        status
      }
      packageId
      package {
        id
        packageName
        adType
        durationDays
        impressionLimit
        basePrice
        currency
      }
      isCustomPackage
      packageBreakdown
      status
      startPreference
      startDate
      endDate
      totalPrice
      currency
      notes
      desktopMediaUrl
      mobileMediaUrl
      clickUrl
      openInNewTab
      publicReportToken
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

export const UPDATE_AD_CAMPAIGN_MUTATION = `
  mutation UpdateAdCampaign($input: UpdateAdCampaignInput!) {
    updateAdCampaign(input: $input) {
      id
      campaignName
      description
      clientId
      client {
        id
        companyName
        industry
        contactName
        contactEmail
        contactPhone
        status
      }
      packageId
      package {
        id
        packageName
        adType
        durationDays
        impressionLimit
        basePrice
        currency
      }
      isCustomPackage
      packageBreakdown
      status
      startPreference
      startDate
      endDate
      totalPrice
      currency
      paymentLink
      notes
      desktopMediaUrl
      mobileMediaUrl
      clickUrl
      openInNewTab
      publicReportToken
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

export const UPDATE_CAMPAIGN_STATUS_MUTATION = `
  mutation UpdateCampaignStatus($input: UpdateCampaignStatusInput!) {
    updateCampaignStatus(input: $input) {
      id
      status
      paymentLink
      paymentLinkSentAt
      paidAt
      activatedAt
      completedAt
      updatedAt
    }
  }
`;

export const DELETE_AD_CAMPAIGN_MUTATION = `
  mutation DeleteAdCampaign($input: DeleteAdCampaignInput!) {
    deleteAdCampaign(input: $input)
  }
`;

export const REGENERATE_PUBLIC_REPORT_TOKEN_MUTATION = `
  mutation RegeneratePublicReportToken($campaignId: String!) {
    regeneratePublicReportToken(campaignId: $campaignId) {
      id
      publicReportToken
      updatedAt
    }
  }
`;

export const PROCESS_CAMPAIGN_AUTOMATION_MUTATION = `
  mutation ProcessCampaignAutomation($campaignId: String!) {
    processCampaignAutomation(campaignId: $campaignId) {
      id
      status
      paymentLink
      paymentLinkSentAt
      activatedAt
      updatedAt
    }
  }
`;

export const GET_CAMPAIGN_STATUS_INSIGHTS_QUERY = `
  query GetCampaignStatusInsights {
    campaignStatusInsights {
      totalCampaigns
      activeCampaigns
      draftCampaigns
      pausedCampaigns
      completedCampaigns
      cancelledCampaigns
      awaitingPayment
      awaitingActivation
    }
  }
`;
