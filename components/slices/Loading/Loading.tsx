import React from "react";
import styles from "./Loading.module.scss";

interface LoadingProps {
  /** Loading type - default is text, set to "svg" for brand icon animation */
  type?: "svg";
  /** Size of the loader */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ type, size = "lg", className = "" }) => {
  if (type === "svg") {
    return (
      <div className={`${styles.loadingSvg} ${styles[size]} ${className}`}>
        <svg viewBox="0 0 60 148" className={styles.brandIcon} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Bottom large shape */}
          <path
            className={styles.path1}
            d="M10.5635 85.3328L54.6858 69.2543C57.5764 68.201 59.5 65.4527 59.5 62.3762C59.5 57.317 54.4908 53.7829 49.7246 55.4794L5.48291 71.2264C2.49533 72.2898 0.5 75.1179 0.5 78.2891C0.5 83.4938 5.67343 87.1148 10.5635 85.3328Z"
            stroke="currentColor"
          />
          {/* Top bar */}
          <path
            className={styles.path2}
            d="M24.2609 22.6615L56.152 11.631C58.1558 10.9379 59.5 9.05069 59.5 6.93037C59.5 3.52696 56.1586 1.12886 52.9342 2.21818L20.9645 13.0187C18.8939 13.7183 17.5 15.6605 17.5 17.8461C17.5 21.3481 20.9513 23.8063 24.2609 22.6615Z"
            stroke="currentColor"
          />
          {/* Second bar */}
          <path
            className={styles.path3}
            d="M24.2609 39.6615L56.152 28.631C58.1558 27.9379 59.5 26.0507 59.5 23.9304C59.5 20.527 56.1586 18.1289 52.9342 19.2182L20.9645 30.0187C18.8939 30.7183 17.5 32.6605 17.5 34.8461C17.5 38.3481 20.9513 40.8063 24.2609 39.6615Z"
            stroke="currentColor"
          />
          {/* Third bar */}
          <path
            className={styles.path4}
            d="M24.2609 56.6615L56.152 45.631C58.1558 44.9379 59.5 43.0507 59.5 40.9304C59.5 37.527 56.1586 35.1289 52.9342 36.2182L20.9645 47.0187C18.8939 47.7183 17.5 49.6605 17.5 51.8461C17.5 55.3481 20.9513 57.8063 24.2609 56.6615Z"
            stroke="currentColor"
          />
          {/* Left vertical bar */}
          <path
            className={styles.path5}
            d="M11.5 57.035V23.2009C11.5 19.5743 8.05162 16.9405 4.55285 17.8947C2.16002 18.5473 0.5 20.7206 0.5 23.2009V57.035C0.5 60.7408 4.09035 63.3861 7.62972 62.288C9.93129 61.574 11.5 59.4448 11.5 57.035Z"
            stroke="currentColor"
          />
          {/* Bottom circle with hole */}
          <path
            className={styles.path6}
            d="M49.7246 78.4792C54.4908 76.7829 59.5 80.3176 59.5 85.3767C59.4998 88.4531 57.576 91.2013 54.6855 92.2546L47.6104 94.8318C54.8262 100.209 59.4999 108.809 59.5 118.5C59.5 134.792 46.2924 148 30 148C13.7076 148 0.5 134.792 0.5 118.5C0.500045 114.342 1.36183 110.385 2.91406 106.798C1.44819 105.45 0.5 103.515 0.5 101.289C0.500167 98.1179 2.49517 95.2898 5.48242 94.2263L49.7246 78.4792ZM29.5 103C21.2158 103 14.5002 109.716 14.5 118C14.5 126.284 21.2157 133 29.5 133C37.7843 133 44.5 126.284 44.5 118C44.4998 109.716 37.7842 103 29.5 103Z"
            stroke="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
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
