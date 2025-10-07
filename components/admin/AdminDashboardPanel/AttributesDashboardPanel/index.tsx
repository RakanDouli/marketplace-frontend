'use client';

import React, { useState, useEffect } from 'react';
import { Container, Text, Button, Input, SortableList, SortableItemData, InlineEdit, Loading } from '@/components/slices';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { useAttributesStore } from '@/stores/admin';
import type { CreateCategoryInput, CreateAttributeInput, UpdateAttributeInput } from '@/stores/admin/adminAttributesStore';
import { Plus, Settings, Tag, Globe } from 'lucide-react';
import styles from './AttributesDashboardPanel.module.scss';
import { CreateCategoryModal, CreateCategoryData } from './modals/CreateCategoryModal';
import { CreateAttributeModal } from './modals/CreateAttributeModal';
import { EditAttributeModal } from './modals/EditAttributeModal';
import { DeleteAttributeModal } from './modals/DeleteAttributeModal';

// Using adminAttributesStore for all category and attribute operations

export const AttributesDashboardPanel: React.FC = () => {
  const { canView, canCreate, canModify, canDelete } = useFeaturePermissions('attributes');
  const {
    categories,
    attributes,
    loading,
    error,
    loadCategories,
    loadAttributes,
    createCategory,
    createAttribute,
    updateAttribute,
    deleteAttribute,
    updateAttributeFilterVisibility,
    updateAttributeOrder,
    setSelectedCategory
  } = useAttributesStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [transformedAttributes, setTransformedAttributes] = useState<SortableItemData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Create category modal state
  const [isCreateCategoryModalVisible, setIsCreateCategoryModalVisible] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Attribute modal states
  const [isCreateAttributeModalVisible, setIsCreateAttributeModalVisible] = useState(false);
  const [isCreatingAttribute, setIsCreatingAttribute] = useState(false);
  const [isEditAttributeModalVisible, setIsEditAttributeModalVisible] = useState(false);
  const [isUpdatingAttribute, setIsUpdatingAttribute] = useState(false);
  const [selectedAttributeForEdit, setSelectedAttributeForEdit] = useState<SortableItemData | null>(null);
  const [isDeleteAttributeModalVisible, setIsDeleteAttributeModalVisible] = useState(false);
  const [isDeletingAttribute, setIsDeletingAttribute] = useState(false);
  const [selectedAttributeForDelete, setSelectedAttributeForDelete] = useState<SortableItemData | null>(null);

  // Inline group management state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [creatingNewGroup, setCreatingNewGroup] = useState(false);

  // Initialize categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // Load attributes when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      // Find the category slug from the selected ID
      const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
      if (selectedCategory) {
        loadAttributes(selectedCategory.slug);
        // Reset unsaved changes when switching categories
        setHasUnsavedChanges(false);
      }
    }
  }, [selectedCategoryId, categories, loadAttributes]);

  // Transform store attributes to sortable items when they change
  useEffect(() => {
    if (attributes.length > 0) {
      const transformed = transformAttributesToSortableItems(attributes);
      console.log('🔍 Transformed attributes:', transformed);
      console.log('🔍 Attribute names:', transformed.map(t => `${t.name} (${t.type})`));
      setTransformedAttributes(transformed);
    } else {
      setTransformedAttributes([]);
    }
    // Reset unsaved changes when fresh data loads
    setHasUnsavedChanges(false);
  }, [attributes]);

  // Convert SortableItemData back to Attribute for modals
  const getAttributeFromSortableItem = (sortableItem: SortableItemData): any | null => {
    if (sortableItem.type !== 'attribute') return null;

    // Find the original attribute from the backend attributes
    const attributeId = sortableItem.metadata?.originalId || sortableItem.id.replace('global_', '');
    const originalAttribute = attributes.find(attr => attr.id === attributeId);

    if (originalAttribute) {
      return originalAttribute;
    }

    // If not found in current attributes, construct from sortable item metadata
    return {
      id: attributeId,
      name: sortableItem.name,
      key: sortableItem.metadata?.attributeType || 'unknown',
      type: sortableItem.metadata?.attributeType || 'text',
      validation: sortableItem.metadata?.validation || 'optional',
      sortOrder: sortableItem.metadata?.sortOrder || 0,
      group: sortableItem.groupName && sortableItem.groupName !== 'عام' ? sortableItem.groupName : '',
      groupOrder: sortableItem.metadata?.groupOrder || 0,
      showInGrid: true,
      showInList: true,
      showInDetail: true,
      showInFilter: sortableItem.metadata?.showInFilter || false,
      isGlobal: sortableItem.metadata?.isGlobal || false,
      isSystemCore: false,
      canBeCustomized: sortableItem.metadata?.canBeCustomized || true,
      canBeDeleted: sortableItem.metadata?.canBeDeleted || true,
      options: []
    };
  };

  // Transform backend attributes to mixed main-level ordering system
  const transformAttributesToSortableItems = (backendAttributes: any[]): SortableItemData[] => {
    // Filter out description fields
    const cleanAttributes = backendAttributes.map(attr => {
      const { description, ...cleanAttr } = attr;
      return cleanAttr;
    });

    // Create a unified ordering system where groups and standalone fields can be mixed
    const mixedItems: Array<{
      id: string;
      type: 'group' | 'attribute';
      name: string;
      mainOrder: number;
      isGlobal?: boolean;
      groupName?: string;
      attributes?: any[];
      originalAttribute?: any;
    }> = [];

    // Step 1: Process global attributes (standalone fields at main level)
    const globalAttributes = cleanAttributes.filter(attr => attr.isGlobal);
    globalAttributes.forEach(attr => {
      mixedItems.push({
        id: `global_${attr.id}`,
        type: 'attribute',
        name: attr.name,
        mainOrder: attr.groupOrder, // Use groupOrder for main list position
        isGlobal: true,
        originalAttribute: attr
      });
    });

    // Step 2: Process category attributes (grouped and standalone)
    const categoryAttributes = cleanAttributes.filter(attr => !attr.isGlobal);
    const groupsMap: Record<string, { groupOrder: number; attributes: any[] }> = {};

    // Separate grouped attributes from standalone ones
    categoryAttributes.forEach(attr => {
      if (attr.group) {
        // Attribute has a group - add it to that group
        const groupName = attr.group;
        if (!groupsMap[groupName]) {
          groupsMap[groupName] = {
            groupOrder: attr.groupOrder || 999,
            attributes: []
          };
        }
        groupsMap[groupName].attributes.push(attr);
      } else {
        // Attribute has no group - add as standalone at main level
        mixedItems.push({
          id: attr.id,
          type: 'attribute',
          name: attr.name,
          mainOrder: attr.groupOrder,
          originalAttribute: attr
        });
      }
    });

    // Step 3: Add groups to mixed items (using groupOrder as mainOrder)
    Object.entries(groupsMap).forEach(([groupName, groupData]) => {
      // Sort attributes within group by their sortOrder
      const sortedGroupAttributes = groupData.attributes.sort((a, b) => a.sortOrder - b.sortOrder);

      mixedItems.push({
        id: `group_${groupName}`,
        type: 'group',
        name: groupName,
        mainOrder: groupData.groupOrder, // Group appears at this main order position
        groupName: groupName,
        attributes: sortedGroupAttributes
      });
    });

    // Step 4: Sort all items by mainOrder to create the final mixed list
    mixedItems.sort((a, b) => a.mainOrder - b.mainOrder);

    // Step 5: Convert to SortableItemData format
    const result: SortableItemData[] = mixedItems.map((item, index) => {
      if (item.type === 'group') {
        // Group with children
        const children: SortableItemData[] = item.attributes!.map((attr: any, childIndex: number) => ({
          id: attr.id,
          type: 'attribute',
          name: attr.name,
          icon: <Tag size={16} />,
          isReadOnly: false,
          groupName: item.groupName,
          metadata: {
            isGlobal: false,
            attributeKey: attr.key,  // The attribute key (e.g., 'brandId', 'title', 'location')
            attributeType: attr.type,  // The attribute type (e.g., 'SELECTOR', 'TEXT')
            originalId: attr.id,
            validation: attr.validation,
            options: attr.options || [],
            groupOrder: item.mainOrder,
            sortOrder: attr.sortOrder,
            groupInternalOrder: childIndex + 1, // Internal ordering within group
            showInFilter: attr.showInFilter,
            canBeCustomized: attr.canBeCustomized,
            canBeDeleted: attr.canBeDeleted
          }
        }));

        return {
          id: item.id,
          type: 'group',
          name: item.name,
          icon: <Settings size={16} />,
          isReadOnly: false,
          children: children,
          metadata: {
            mainOrder: index + 1, // Position in main list
            originalGroupOrder: item.mainOrder
          }
        };
      } else {
        // Standalone attribute at main level
        const attr = item.originalAttribute!;
        return {
          id: item.id,
          type: 'attribute',
          name: item.name,
          icon: item.isGlobal ? <Globe size={16} /> : <Tag size={16} />,
          isReadOnly: false,
          groupName: item.isGlobal ? 'عام' : undefined,
          metadata: {
            isGlobal: item.isGlobal,
            attributeKey: attr.key,  // The attribute key (e.g., 'search', 'price', 'sellerType')
            attributeType: attr.type,  // The attribute type (e.g., 'TEXT', 'CURRENCY', 'SELECTOR')
            originalId: attr.id,
            validation: attr.validation,
            options: attr.options || [],
            mainOrder: index + 1, // Position in main list
            originalSortOrder: attr.sortOrder,
            showInFilter: attr.showInFilter,
            canBeCustomized: attr.canBeCustomized,
            canBeDeleted: attr.canBeDeleted
          }
        };
      }
    });

    return result;
  };


  // Permission check
  // if (!canView) {
  //   return (
  //     <Container>
  //       <Text variant="h2" color="error">وصول مرفوض</Text>
  //       <Text variant="paragraph" color="secondary">
  //         ليس لديك صلاحية لعرض إدارة الخصائص
  //       </Text>
  //     </Container>
  //   );
  // }

  // Event handlers for the new mixed ordering system
  const handleAttributesChange = (newAttributes: SortableItemData[]) => {
    // Update the transformed attributes immediately for UI
    setTransformedAttributes(newAttributes);

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    if (!selectedCategory) return;

    setIsSaving(true);

    try {
      // Extract attributes with mixed ordering system
      const extractAttributesForSaving = (items: SortableItemData[]): any[] => {
        const extracted: any[] = [];

        items.forEach((item, mainIndex) => {
          if (item.type === 'group' && item.children) {
            // Group: All children get the group assignment with internal ordering
            item.children.forEach((child: any, childIndex: number) => {
              if (child.type === 'attribute') {
                const attributeId = child.metadata?.originalId || child.id.replace('global_', '');
                extracted.push({
                  id: attributeId,
                  // sortOrder: Position within the group (1st, 2nd, 3rd item in group)
                  sortOrder: childIndex + 1,
                  // groupOrder: Position of the group itself in the filter list
                  groupOrder: mainIndex + 1,
                  // group: Name of the group (undefined for standalone)
                  group: item.name !== 'عام' ? item.name : undefined,
                  // showInFilter: Include filter visibility state
                  showInFilter: child.metadata?.showInFilter || false
                });
              }
            });
          } else if (item.type === 'attribute') {
            // Standalone attribute: gets main position as both sortOrder and groupOrder
            const attributeId = item.metadata?.originalId || item.id.replace('global_', '');
            extracted.push({
              id: attributeId,
              // For standalone attributes: main position is their sortOrder
              sortOrder: mainIndex + 1,
              // groupOrder: Main position determines where it appears in filter list
              groupOrder: mainIndex + 1,
              // No group association (null group means standalone)
              group: null,
              // showInFilter: Include filter visibility state
              showInFilter: item.metadata?.showInFilter || false
            });
          }
        });

        return extracted;
      };

      const attributeOrders = extractAttributesForSaving(transformedAttributes);

      // Save empty groups info before updating
      const emptyGroups = transformedAttributes.filter(
        item => item.type === 'group' && (!item.children || item.children.length === 0)
      );

      await updateAttributeOrder(selectedCategory.slug, attributeOrders);

      // Reload attributes and preserve empty groups
      await loadAttributes(selectedCategory.slug);

      // Re-add empty groups to the UI if they still don't have attributes
      if (emptyGroups.length > 0) {
        setTransformedAttributes(prev => {
          const newItems = [...prev];
          emptyGroups.forEach(emptyGroup => {
            // Check if this group name now has attributes (was filled)
            const groupExists = newItems.some(
              item => item.type === 'group' && item.name === emptyGroup.name
            );

            // If group doesn't exist, add it back as empty
            if (!groupExists) {
              newItems.push(emptyGroup);
            }
          });
          return newItems;
        });
      }

      // Clear unsaved changes flag
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save attribute order:', error);
      // Error is handled by the store
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    // Cancel any in-progress group/attribute creation
    setCreatingNewGroup(false);

    // Immediately reset transformedAttributes to the current backend state
    const transformed = transformAttributesToSortableItems(attributes);
    setTransformedAttributes(transformed);

    // Reload attributes to ensure we have fresh data
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    if (selectedCategory) {
      loadAttributes(selectedCategory.slug);
    }

    setHasUnsavedChanges(false);
  };

  const handleItemEdit = (item: SortableItemData) => {
    if (item.type === 'group') {
      // Handle group edit - start inline editing
      setEditingGroupId(item.id);
    } else {
      // Handle attribute edit - open modal
      setSelectedAttributeForEdit(item);
      setIsEditAttributeModalVisible(true);
    }
  };

  const handleItemDelete = (item: SortableItemData) => {
    if (item.type === 'group') {
      // Handle group delete - check if group has children
      if (item.children && item.children.length > 0) {
        // Show warning - cannot delete group with children
        console.warn('Cannot delete group with children:', item.name);
        // TODO: Show user-friendly notification
        return;
      }
      // Delete group directly since it's empty
      handleDeleteGroup(item);
    } else {
      // Handle attribute delete - open modal
      setSelectedAttributeForDelete(item);
      setIsDeleteAttributeModalVisible(true);
    }
  };


  const handleCreateAttribute = () => {
    setIsCreateAttributeModalVisible(true);
  };

  const handleCreateGroup = () => {
    setCreatingNewGroup(true);
  };

  const handleSaveNewGroup = (groupName: string) => {
    if (!groupName.trim()) return;

    // Create new group
    const timestamp = Date.now();
    const newGroup: SortableItemData = {
      id: `group_${timestamp}`,
      type: 'group',
      name: groupName.trim(),
      icon: <div>📁</div>,
      children: [],
      metadata: {
        isNew: true,
        createdAt: new Date().toISOString(),
        groupName: groupName.trim()
      }
    };

    // Add the new group to the current attributes
    const newAttributes = [...transformedAttributes, newGroup];

    // Update the state which will trigger the changes tracker
    handleAttributesChange(newAttributes);
    setCreatingNewGroup(false);

    console.log('Created new group:', newGroup.name, 'Total items:', newAttributes.length);
  };

  const handleCancelNewGroup = () => {
    setCreatingNewGroup(false);
  };

  const handleEditGroup = (groupId: string, newName: string) => {
    console.log('Editing group:', groupId, 'to:', newName);

    // Update the group name in local state
    const updatedAttributes = transformedAttributes.map(item => {
      if (item.id === groupId && item.type === 'group') {
        return {
          ...item,
          name: newName,
          metadata: {
            ...item.metadata,
            groupName: newName
          }
        };
      }
      return item;
    });

    // Update the state which will trigger the changes tracker
    handleAttributesChange(updatedAttributes);
    setEditingGroupId(null);

    console.log('Updated group name to:', newName);
  };

  const handleDeleteGroup = (group: SortableItemData) => {
    console.log('Deleting group:', group.name);

    // Remove the group from local state
    const updatedAttributes = transformedAttributes.filter(item => item.id !== group.id);

    // Update the state which will trigger the changes tracker
    handleAttributesChange(updatedAttributes);

    console.log('Deleted group:', group.name);
  };

  const validateGroupName = (name: string) => {
    if (!name.trim()) {
      return 'اسم المجموعة مطلوب';
    }
    if (name.length < 2) {
      return 'اسم المجموعة يجب أن يكون أكثر من حرف واحد';
    }
    // Check if group name already exists
    const existingGroup = transformedAttributes.find(
      item => item.type === 'group' &&
        item.name.toLowerCase() === name.toLowerCase() &&
        item.id !== editingGroupId
    );
    if (existingGroup) {
      return 'اسم المجموعة موجود بالفعل';
    }
    return null;
  };


  const handleCreateCategory = () => {
    setIsCreateCategoryModalVisible(true);
  };

  const handleCreateCategorySubmit = async (categoryData: CreateCategoryData) => {
    try {
      setIsCreatingCategory(true);

      // Convert CreateCategoryData to CreateCategoryInput
      const input: CreateCategoryInput = {
        name: categoryData.name,
        nameAr: categoryData.nameAr,
        slug: categoryData.slug,
        isActive: categoryData.isActive,
        biddingEnabled: categoryData.biddingEnabled
      };

      const newCategory = await createCategory(input);

      // Close modal
      setIsCreateCategoryModalVisible(false);
      console.log('Category created successfully:', newCategory);
    } catch (error) {
      console.error('Failed to create category:', error);
      // Error is handled by the store
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCreateAttributeSubmit = async (attributeData: CreateAttributeInput) => {
    try {
      setIsCreatingAttribute(true);

      // Ensure we have the selected category ID
      const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
      if (!selectedCategory) {
        throw new Error('No category selected');
      }

      // Set the category ID
      const input: CreateAttributeInput = {
        ...attributeData,
        categoryId: selectedCategory.id
      };

      const newAttribute = await createAttribute(input);

      // Close modal and reload attributes
      setIsCreateAttributeModalVisible(false);
      loadAttributes(selectedCategory.slug);
      console.log('Attribute created successfully:', newAttribute);
    } catch (error) {
      console.error('Failed to create attribute:', error);
      // Error is handled by the store
    } finally {
      setIsCreatingAttribute(false);
    }
  };

  const handleEditAttributeSubmit = async (id: string, attributeData: UpdateAttributeInput) => {
    try {
      setIsUpdatingAttribute(true);

      const updatedAttribute = await updateAttribute(id, attributeData);

      // Close modal and reload attributes
      setIsEditAttributeModalVisible(false);
      setSelectedAttributeForEdit(null);
      const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
      if (selectedCategory) {
        loadAttributes(selectedCategory.slug);
      }
      console.log('Attribute updated successfully:', updatedAttribute);
    } catch (error) {
      console.error('Failed to update attribute:', error);
      // Error is handled by the store
    } finally {
      setIsUpdatingAttribute(false);
    }
  };

  const handleDeleteAttributeSubmit = async () => {
    if (!selectedAttributeForDelete) return;

    try {
      setIsDeletingAttribute(true);

      // Get the actual attribute ID (remove 'global_' prefix if it exists)
      const attributeId = selectedAttributeForDelete.metadata?.originalId ||
        selectedAttributeForDelete.id.replace('global_', '');

      const success = await deleteAttribute(attributeId);

      if (success) {
        // Close modal and reload attributes
        setIsDeleteAttributeModalVisible(false);
        setSelectedAttributeForDelete(null);
        const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
        if (selectedCategory) {
          loadAttributes(selectedCategory.slug);
        }
        console.log('Attribute deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete attribute:', error);
      // Error is handled by the store
    } finally {
      setIsDeletingAttribute(false);
    }
  };

  const handleToggleFilter = (attribute: SortableItemData, showInFilter: boolean) => {
    console.log('Toggle filter for attribute:', attribute.name, 'showInFilter:', showInFilter);

    // Update the attribute's showInFilter in local state (optimistic update)
    const updatedAttributes = transformedAttributes.map(item => {
      if (item.type === 'group' && item.children) {
        // Update child if it's in a group
        const updatedChildren = item.children.map(child => {
          if (child.id === attribute.id) {
            return {
              ...child,
              metadata: {
                ...child.metadata,
                showInFilter
              }
            };
          }
          return child;
        });
        return {
          ...item,
          children: updatedChildren
        };
      } else if (item.id === attribute.id) {
        // Update standalone attribute
        return {
          ...item,
          metadata: {
            ...item.metadata,
            showInFilter
          }
        };
      }
      return item;
    });

    // Update the state which will trigger the changes tracker
    handleAttributesChange(updatedAttributes);

    console.log('Filter visibility toggled for attribute:', attribute.name, 'showInFilter:', showInFilter);
  };

  const handleExtractFromGroup = (attribute: SortableItemData) => {
    console.log('Extract from group:', attribute.name, 'from group:', attribute.groupName);

    // Create a new attributes array with the item extracted from its group
    const newAttributes = transformedAttributes.map(item => {
      if (item.type === 'group' && item.children) {
        // Remove the attribute from this group's children
        const newChildren = item.children.filter(child => child.id !== attribute.id);
        return {
          ...item,
          children: newChildren
        };
      }
      return item;
    });

    // Add the extracted attribute as a standalone item at the main level
    const extractedAttribute = {
      ...attribute,
      groupName: undefined, // Remove group association
      metadata: {
        ...attribute.metadata,
        groupName: undefined
      }
    };

    newAttributes.push(extractedAttribute);

    // Update the state which will trigger the changes tracker
    handleAttributesChange(newAttributes);
  };

  const handleAddToGroup = (attribute: SortableItemData, targetGroupId: string) => {
    console.log('Add to group:', attribute.name, 'to group:', targetGroupId);

    // Find the target group name
    const targetGroup = transformedAttributes.find(item => item.id === targetGroupId);
    if (!targetGroup) return;

    // Create new attributes array
    const newAttributes = transformedAttributes.map(item => {
      if (item.id === targetGroupId && item.type === 'group') {
        // Add the attribute to this group's children
        const updatedAttribute = {
          ...attribute,
          groupName: targetGroup.name,
          metadata: {
            ...attribute.metadata,
            groupName: targetGroup.name
          }
        };

        return {
          ...item,
          children: [...(item.children || []), updatedAttribute]
        };
      }

      if (item.type === 'group' && item.children) {
        // Remove the attribute from any other group it might be in
        const newChildren = item.children.filter(child => child.id !== attribute.id);
        return {
          ...item,
          children: newChildren
        };
      }

      return item;
    });

    // Remove the attribute from main level if it was standalone
    const filteredAttributes = newAttributes.filter(item => item.id !== attribute.id);

    // Update the state which will trigger the changes tracker
    handleAttributesChange(filteredAttributes);
  };

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  return (
    <Container className={styles.continer}>
      {/* Mobile Message - Whole Page */}
      <div className={styles.mobileMessage}>
        <Text variant="h4" color="secondary">📱 هذه الميزة غير متاحة على الهواتف</Text>
        <Text variant="paragraph" color="secondary">
          إدارة الخصائص متاحة فقط على الشاشات الكبيرة.
        </Text>
      </div>

      {/* Desktop Only - Entire Dashboard */}
      <div className={styles.desktopOnly}>
        <div className={styles.header}>
          <div className={styles.headerMain}>
            <Text variant="h2">إدارة الخصائص</Text>
            <Text variant="paragraph" color="secondary">
              إدارة خصائص التصنيفات وترتيبها
            </Text>
          </div>

          {canCreate && (
            <div className={styles.headerActions}>
              <Button
                variant="primary"
                icon={<Plus size={18} />}
                onClick={handleCreateCategory}
              >
                إنشاء تصنيف
              </Button>
            </div>
          )}
        </div>

        {/* Category Selection */}
        <div className={styles.categorySection}>
          <div className={styles.categorySelector}>
            <Input
              type="select"
              label="اختر التصنيف:"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              options={categories.map(category => ({
                value: category.id,
                label: category.name
              }))}
              placeholder="اختر تصنيف..."
              className={styles.categorySelect}
            />
          </div>

          {selectedCategory && (
            <div className={styles.categoryInfo}>
              <Text variant="paragraph" color="secondary">
                إدارة خصائص تصنيف: <strong>{selectedCategory.name}</strong>
              </Text>
            </div>
          )}
        </div>

        {/* Attributes List */}
        <div className={styles.attributesSection}>
          {loading ? (
            <div className={styles.loadingState}>
              <Text variant="h3" color="secondary">جاري التحميل...</Text>
              <Text variant="paragraph" >
                جاري تحميل خصائص التصنيف
              </Text>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <Text variant="h3" color="error">خطأ في التحميل</Text>
              <Text variant="paragraph" >
                {error}
              </Text>
              <Button
                variant="secondary"
                onClick={() => {
                  if (selectedCategoryId) {
                    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
                    if (selectedCategory) {
                      loadAttributes(selectedCategory.slug);
                    }
                  }
                }}
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : transformedAttributes.length > 0 ? (
            <>
              {/* Actions */}
              <div className={styles.controlsSection}>
                <div className={styles.actionButtons}>
                  {canCreate && (
                    <>
                      <Button
                        variant="outline"
                        icon={<Plus size={16} />}
                        onClick={handleCreateGroup}
                      >
                        إضافة مجموعة
                      </Button>
                      <Button
                        variant="primary"
                        icon={<Plus size={16} />}
                        onClick={handleCreateAttribute}
                      >
                        إضافة خاصية
                      </Button>
                    </>
                  )}

                  {/* Save/Discard Changes Buttons */}
                  {hasUnsavedChanges && (
                    <div className={styles.saveActions}>
                      <Button
                        variant="secondary"
                        onClick={handleDiscardChanges}
                        disabled={isSaving}
                      >
                        تراجع
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSaveChanges}
                        loading={isSaving}
                        disabled={isSaving}
                      >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Group Creation */}
              {creatingNewGroup && (
                <div className={styles.inlineGroupCreate}>
                  <InlineEdit
                    value=""
                    mode="create"
                    onSave={handleSaveNewGroup}
                    onCancel={handleCancelNewGroup}
                    placeholder="اسم المجموعة..."
                    required
                    validate={(value) => {
                      if (!value.trim()) return 'اسم المجموعة مطلوب';
                      if (value.length < 2) return 'اسم المجموعة يجب أن يكون أكثر من حرف واحد';
                      return null;
                    }}
                    className={styles.groupInlineEdit}
                  />
                </div>
              )}

              {/* Sortable Attributes List with Mixed Groups and Fields */}
              <SortableList
                items={transformedAttributes.filter(item => {
                  // Filter out attributes that shouldn't be managed in this panel
                  // These are part of the listing form, not filterable attributes:
                  // - 'title' (عنوان الإعلان): Part of listing form header
                  // - 'description' (الوصف): Part of listing form content
                  const excludedKeys = ['title', 'description'];
                  const attributeKey = item.metadata?.attributeKey;

                  // Exclude if it's a standalone attribute with excluded key
                  if (item.type === 'attribute' && excludedKeys.includes(attributeKey)) {
                    return false;
                  }

                  // Exclude groups that only contain excluded attributes
                  if (item.type === 'group') {
                    // Always show all groups (empty or not) - user can delete manually if needed
                    if (!item.children || item.children.length === 0) {
                      return true;
                    }

                    // For groups with children, check if they have non-excluded attributes
                    const hasNonExcludedChildren = item.children.some(
                      child => !excludedKeys.includes(child.metadata?.attributeKey)
                    );

                    // Show the group even if all children are excluded (user might want to add more)
                    return true;
                  }

                  return true;
                })}
                onItemsChange={handleAttributesChange}
                onItemEdit={canModify ? handleItemEdit : undefined}
                onItemDelete={canDelete ? handleItemDelete : undefined}
                onToggleFilter={handleToggleFilter}
                onExtractFromGroup={canModify ? handleExtractFromGroup : undefined}
                onAddToGroup={canModify ? handleAddToGroup : undefined}
                className={styles.attributesList}
                showActions={canModify || canDelete}

                // Inline editing props
                editingItemId={editingGroupId}
                onInlineEdit={handleEditGroup}
                onCancelInlineEdit={() => setEditingGroupId(null)}
                validateInlineEdit={validateGroupName}
              />
            </>
          ) : (
            <div className={styles.emptyState}>
              <Text variant="h3" color="secondary">لا توجد خصائص</Text>
              <Text variant="paragraph" >
                لا توجد خصائص لتصنيف {selectedCategory?.name || 'هذا'} حتى الآن
              </Text>
              {canCreate && (
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={handleCreateAttribute}
                  className={styles.emptyStateButton}
                >
                  إضافة أول خاصية
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className={styles.helpSection}>
          <Text variant="small" >
            💡 للسحب والإفلات: اضغط على أيقونة ⋮⋮ واسحب لإعادة الترتيب. يمكنك نقل الخصائص بين المجموعات أو خارجها. الخصائص العامة (🌐) تطبق على جميع التصنيفات. استخدم "حفظ التغييرات" لحفظ الترتيب الجديد.
          </Text>
        </div>
      </div>

      {/* Create Category Modal */}
      <CreateCategoryModal
        isVisible={isCreateCategoryModalVisible}
        onClose={() => setIsCreateCategoryModalVisible(false)}
        onSubmit={handleCreateCategorySubmit}
        isLoading={isCreatingCategory}
      />

      {/* Create Attribute Modal */}
      <CreateAttributeModal
        isVisible={isCreateAttributeModalVisible}
        onClose={() => setIsCreateAttributeModalVisible(false)}
        onSubmit={handleCreateAttributeSubmit}
        categoryId={selectedCategoryId}
        isLoading={isCreatingAttribute}
      />

      {/* Edit Attribute Modal */}
      <EditAttributeModal
        isVisible={isEditAttributeModalVisible}
        onClose={() => {
          setIsEditAttributeModalVisible(false);
          setSelectedAttributeForEdit(null);
        }}
        onSubmit={handleEditAttributeSubmit}
        attribute={selectedAttributeForEdit ? getAttributeFromSortableItem(selectedAttributeForEdit) : null}
        isLoading={isUpdatingAttribute}
      />

      {/* Delete Attribute Modal */}
      <DeleteAttributeModal
        isVisible={isDeleteAttributeModalVisible}
        onClose={() => {
          setIsDeleteAttributeModalVisible(false);
          setSelectedAttributeForDelete(null);
        }}
        onConfirm={handleDeleteAttributeSubmit}
        attribute={selectedAttributeForDelete ? getAttributeFromSortableItem(selectedAttributeForDelete) : null}
        isLoading={isDeletingAttribute}
      />
    </Container>
  );
};