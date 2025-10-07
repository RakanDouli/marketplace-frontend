'use client';

import React, { useState } from 'react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { InlineEdit } from '../InlineEdit/InlineEdit';
import styles from './SortableItem.module.scss';
import { SortableItemData } from './SortableList';

interface SortableItemProps {
  item: SortableItemData;
  onEdit?: (item: SortableItemData) => void;
  onDelete?: (item: SortableItemData) => void;
  onToggleFilter?: (item: SortableItemData, showInFilter: boolean) => void;
  onExtractFromGroup?: (item: SortableItemData) => void;
  onAddToGroup?: (item: SortableItemData, targetGroupId: string) => void;
  disabled?: boolean;
  showActions?: boolean;
  isDragging?: boolean;
  isOver?: boolean;
  overId?: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: (groupId: string) => void;
  availableGroups?: SortableItemData[];

  // Inline editing props
  isEditingInline?: boolean;
  onInlineEdit?: (itemId: string, newName: string) => void;
  onCancelInlineEdit?: (itemId: string) => void;
  validateInlineEdit?: (name: string) => string | null;
}

export const SortableItem: React.FC<SortableItemProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleFilter,
  onExtractFromGroup,
  onAddToGroup,
  disabled = false,
  showActions = true,
  isDragging = false,
  isOver = false,
  overId = null,
  isCollapsed = false,
  onToggleCollapse,
  availableGroups = [],

  // Inline editing props
  isEditingInline = false,
  onInlineEdit,
  onCancelInlineEdit,
  validateInlineEdit,
}) => {
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: item.id,
    disabled: disabled || item.isReadOnly,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isGroup = item.type === 'group';

  // Global attributes cannot be edited or deleted - only reordered and filter-toggled
  const isGlobalAttribute = item.metadata?.isGlobal;

  const canEdit = showActions && onEdit && !item.isReadOnly && !isGlobalAttribute;
  const canDelete = showActions && onDelete && !item.isReadOnly && !isGlobalAttribute;
  const canDrag = !disabled && !item.isReadOnly;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canEdit) {
      onEdit!(item);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canDelete) {
      onDelete!(item);
    }
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggle clicked for group:', item.name, 'isCollapsed:', isCollapsed, 'children:', item.children?.length);
    if (isGroup && item.children && item.children.length > 0 && onToggleCollapse) {
      onToggleCollapse(item.id);
    }
  };


  const handleToggleMoveDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMoveDropdown(!showMoveDropdown);
  };

  const handleMoveToGeneral = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onExtractFromGroup && item.groupName) {
      onExtractFromGroup(item);
      setShowMoveDropdown(false);
    }
  };

  const handleMoveToGroup = (e: React.MouseEvent, targetGroupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToGroup) {
      onAddToGroup(item, targetGroupId);
      setShowMoveDropdown(false);
    }
  };


  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${styles.sortableItem}
        ${isGroup ? styles.groupItem : styles.attributeItem}
        ${item.isReadOnly ? styles.readOnly : ''}
        ${isSortableDragging || isDragging ? styles.dragging : ''}
        ${isOver ? styles.dragOver : ''}
      `}
    >
      <div className={styles.itemContent}>
        {/* Drag Handle */}
        {canDrag && (
          <div
            className={styles.dragHandle}
            {...attributes}
            {...listeners}
            aria-label="اسحب لإعادة الترتيب"
          >
            <GripVertical size={16} />
          </div>
        )}

        {/* Move/Sort Button */}
        {!isGroup && showActions && (onExtractFromGroup || onAddToGroup) && (
          <div className={styles.moveDropdown}>
            <div
              className={`${styles.moveButton} ${showMoveDropdown ? styles.moveButtonActive : ''}`}
              onClick={handleToggleMoveDropdown}
              aria-label="نقل العنصر"
              title="نقل العنصر"
            >
              <ArrowUpDown size={16} />
            </div>
            {showMoveDropdown && (
              <div className={styles.moveDropdownMenu}>
                {/* If item is in a group, show "Move to General" */}
                {item.groupName &&
                 item.groupName.trim() !== '' &&
                 item.groupName !== 'بدون مجموعة' &&
                 item.groupName !== 'عام' &&
                 onExtractFromGroup && (
                  <button
                    className={styles.dropdownItem}
                    onClick={handleMoveToGeneral}
                  >
                    اخراج من المجموعه </button>
                )}

                {/* If item is not in a group, show available groups */}
                {(!item.groupName ||
                  item.groupName.trim() === '' ||
                  item.groupName === 'بدون مجموعة' ||
                  item.groupName === 'عام') &&
                 onAddToGroup &&
                 availableGroups.length > 0 && (
                  <>
                    <div className={styles.dropdownLabel}>نقل إلى:</div>
                    {availableGroups.map((group) => (
                      <button
                        key={group.id}
                        className={styles.dropdownItem}
                        onClick={(e) => handleMoveToGroup(e, group.id)}
                      >
                        {group.name}
                      </button>
                    ))}
                  </>
                )}

                {/* If item is in a group, show other available groups */}
                {item.groupName &&
                 item.groupName.trim() !== '' &&
                 item.groupName !== 'بدون مجموعة' &&
                 item.groupName !== 'عام' &&
                 onAddToGroup &&
                 availableGroups.length > 0 && (
                  <>
                    <div className={styles.dropdownSeparator}></div>
                    {/* <div className={styles.dropdownLabel}>نقل إلى مجموعة أخرى:</div> */}
                    {availableGroups
                      .filter(group => group.name !== item.groupName)
                      .map((group) => (
                        <button
                          key={group.id}
                          className={styles.dropdownItem}
                          onClick={(e) => handleMoveToGroup(e, group.id)}
                        >
                          نقل إلى {group.name}
                        </button>
                      ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Item Icon & Content */}
        <div className={styles.itemMain}>
          {isGroup && (
            <div
              className={styles.groupToggle}
              onClick={handleToggleCollapse}
              style={{ cursor: 'pointer' }}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </div>
          )}

          {item.icon && (
            <div className={styles.itemIcon}>
              {item.icon}
            </div>
          )}

          <div className={styles.itemInfo}>
            <div className={styles.itemName}>
              {isGroup && isEditingInline ? (
                <InlineEdit
                  value={item.name}
                  mode="edit"
                  onSave={(newName) => onInlineEdit?.(item.id, newName)}
                  onCancel={() => onCancelInlineEdit?.(item.id)}
                  placeholder="اسم المجموعة..."
                  validate={validateInlineEdit}
                  required
                />
              ) : (
                <div
                  onClick={isGroup ? handleToggleCollapse : undefined}
                  style={isGroup ? { cursor: 'pointer' } : {}}
                >
                  {item.name}

                </div>
              )}
              {isGroup && item.children && (
                <div className={styles.groupMeta}>
                  ({item.children.length} عنصر)
                </div>
              )}
            </div>

            {item.isReadOnly && (
              <div className={styles.readOnlyBadge}>
                للقراءة فقط
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className={styles.itemActions}>
            {/* Show in Filter Toggle */}
            {!isGroup && onToggleFilter && (

              <Input
                type="switch"
                label="عرض في الفلاتر"
                className={styles.filterToggle}
                checked={item.metadata?.showInFilter || false}
                onChange={(e) => {
                  if (onToggleFilter) {
                    onToggleFilter(item, (e.target as HTMLInputElement).checked);
                  }
                }}
              />


            )}


            {/* Edit/Delete Actions */}
            {(canEdit || canDelete) && (
              <>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Edit2 size={14} />}
                    onClick={handleEdit}
                    aria-label="تعديل"
                  />
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    onClick={handleDelete}
                    aria-label="حذف"
                    className={styles.deleteButton}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Child Items (for groups) */}
      {
        isGroup && item.children && item.children.length > 0 && !isCollapsed && (
          <div className={styles.childItems}>
            {item.children.map((child) => (
              <SortableItem
                key={child.id}
                item={child}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleFilter={onToggleFilter}
                onExtractFromGroup={onExtractFromGroup}
                onAddToGroup={onAddToGroup}
                disabled={disabled}
                showActions={showActions}
                isOver={overId === child.id}
                overId={overId}
                isCollapsed={false}
                onToggleCollapse={onToggleCollapse}
                availableGroups={availableGroups}
              />
            ))}
          </div>
        )
      }
    </div>
  );
};