export const AD_NETWORK_SETTINGS_QUERY = `
  query AdNetworkSettings {
    adNetworkSettings {
      id
      key
      value
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_AD_NETWORK_SETTING_MUTATION = `
  mutation UpdateAdNetworkSetting($input: UpdateAdNetworkSettingInput!) {
    updateAdNetworkSetting(input: $input) {
      id
      key
      value
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;
