// GraphQL queries and mutations for Ad Reports

export const GET_ALL_AD_REPORTS_QUERY = `
  query GetAllAdReports($filter: FilterAdReportsInput) {
    adReports(filter: $filter) {
      id
      campaignId
      campaign {
        id
        campaignName
        client {
          id
          companyName
        }
        package {
          id
          packageName
        }
        status
      }
      date
      impressions
      clicks
      ctr
      cost
      currency
      createdAt
      updatedAt
    }
  }
`;

export const GET_AD_REPORT_BY_ID_QUERY = `
  query GetAdReportById($id: String!) {
    adReport(id: $id) {
      id
      campaignId
      campaign {
        id
        campaignName
        description
        client {
          id
          companyName
          contactName
          contactEmail
        }
        package {
          id
          packageName
        }
        status
        startDate
        endDate
        totalPrice
        currency
      }
      mediaAssetKey
      date
      impressions
      clicks
      ctr
      cost
      currency
      metadata
      createdAt
      updatedAt
    }
  }
`;

export const GET_CAMPAIGN_REPORTS_QUERY = `
  query GetCampaignReports($campaignId: String!, $startDate: String, $endDate: String) {
    campaignReports(campaignId: $campaignId, startDate: $startDate, endDate: $endDate) {
      id
      date
      impressions
      clicks
      ctr
      cost
      currency
      createdAt
    }
  }
`;

export const GET_CAMPAIGN_SUMMARY_QUERY = `
  query GetCampaignSummary($campaignId: String!, $startDate: String, $endDate: String) {
    campaignSummary(campaignId: $campaignId, startDate: $startDate, endDate: $endDate) {
      campaignId
      campaignName
      totalImpressions
      totalClicks
      averageCTR
      totalCost
      currency
      reportCount
    }
  }
`;

export const GET_TOP_PERFORMING_CAMPAIGNS_QUERY = `
  query GetTopPerformingCampaigns($limit: Int, $startDate: String, $endDate: String) {
    topPerformingCampaigns(limit: $limit, startDate: $startDate, endDate: $endDate) {
      campaignId
      campaignName
      totalImpressions
      totalClicks
      averageCTR
      totalCost
      currency
      reportCount
    }
  }
`;

export const GET_ADS_STATS_QUERY = `
  query GetAdsStats($startDate: String, $endDate: String) {
    adsStats(startDate: $startDate, endDate: $endDate) {
      totalImpressions
      totalClicks
      averageCTR
      totalCost
      totalCampaigns
    }
  }
`;
