import React from 'react';
import styles from './Aside.module.scss';

export interface AsideProps {
  children: React.ReactNode;
  isOpen?: boolean;
  position?: 'left' | 'right';
  className?: string;
}

export const Aside: React.FC<AsideProps> = ({
  children,
  isOpen = true,
  position = 'left',
  className = '',
}) => {
  return (
    <>
      {/* Overlay for mobile when aside is open */}
      {isOpen && <div className={styles.overlay} />}
      
      {/* Aside panel */}
      <aside 
        className={`
          ${styles.aside} 
          ${styles[position]} 
          ${isOpen ? styles.open : styles.closed}
          ${className}
        `.trim()}
      >
        <div className={styles.content}>
          {children}
        </div>
      </aside>
    </>
  );
};

export default Aside;