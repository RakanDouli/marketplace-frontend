/**
 * Admin Stores - Simple admin management
 */

// Authentication
export { useAdminAuthStore } from "./adminAuthStore";

// Users management
export { useAdminUsersStore } from "./adminUsersStore";

// Roles management
export { useAdminRolesStore } from "./adminRolesStore";

// Features management (shared across dashboard and roles)
export { useAdminFeaturesStore } from "./adminFeaturesStore";

// Attributes and categories management
export { useAttributesStore } from "./adminAttributesStore";

// Subscriptions management
export { useAdminSubscriptionsStore } from "./adminSubscriptionsStore";

export { useAdminAuditStore } from "./adminAuditStore";

// Ad Packages management
export { useAdminAdPackagesStore } from "./adminAdPackagesStore";
