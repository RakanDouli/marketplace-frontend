import React from 'react';
import styles from './Container.module.scss';

interface ContainerProps {
  /** Use outer container wrapper */
  outer?: boolean;
  /** Inner container with max-width constraints */
  inner?: boolean;
  /** Custom padding using our spacing tokens */
  padding?: string;
  /** Background color (CSS custom property or hex) */
  backgroundColor?: string;
  /** Background image URL */
  backgroundImage?: string;
  /** Background size property */
  backgroundSize?: 'cover' | 'contain' | 'auto';
  /** Background position */
  backgroundPosition?: string;
  /** Additional CSS classes */
  className?: string;
  /** Child components */
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({
  outer = false,
  inner = false,
  padding,
  backgroundColor,
  backgroundImage,
  backgroundSize = 'cover',
  backgroundPosition = 'center',
  className = '',
  children
}) => {
  // Determine container type - stick to consistent class naming
  let containerClass = styles.container; // Default flexible container
  
  if (outer) {
    containerClass = styles.outerContainer;
  } else if (inner) {
    containerClass = styles.innerContainer;
  }
  
  return (
    <div
      className={`${containerClass} ${className}`}
      style={{
        ...(backgroundColor && { backgroundColor }),
        ...(backgroundImage && {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize,
          backgroundPosition
        }),
        ...(padding && { padding })
      }}
    >
      {children}
    </div>
  );
};

export default Container;