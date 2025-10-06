'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Text, Loading, InlineEdit } from '@/components/slices';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/slices';
import { useBrandsStore } from '@/stores/admin/adminBrandsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { validateBrandForm, validateModelForm } from '@/lib/admin/validation/brandValidation';
import { ConfirmDeleteModelModal } from './ConfirmDeleteModelModal';
import { Plus, Edit, Trash2, Save, Check, X } from 'lucide-react';
import styles from './BrandModals.module.scss';

interface Brand {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  externalId?: string | null;
  source: 'manual' | 'sync';
  status: 'active' | 'archived';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Model {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  externalId?: string | null;
  source: 'manual' | 'sync';
  status: 'active' | 'archived';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Local state flags
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

interface EditBrandModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (brandData: UpdateBrandData) => Promise<void>;
  initialData: Brand | null;
  isLoading?: boolean;
}

export interface UpdateBrandData {
  id: string;
  name?: string;
  externalId?: string;
  source?: 'manual' | 'sync';
  status?: 'active' | 'archived';
  aliases?: string[];
}

interface ModelFormData {
  name: string;
  externalId?: string;
  source: 'manual' | 'sync';
  status: 'active' | 'archived';
  aliases?: string[];
}

export const EditBrandModal: React.FC<EditBrandModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  initialData,
  isLoading: parentLoading = false
}) => {
  const { addNotification } = useNotificationStore();
  const {
    models,
    loading,
    loadModels
  } = useBrandsStore();

  // Local models state to track changes
  const [localModels, setLocalModels] = useState<Model[]>([]);

  // Brand form state
  const [brandFormData, setBrandFormData] = useState<UpdateBrandData>({
    id: '',
    name: '',
    externalId: '',
    source: 'manual',
    status: 'active',
    aliases: []
  });
  const [brandValidationErrors, setBrandValidationErrors] = useState<Record<string, string>>({});
  const [brandAliasInput, setBrandAliasInput] = useState('');

  // Inline editing state for models
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [addingNewModel, setAddingNewModel] = useState(false);
  const [modelValidationErrors, setModelValidationErrors] = useState<Record<string, string>>({});

  // Delete model modal state
  const [showDeleteModelModal, setShowDeleteModelModal] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<Model | null>(null);

  // Initialize form data when modal opens
  useEffect(() => {
    if (initialData && isVisible) {
      setBrandFormData({
        id: initialData.id,
        name: initialData.name,
        externalId: initialData.externalId || '',
        source: initialData.source,
        status: initialData.status,
        aliases: []
      });
      // Load models for this brand
      loadModels(initialData.id);
    }
  }, [initialData, isVisible, loadModels]);

  // Sync store models with local models
  useEffect(() => {
    setLocalModels([...models]);
  }, [models]);

  // Handle brand form changes
  const handleBrandInputChange = (field: keyof UpdateBrandData, value: any) => {
    const newFormData = { ...brandFormData, [field]: value };

    // Auto-generate externalId from name in lowercase
    if (field === 'name' && value) {
      newFormData.externalId = value.toLowerCase().replace(/\s+/g, '-');
    }

    setBrandFormData(newFormData);

    // Clear validation error
    if (brandValidationErrors[field]) {
      const newErrors = { ...brandValidationErrors };
      delete newErrors[field];
      setBrandValidationErrors(newErrors);
    }
  };

  // Handle inline model editing
  const handleModelNameSave = (modelId: string, newName: string) => {
    // Update local state only - no API call
    const updatedModels = localModels.map(model =>
      model.id === modelId
        ? {
          ...model,
          name: newName,
          isModified: true // Flag to identify modified models when saving
        }
        : model
    );
    setLocalModels(updatedModels);
    setEditingModelId(null);
  };

  const validateModelName = (name: string) => {
    if (!name.trim()) {
      return 'اسم الموديل مطلوب';
    }
    return null;
  };

  // Brand alias management
  const addBrandAlias = () => {
    if (brandAliasInput.trim() && !brandFormData.aliases?.includes(brandAliasInput.trim())) {
      setBrandFormData({
        ...brandFormData,
        aliases: [...(brandFormData.aliases || []), brandAliasInput.trim()]
      });
      setBrandAliasInput('');
    }
  };

  const removeBrandAlias = (aliasToRemove: string) => {
    setBrandFormData({
      ...brandFormData,
      aliases: brandFormData.aliases?.filter(alias => alias !== aliasToRemove) || []
    });
  };

  // Handle adding new model
  const startAddingNewModel = () => {
    setAddingNewModel(true);
    setModelValidationErrors({});
  };

  const cancelAddingNewModel = () => {
    setAddingNewModel(false);
    setModelValidationErrors({});
  };

  const saveNewModel = (modelName: string) => {
    console.log('Adding new model with name:', modelName);
    if (!initialData) return;

    // Create temporary model with local ID
    const tempModel = {
      id: `temp_${Date.now()}`, // Temporary ID
      brandId: initialData.id,
      name: modelName,
      slug: modelName.toLowerCase().replace(/\s+/g, '-'),
      externalId: modelName.toLowerCase().replace(/\s+/g, '-'),
      source: 'manual' as const,
      status: 'active' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isNew: true // Flag to identify new models when saving
    };

    console.log('Created tempModel:', tempModel);

    // Add to local state only - no API call
    setLocalModels([...localModels, tempModel]);
    setAddingNewModel(false);
    setModelValidationErrors({});
  };

  // Handle brand form submission
  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔥 SAVE BUTTON CLICKED!');
    console.log('📝 Brand form data:', brandFormData);
    console.log('📋 Local models:', localModels);
    console.log('🆕 New models:', localModels.filter(m => m.isNew));
    console.log('✏️ Modified models:', localModels.filter(m => m.isModified));

    // Validate form
    const newValidationErrors = validateBrandForm(brandFormData);
    setBrandValidationErrors(newValidationErrors);

    if (Object.keys(newValidationErrors).length > 0) {
      console.log('❌ Validation errors:', newValidationErrors);
      return;
    }

    try {
      // Format the data to match backend expectations (UpsertBrandInput requires categoryId)
      const formattedBrandData = {
        ...brandFormData,
        categoryId: initialData!.categoryId, // Add categoryId for backend validation
        source: brandFormData.source?.toLowerCase() as 'manual' | 'sync',
        status: brandFormData.status?.toLowerCase() as 'active' | 'archived'
      };

      // First save the brand changes
      console.log('🚀 Calling onSubmit with:', formattedBrandData);
      console.log('📄 Initial data:', initialData);
      await onSubmit(formattedBrandData);
      console.log('✅ Brand onSubmit completed successfully');

      // Then handle all model changes using the store methods
      console.log('🔄 Processing models...');
      let newModelCount = 0;
      let modifiedModelCount = 0;
      let deletedModelCount = 0;

      for (const model of localModels) {
        if (model.isNew) {
          console.log('🆕 Creating new model:', {
            brandId: initialData!.id,
            name: model.name,
            externalId: model.externalId,
            source: model.source,
            status: model.status
          });
          await useBrandsStore.getState().createModel({
            brandId: initialData!.id,
            name: model.name,
            externalId: model.externalId || undefined,
            source: model.source.toLowerCase() as 'manual' | 'sync',
            status: model.status.toLowerCase() as 'active' | 'archived'
          });
          newModelCount++;
        } else if (model.isModified) {
          console.log('✏️ Updating existing model:', {
            id: model.id,
            brandId: initialData!.id,
            name: model.name,
            status: model.status
          });
          await useBrandsStore.getState().updateModel({
            id: model.id,
            brandId: initialData!.id,
            name: model.name,
            status: model.status.toLowerCase() as 'active' | 'archived'
          });
          modifiedModelCount++;
        } else if (model.isDeleted) {
          console.log('🗑️ Skipping deleted model (delete not implemented in backend):', model.id);
          // Note: Backend doesn't have deleteModel mutation, so we skip this
          // The model is already removed from localModels in handleDeleteModel
          deletedModelCount++;
        }
      }

      console.log(`📊 Models processed: ${newModelCount} created, ${modifiedModelCount} modified, ${deletedModelCount} deleted`);

      addNotification({
        type: 'success',
        title: 'تم تحديث العلامة التجارية',
        message: 'تم حفظ تغييرات العلامة التجارية والموديلات بنجاح',
        duration: 3000
      });
    } catch (error) {
      console.error('Save error:', error);
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في حفظ التغييرات. يرجى المحاولة مرة أخرى.',
        duration: 5000
      });
    }
  };

  // Handle model deletion - show modal
  const handleDeleteModel = (model: Model) => {
    setModelToDelete(model);
    setShowDeleteModelModal(true);
  };

  // Confirm model deletion
  const confirmDeleteModel = (model: Model) => {
    // Remove from local state only - no API call
    const filteredModels = localModels.map(m =>
      m.id === model.id
        ? { ...m, isDeleted: true } // Mark as deleted instead of removing
        : m
    ).filter(m => !m.isDeleted || !m.id.startsWith('temp_')); // Remove temp models immediately

    setLocalModels(filteredModels);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModelModal(false);
    setModelToDelete(null);
  };

  const handleClose = () => {
    setBrandFormData({
      id: '',
      name: '',
      externalId: '',
      source: 'manual',
      status: 'active',
      aliases: []
    });
    setBrandAliasInput('');
    setBrandValidationErrors({});

    // Reset inline editing states
    setEditingModelId(null);
    setAddingNewModel(false);
    setModelValidationErrors({});

    // Reset local models to store models
    setLocalModels([...models]);

    onClose();
  };

  const isLoading = parentLoading || loading;

  return (
    <Modal
      isVisible={isVisible}
      onClose={handleClose}
      title={`تعديل العلامة التجارية: ${initialData?.name}`}
      maxWidth="lg"
    >
      <div className={styles.tabContent}>
        {/* Brand Information Section */}
        <div className={styles.section}>
          <Text variant="h3" className={styles.sectionTitle}>معلومات العلامة التجارية</Text>

          <div className={styles.form}>
            {/* Brand Name */}
            <Input
              label="اسم العلامة التجارية *"
              type="text"
              value={brandFormData.name}
              onChange={(e) => handleBrandInputChange('name', e.target.value)}
              error={brandValidationErrors.name}
              disabled={isLoading}
            />

            {/* External ID & Source - Auto-generated, hidden from user */}

            {/* Status */}
            <Input
              label="الحالة"
              type="select"
              value={brandFormData.status}
              onChange={(e) => handleBrandInputChange('status', e.target.value)}
              options={[
                { value: 'active', label: 'نشط' },
                { value: 'archived', label: 'مؤرشف' }
              ]}
              disabled={isLoading}
            />

          </div>
        </div>

        {/* Models Management Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text variant="h3" className={styles.sectionTitle}>الموديلات</Text>
            <Button
              onClick={startAddingNewModel}
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              disabled={isLoading || addingNewModel}
            >
              إضافة موديل
            </Button>
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <Loading />
              <Text variant="paragraph">جاري تحميل الموديلات...</Text>
            </div>
          ) : localModels.length === 0 && !addingNewModel ? (
            <div className={styles.emptyState}>
              <Text variant="paragraph" color="secondary">لا توجد موديلات لهذه العلامة التجارية</Text>
              <Button
                onClick={startAddingNewModel}
                variant="outline"
                size="sm"
                icon={<Plus size={16} />}
              >
                إضافة أول موديل
              </Button>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell isHeader>اسم الموديل</TableCell>
                  <TableCell isHeader>المصدر</TableCell>
                  <TableCell isHeader>الحالة</TableCell>
                  <TableCell isHeader>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Add New Model Row - Show first */}
                {addingNewModel && (
                  <TableRow>
                    <TableCell>
                      <InlineEdit
                        value=""
                        mode="create"
                        onSave={saveNewModel}
                        onCancel={cancelAddingNewModel}
                        placeholder="اسم الموديل الجديد"
                        validate={validateModelName}
                        required
                        tableMode
                      />
                    </TableCell>
                    <TableCell>
                      <span className={`${styles.sourceBadge} ${styles['source-manual']}`}>
                        يدوي
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`${styles.statusBadge} ${styles.active}`}>
                        نشط
                      </span>
                    </TableCell>
                    <TableCell>
                      {/* Actions are handled by InlineEdit component */}
                    </TableCell>
                  </TableRow>
                )}

                {localModels.map(model => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <InlineEdit
                        value={model.name}
                        mode={editingModelId === model.id ? 'edit' : 'view'}
                        onSave={(newName) => handleModelNameSave(model.id, newName)}
                        onCancel={() => setEditingModelId(null)}
                        onModeChange={(mode) => {
                          if (mode === 'edit') {
                            setEditingModelId(model.id);
                          } else {
                            setEditingModelId(null);
                          }
                        }}
                        placeholder="اسم الموديل"
                        validate={validateModelName}
                        required
                        tableMode
                        canEdit={editingModelId === null || editingModelId === model.id}
                      />
                    </TableCell>
                    <TableCell>
                      <span className={`${styles.sourceBadge} ${styles[`source-${model.source}`]}`}>
                        {model.source === 'manual' ? 'يدوي' : 'مزامنة'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`${styles.statusBadge} ${model.status === 'active' ? styles.active : styles.inactive}`}>
                        {model.status === 'active' ? 'نشط' : 'مؤرشف'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className={styles.actions}>
                        {editingModelId !== model.id && (
                          <Button
                            onClick={() => handleDeleteModel(model)}
                            variant="danger"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            title="حذف"
                            disabled={editingModelId !== null || addingNewModel}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              </TableBody>
            </Table>
          )}
        </div>


        {/* Main Modal Actions */}
        <div className={styles.formActions}>
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            disabled={isLoading}
          >
            إغلاق
          </Button>
          <Button
            type="button"
            onClick={async (e) => {
              console.log('Button clicked!');
              e.preventDefault();
              await handleBrandSubmit(e);
            }}
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            icon={<Save size={16} />}
          >
            حفظ تغييرات العلامة التجارية
          </Button>
        </div>
      </div>

      {/* Delete Model Confirmation Modal */}
      <ConfirmDeleteModelModal
        isVisible={showDeleteModelModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteModel}
        model={modelToDelete}
      />
    </Modal>
  );
};