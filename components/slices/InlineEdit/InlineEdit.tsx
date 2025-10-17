'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Edit, Check, X, Plus } from 'lucide-react';
import styles from './InlineEdit.module.scss';

interface InlineEditProps {
  // Main props
  value: string;
  onSave: (value: string) => void;
  onCancel?: () => void;

  // Display props
  placeholder?: string;
  emptyText?: string;

  // Modes
  mode: 'view' | 'edit' | 'create';
  onModeChange?: (mode: 'view' | 'edit' | 'create') => void;

  // Validation
  validate?: (value: string) => string | null;
  required?: boolean;

  // Styling
  className?: string;
  inputType?: 'text' | 'email' | 'number';
  tableMode?: boolean; // For table-specific styling

  // Permissions
  canEdit?: boolean;

  // Create mode specific
  createText?: string;
  showCreateButton?: boolean;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  onCancel,
  placeholder = 'أدخل القيمة...',
  emptyText = 'انقر للتعديل',
  mode,
  onModeChange,
  validate,
  required = false,
  className = '',
  inputType = 'text',
  tableMode = false,
  canEdit = true,
  createText = 'إضافة جديد',
  showCreateButton = false,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  // Sync local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Clear error when switching modes
  useEffect(() => {
    setError(null);
  }, [mode]);

  const handleSave = () => {
    // Validation
    if (required && !localValue.trim()) {
      setError('هذا الحقل مطلوب');
      return;
    }

    if (validate) {
      const validationError = validate(localValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Save and switch to view mode
    onSave(localValue);
    onModeChange?.('view');
    setError(null);
  };

  const handleCancel = () => {
    // Reset to original value
    setLocalValue(value);
    onCancel?.();
    onModeChange?.('view');
    setError(null);
  };

  const handleStartEdit = () => {
    if (canEdit) {
      onModeChange?.('edit');
    }
  };

  const handleStartCreate = () => {
    setLocalValue('');
    onModeChange?.('create');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Create mode
  if (mode === 'create') {
    const createClasses = [
      styles.inlineEdit,
      styles.createMode,
      tableMode ? styles.tableMode : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <div className={createClasses}>
        <div className={styles.inputGroup}>
          <Input
            type={inputType}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            autoFocus
            className={styles.input}
            error={error || undefined}
          />
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="sm"
              icon={<Check size={14} />}
              onClick={handleSave}
              aria-label="حفظ"
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<X size={14} />}
              onClick={handleCancel}
              aria-label="إلغاء"
            />
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  if (mode === 'edit') {
    const editClasses = [
      styles.inlineEdit,
      styles.editMode,
      tableMode ? styles.tableMode : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <div className={editClasses}>
        <div className={styles.inputGroup}>
          <Input
            type={inputType}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            autoFocus
            className={styles.input}
            error={error || undefined}
          />
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="sm"
              icon={<Check size={14} />}
              onClick={handleSave}
              aria-label="حفظ"
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<X size={14} />}
              onClick={handleCancel}
              aria-label="إلغاء"
            />
          </div>
        </div>
      </div>
    );
  }

  // View mode
  const viewClasses = [
    styles.inlineEdit,
    styles.viewMode,
    tableMode ? styles.tableMode : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={viewClasses}>
      {value ? (
        <div className={styles.valueDisplay} onClick={handleStartEdit}>
          <span className={styles.value}>{value}</span>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit size={14} />}
              onClick={handleStartEdit}
              aria-label="تعديل"
              className={styles.editButton}
            />
          )}
        </div>
      ) : (
        <div className={styles.emptyState}>
          {showCreateButton ? (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={14} />}
              onClick={handleStartCreate}
              className={styles.createButton}
            >
              {createText}
            </Button>
          ) : (
            <span className={styles.emptyText} onClick={canEdit ? handleStartEdit : undefined}>
              {emptyText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};