import React from 'react';
import Image from 'next/image';

interface IconProps {
  size?: number;
  title?: string;
  className?: string;
}

// Base path for car type images
const CAR_TYPES_PATH = '/images/car-types';

// Generic car icon component that loads PNG images
const CarIcon: React.FC<IconProps & { type: string }> = ({
  size = 24,
  title,
  type,
  className
}) => (
  <Image
    src={`${CAR_TYPES_PATH}/${type}.png`}
    alt={title || type}
    width={size}
    height={size}
    className={className}
    style={{ objectFit: 'contain' }}
  />
);

export const SedanIcon: React.FC<IconProps> = (props) => (
  <CarIcon type="sedan" title="سيدان" {...props} />
);

export const SuvIcon: React.FC<IconProps> = (props) => (
  <CarIcon type="suv" title="دفع رباعي" {...props} />
);

export const HatchbackIcon: React.FC<IconProps> = (props) => (
  <CarIcon type="hatchback" title="هاتشباك" {...props} />
);

export const CoupeIcon: React.FC<IconProps> = (props) => (
  <CarIcon type="coupe" title="كوبيه" {...props} />
);

export const ConvertibleIcon: React.FC<IconProps> = (props) => (
  <CarIcon type="convertible" title="قابل للطي" {...props} />
);

export const WagonIcon: React.FC<IconProps> = (props) => (
  <CarIcon type="wagon" title="عائلية" {...props} />
);

export const PickupIcon: React.FC<IconProps> = (props) => (
  <CarIcon type="pickup" title="بيك آب" {...props} />
);

export const MpvIcon: React.FC<IconProps> = (props) => (
  <CarIcon type="mpv" title="متعدد الأغراض" {...props} />
);

export const VanIcon: React.FC<IconProps> = (props) => (
  <CarIcon type="van" title="شاحنة صغيرة" {...props} />
);
