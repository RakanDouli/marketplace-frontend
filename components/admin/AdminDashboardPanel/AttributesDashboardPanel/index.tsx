'use client';

import { Container, Text } from '@/components/slices';
import { useFeaturePermissions } from '@/hooks/usePermissions';

export const AttributesDashboardPanel: React.FC = () => {
  const { canView, canCreate, canModify, canDelete } = useFeaturePermissions('attributes');

  if (!canView) {
    return (
      <Container>
        <Text variant="h2" color="error">وصول مرفوض</Text>
        <Text variant="paragraph" color="secondary">
          ليس لديك صلاحية لعرض إدارة الخصائص
        </Text>
      </Container>
    );
  }

  return (
    <Container>
      <Text variant="h2">إدارة الخصائص</Text>
      <Text variant="paragraph">
        إدارة خصائص التصنيفات قيد التطوير.
      </Text>
      {canCreate && (
        <Text variant="paragraph" color="secondary">
          لديك صلاحية إنشاء خصائص جديدة
        </Text>
      )}
      {canModify && (
        <Text variant="paragraph" color="secondary">
          لديك صلاحية تعديل الخصائص
        </Text>
      )}
      {canDelete && (
        <Text variant="paragraph" color="secondary">
          لديك صلاحية حذف الخصائص
        </Text>
      )}
    </Container>
  );
};