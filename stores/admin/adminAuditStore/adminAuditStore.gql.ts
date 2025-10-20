// src/stores/adminAuditStore.gql.ts
export const GET_AUDIT_LOGS_QUERY = `
  query AuditLogs($limit: Int, $offset: Int, $entity: String, $entityId: String, $userId: String, $userEmail: String, $userRole: String) {
    auditLogs(limit: $limit, offset: $offset, entity: $entity, entityId: $entityId, userId: $userId, userEmail: $userEmail, userRole: $userRole) {
      id
      userId
      user {
        id
        email
        name
        role
      }
      action
      entity
      entityId
      before
      after
      createdAt
    }
  }
`;

export const GET_AUDIT_LOGS_COUNT_QUERY = `
  query AuditLogsCount($entity: String, $entityId: String, $userId: String, $userEmail: String, $userRole: String) {
    auditLogsCount(entity: $entity, entityId: $entityId, userId: $userId, userEmail: $userEmail, userRole: $userRole)
  }
`;
export const GET_AUDIT_LOG_QUERY = `
  query AuditLog($id: ID!) {
    auditLog(id: $id) {
      id
      userId
      user {
        id
        email
        name
        role
      }
      action
      entity
      entityId
      before
      after
      createdAt
    }
  }
`;

export const DELETE_AUDIT_LOG_MUTATION = `
  mutation DeleteAudit($id: ID!) {
    deleteAudit(id: $id)
  }
`;
