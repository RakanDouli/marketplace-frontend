'use client';

import { Container, Text } from '@/components/slices';
import { useFeaturePermissions } from '@/hooks/usePermissions';

export const ListingsDashboardPanel: React.FC = () => {
  const { canView, canCreate, canModify, canDelete } = useFeaturePermissions('listings');

  if (!canView) {
    return (
      <Container>
        <Text variant="h2" color="error">وصول مرفوض</Text>
        <Text variant="paragraph" color="secondary">
          ليس لديك صلاحية لعرض إدارة الإعلانات
        </Text>
      </Container>
    );
  }

  return (
    <Container>
      <Text variant="h2">إدارة الإعلانات</Text>
      <Text variant="paragraph">
        نظام إدارة الإعلانات والمراجعة قيد التطوير.
      </Text>
      {canCreate && (
        <Text variant="paragraph" color="secondary">
          لديك صلاحية إنشاء إعلانات جديدة
        </Text>
      )}
      {canModify && (
        <Text variant="paragraph" color="secondary">
          لديك صلاحية تعديل الإعلانات ومراجعتها
        </Text>
      )}
      {canDelete && (
        <Text variant="paragraph" color="secondary">
          لديك صلاحية حذف الإعلانات
        </Text>
      )}
    </Container>
  );
};