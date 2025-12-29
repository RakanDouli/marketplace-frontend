'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { SortableItem } from './SortableItem';
import styles from './SortableList.module.scss';

export interface SortableItemData {
  id: string;
  type: 'group' | 'attribute';
  name: string;
  icon?: React.ReactNode;
  isReadOnly?: boolean;
  groupName?: string; // For attributes - which group they belong to
  children?: SortableItemData[]; // For groups - their child attributes
  metadata?: Record<string, any>;
}

interface SortableListProps {
  items: SortableItemData[];
  onItemsChange: (items: SortableItemData[]) => void;
  onItemEdit?: (item: SortableItemData) => void;
  onItemDelete?: (item: SortableItemData) => void;
  onToggleFilter?: (item: SortableItemData, showInFilter: boolean) => void;
  onExtractFromGroup?: (item: SortableItemData) => void;
  onAddToGroup?: (item: SortableItemData, targetGroupId: string) => void;
  className?: string;
  disabled?: boolean;
  showActions?: boolean;

  // Inline editing props
  editingItemId?: string | null;
  onInlineEdit?: (itemId: string, newName: string) => void;
  onCancelInlineEdit?: (itemId: string) => void;
  validateInlineEdit?: (name: string) => string | null;
}

export const SortableList: React.FC<SortableListProps> = ({
  items,
  onItemsChange,
  onItemEdit,
  onItemDelete,
  onToggleFilter,
  onExtractFromGroup,
  onAddToGroup,
  className,
  disabled = false,
  showActions = true,

  // Inline editing props
  editingItemId,
  onInlineEdit,
  onCancelInlineEdit,
  validateInlineEdit,
}) => {
  const [activeItem, setActiveItem] = useState<SortableItemData | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get all sortable IDs (main level + children for intra-group sorting)
  const getSortableIds = (items: SortableItemData[]): string[] => {
    const ids: string[] = [];
    items.forEach(item => {
      ids.push(item.id);
      if (item.children) {
        ids.push(...item.children.map(child => child.id));
      }
    });
    return ids;
  };

  const findItemRecursive = (items: SortableItemData[], id: string): SortableItemData | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemRecursive(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleToggleCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = findItemRecursive(items, active.id as string);
    setActiveItem(item);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? over.id as string : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    setOverId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find active and over items in the structure
    const activeItem = findItemRecursive(items, activeId);
    const overItem = findItemRecursive(items, overId);

    if (!activeItem || !overItem) return;

    // Case 1: Both items are at main level (groups or standalone fields)
    const activeMainIndex = items.findIndex(item => item.id === activeId);
    const overMainIndex = items.findIndex(item => item.id === overId);

    if (activeMainIndex !== -1 && overMainIndex !== -1) {
      // Main-level reordering
      const newItems = arrayMove(items, activeMainIndex, overMainIndex);
      onItemsChange(newItems);
      return;
    }

    // Case 2: Both items are children of the same group (intra-group sorting)
    const activeGroup = items.find(item =>
      item.children?.some(child => child.id === activeId)
    );
    const overGroup = items.find(item =>
      item.children?.some(child => child.id === overId)
    );

    if (activeGroup && overGroup && activeGroup.id === overGroup.id) {
      // Reorder within the same group
      const activeChildIndex = activeGroup.children!.findIndex(child => child.id === activeId);
      const overChildIndex = activeGroup.children!.findIndex(child => child.id === overId);

      if (activeChildIndex !== -1 && overChildIndex !== -1) {
        const newChildren = arrayMove(activeGroup.children!, activeChildIndex, overChildIndex);
        const newItems = items.map(item =>
          item.id === activeGroup.id
            ? { ...item, children: newChildren }
            : item
        );
        onItemsChange(newItems);
      }
    }

    // Case 3: Cross-group or group-to-child attempts are ignored
    // Use buttons for these operations
  };

  return (
    <div className={`${styles.sortableList} ${className || ''}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext
          items={getSortableIds(items)}
          strategy={verticalListSortingStrategy}
          disabled={disabled}
        >
          <div className={styles.itemsList}>
            {items.map((item) => (
              <SortableItemWithOverState
                key={item.id}
                item={item}
                onEdit={onItemEdit}
                onDelete={onItemDelete}
                onToggleFilter={onToggleFilter}
                onExtractFromGroup={onExtractFromGroup}
                onAddToGroup={onAddToGroup}
                disabled={disabled}
                showActions={showActions}
                overId={overId}
                isCollapsed={collapsedGroups.has(item.id)}
                onToggleCollapse={handleToggleCollapse}
                availableGroups={items.filter(i => i.type === 'group')}

                // Inline editing props
                editingItemId={editingItemId}
                onInlineEdit={onInlineEdit}
                onCancelInlineEdit={onCancelInlineEdit}
                validateInlineEdit={validateInlineEdit}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem ? (
            <div className={styles.dragOverlay}>
              <SortableItem
                item={{
                  ...activeItem,
                  // For groups, hide children during drag to show only header
                  children: activeItem.type === 'group' ? [] : activeItem.children
                }}
                disabled={true}
                showActions={false}
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

// Wrapper component to handle passing overId down to nested items
interface SortableItemWithOverStateProps {
  item: SortableItemData;
  onEdit?: (item: SortableItemData) => void;
  onDelete?: (item: SortableItemData) => void;
  onToggleFilter?: (item: SortableItemData, showInFilter: boolean) => void;
  onExtractFromGroup?: (item: SortableItemData) => void;
  onAddToGroup?: (item: SortableItemData, targetGroupId: string) => void;
  disabled?: boolean;
  showActions?: boolean;
  overId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: (groupId: string) => void;
  availableGroups: SortableItemData[];

  // Inline editing props
  editingItemId?: string | null;
  onInlineEdit?: (itemId: string, newName: string) => void;
  onCancelInlineEdit?: (itemId: string) => void;
  validateInlineEdit?: (name: string) => string | null;
}

const SortableItemWithOverState: React.FC<SortableItemWithOverStateProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleFilter,
  onExtractFromGroup,
  onAddToGroup,
  disabled,
  showActions,
  overId,
  isCollapsed,
  onToggleCollapse,
  availableGroups,

  // Inline editing props
  editingItemId,
  onInlineEdit,
  onCancelInlineEdit,
  validateInlineEdit,
}) => {
  const isOver = overId === item.id;

  return (
    <SortableItem
      item={item}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleFilter={onToggleFilter}
      onExtractFromGroup={onExtractFromGroup}
      onAddToGroup={onAddToGroup}
      disabled={disabled}
      showActions={showActions}
      isOver={isOver}
      overId={overId}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      availableGroups={availableGroups}

      // Inline editing props
      isEditingInline={editingItemId === item.id}
      onInlineEdit={onInlineEdit}
      onCancelInlineEdit={onCancelInlineEdit}
      validateInlineEdit={validateInlineEdit}
    />
  );
};