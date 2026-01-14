'use client';

import React, { useState } from 'react';
import { Plus, X, AlertTriangle, Check } from 'lucide-react';
import { Dropdown } from '@/components/slices/Dropdown/Dropdown';
import { Text } from '@/components/slices/Text/Text';
import styles from './CarInspection.module.scss';

type ViewType = 'front' | 'back' | 'left' | 'right' | 'top';

// Damage types - only 2 options: painted or replaced
// Colors are defined in SCSS using CSS variables
export const DAMAGE_TYPES: { value: string; label: string; colorClass: string }[] = [
  { value: 'paint', label: 'دهان', colorClass: 'warning' },      // Orange/amber
  { value: 'replaced', label: 'مُستبدل', colorClass: 'info' },   // Blue
];

type DamageType = string;

// Car parts with percentage positions for each view
// sortOrder matches backend seeder for consistent display order
export const CAR_PARTS = {
  // Front & Back - single point each
  front: { label: 'الأمام', x: 50, y: 50, view: 'front', sortOrder: 1 },
  back: { label: 'الخلف', x: 50, y: 50, view: 'back', sortOrder: 2 },

  // Left side - 4 points VERTICAL (car standing up, front at top)
  left_front: { label: 'الرفرف الأمامي الأيسر', x: 50, y: 12, view: 'left', sortOrder: 3 },
  left_front_door: { label: 'الباب الأمامي الأيسر', x: 50, y: 37, view: 'left', sortOrder: 4 },
  left_rear_door: { label: 'الباب الخلفي الأيسر', x: 50, y: 63, view: 'left', sortOrder: 5 },
  left_rear: { label: 'الرفرف الخلفي الأيسر', x: 50, y: 88, view: 'left', sortOrder: 6 },

  // Right side - 4 points VERTICAL (car standing up, front at top)
  right_front: { label: 'الرفرف الأمامي الأيمن', x: 50, y: 12, view: 'right', sortOrder: 7 },
  right_front_door: { label: 'الباب الأمامي الأيمن', x: 50, y: 37, view: 'right', sortOrder: 8 },
  right_rear_door: { label: 'الباب الخلفي الأيمن', x: 50, y: 63, view: 'right', sortOrder: 9 },
  right_rear: { label: 'الرفرف الخلفي الأيمن', x: 50, y: 88, view: 'right', sortOrder: 10 },

  // Top - 3 points VERTICAL (front of car at top of image)
  hood: { label: 'غطاء المحرك', x: 50, y: 15, view: 'top', sortOrder: 11 },
  roof: { label: 'سقف السيارة', x: 50, y: 50, view: 'top', sortOrder: 12 },
  trunk: { label: 'الصندوق', x: 50, y: 85, view: 'top', sortOrder: 13 },
} as const;

type CarPart = keyof typeof CAR_PARTS;

export interface DamageReport {
  part: CarPart;
  damageType: DamageType;
}

/**
 * Convert backend format (string array) to frontend format (DamageReport array)
 * Backend stores: ["front_paint", "left_front_door_replaced", "hood_paint"]
 * Frontend uses: [{ part: "front", damageType: "paint" }, ...]
 */
export function fromBackendFormat(backendValue: string[] | undefined | null): DamageReport[] {
  if (!backendValue || !Array.isArray(backendValue)) return [];

  const validParts = Object.keys(CAR_PARTS) as CarPart[];
  const validDamageTypes = DAMAGE_TYPES.map(d => d.value);

  return backendValue
    .map(key => {
      // Find the damage type suffix
      const damageType = validDamageTypes.find(dt => key.endsWith(`_${dt}`));
      if (!damageType) return null;

      // Extract the part by removing the damage type suffix
      const partKey = key.slice(0, -(damageType.length + 1)); // +1 for underscore
      if (!validParts.includes(partKey as CarPart)) return null;

      return { part: partKey as CarPart, damageType };
    })
    .filter((item): item is DamageReport => item !== null);
}

/**
 * Convert frontend format (DamageReport array) to backend format (string array)
 * Frontend uses: [{ part: "front", damageType: "paint" }, ...]
 * Backend stores: ["front_paint", "left_front_door_replaced", "hood_paint"]
 */
export function toBackendFormat(damages: DamageReport[]): string[] {
  return damages.map(d => `${d.part}_${d.damageType}`);
}

interface CarInspectionProps {
  value?: DamageReport[];
  onChange?: (damages: DamageReport[]) => void;
  disabled?: boolean;
}

