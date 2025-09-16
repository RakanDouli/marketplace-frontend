import React from "react";
import styles from "./Loading.module.scss";

interface LoadingProps {
  /** Loading type - default is text, set to "svg" for spinning icon */
  type?: "svg";
  /** Additional CSS classes */
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ type, className = "" }) => {
  if (type === "svg") {
    return (
      <div className={`${styles.loadingSvg} ${className}`}>
        <svg viewBox="0 0 50 50" className={styles.spinner}>
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="31.416"
            strokeDashoffset="31.416"
          >
            <animate
              attributeName="stroke-dasharray"
              dur="2s"
              values="0 31.416;15.708 15.708;0 31.416"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-dashoffset"
              dur="2s"
              values="0;-15.708;-31.416"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
    );
  }

  return (
    <div className={`${styles.threeDots} ${className}`}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  );
};

export default Loading;