export const CarInspection: React.FC<CarInspectionProps> = ({
  value = [],
  onChange,
  disabled = false,
}) => {
  const [selectedPart, setSelectedPart] = useState<CarPart | null>(null);

  const views: { id: ViewType; label: string; img: string }[] = [
    { id: 'front', label: 'أمام', img: 'front.png' },
    { id: 'back', label: 'خلف', img: 'back.png' },
    { id: 'left', label: 'يسار', img: 'left.png' },
    { id: 'right', label: 'يمين', img: 'right.png' },
    { id: 'top', label: 'أعلى', img: 'top.png' },
  ];

  const getPartsForView = (view: ViewType) => {
    return Object.entries(CAR_PARTS)
      .filter(([_, part]) => part.view === view)
      .map(([key, part]) => ({ key: key as CarPart, ...part }));
  };

  const getDamageForPart = (part: CarPart): DamageReport | undefined => {
    return value.find(d => d.part === part);
  };

  const handlePartClick = (part: CarPart) => {
    if (disabled) return;
    setSelectedPart(selectedPart === part ? null : part);
  };

  const handleDamageSelect = (damageType: DamageType) => {
    if (!selectedPart || !onChange) return;

    const existingIndex = value.findIndex(d => d.part === selectedPart);
    const newDamage: DamageReport = { part: selectedPart, damageType };

    if (existingIndex >= 0) {
      const newValue = [...value];
      newValue[existingIndex] = newDamage;
      onChange(newValue);
    } else {
      onChange([...value, newDamage]);
    }
    setSelectedPart(null);
  };

  const handleRemoveDamage = (part: CarPart) => {
    if (!onChange) return;
    onChange(value.filter(d => d.part !== part));
    setSelectedPart(null);
  };

  const getDamageInfo = (damageType: DamageType) => {
    return DAMAGE_TYPES.find(d => d.value === damageType);
  };

  const renderView = (viewId: ViewType, className?: string) => {
    const view = views.find(v => v.id === viewId)!;
    const imgSrc = `/images/car-inspection/${view.img}`;

    return (
      <div className={`${styles.viewCard} ${className || ''}`}>
        <span className={styles.viewLabel}>{view.label}</span>
        <div className={styles.viewImage}>
          <img src={imgSrc} alt={view.label} />
          {getPartsForView(view.id).map(part => {
            const damage = getDamageForPart(part.key);
            const damageInfo = damage ? getDamageInfo(damage.damageType) : null;
            const isSelected = selectedPart === part.key;
            return (
              <div key={part.key} className={`${styles.hotspotWrapper} ${isSelected ? styles.isOpen : ''}`} style={{ left: `${part.x}%`, top: `${part.y}%` }}>
                <Dropdown
                  isOpen={isSelected}
                  onClose={() => setSelectedPart(null)}
                  align="right"
                  className={styles.dropdownContainer}
                  menuClassName={styles.dropdownMenu}
                  trigger={
                    <button
                      type="button"
                      className={`${styles.hotspot} ${damage ? styles.hasDamage : ''} ${isSelected ? styles.selected : ''} ${damageInfo ? styles[damageInfo.colorClass] : ''}`}
                      onClick={() => handlePartClick(part.key)}
                      disabled={disabled}
                    >
                      {damage ? <AlertTriangle size={14} /> : <Plus size={14} />}
                    </button>
                  }
                >
                  <div className={styles.popupHeader}>
                    <Text variant="small" className={styles.popupTitle}>{part.label}</Text>
                    <button type="button" className={styles.popupClose} onClick={() => setSelectedPart(null)}>
                      <X size={14} />
                    </button>
                  </div>
                  <div className={styles.popupContent}>
                    <div className={styles.damageOptions}>
                      {DAMAGE_TYPES.map(d => (
                        <button
                          key={d.value}
                          type="button"
                          className={`${styles.damageOption} ${styles[d.colorClass]} ${damage?.damageType === d.value ? styles.selected : ''}`}
                          onClick={() => handleDamageSelect(d.value)}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    {damage && (
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => handleRemoveDamage(part.key)}
                      >
                        إزالة
                      </button>
                    )}
                  </div>
                </Dropdown>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Top row: Right, Top, Left side by side (RTL order) */}
      <div className={styles.topRow}>
        {renderView('right', styles.sideView)}
        {renderView('top', styles.topView)}
        {renderView('left', styles.sideView)}
      </div>

      {/* Bottom row: Front and Back */}
      <div className={styles.bottomRow}>
        {renderView('front', styles.frontBack)}
        {renderView('back', styles.frontBack)}
      </div>

      {/* Summary - grouped by view */}
      {value.length > 0 ? (
        <div className={styles.summary}>
          {/* Group damages by view */}
          {(['front', 'back', 'left', 'right', 'top'] as ViewType[]).map(viewType => {
            const viewDamages = value
              .filter(d => CAR_PARTS[d.part].view === viewType)
              .sort((a, b) => CAR_PARTS[a.part].sortOrder - CAR_PARTS[b.part].sortOrder);

            if (viewDamages.length === 0) return null;

            const viewLabels: Record<ViewType, string> = {
              front: 'الأمام',
              back: 'الخلف',
              left: 'الجانب الأيسر',
              right: 'الجانب الأيمن',
              top: 'الأعلى',
            };

            return (
              <div key={viewType} className={styles.summaryGroup}>
                <Text variant="small" className={styles.summaryGroupTitle}>{viewLabels[viewType]}</Text>
                <div className={styles.summaryGroupItems}>
                  {viewDamages.map(d => {
                    const info = getDamageInfo(d.damageType);
                    return (
                      <span key={d.part} className={`${styles.summaryItem} ${info ? styles[info.colorClass] : ''}`}>
                        {CAR_PARTS[d.part].label}: {info?.label}
                        {!disabled && (
                          <button type="button" onClick={() => handleRemoveDamage(d.part)}><X size={12} /></button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.noIssues}>
          <Check size={16} /> لا توجد ملاحظات
        </div>
      )}
    </div>
  );
};

export default CarInspection;
