/**
 * Shared brand + report-type SVGs for header, home cards, and prompts.
 */

type IconProps = {
  className?: string;
  title?: string;
};

export function BrandMark({ className = "h-5 w-5", title }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {/* Document body */}
      <path
        d="M9 4.5h9.2L24 10.3V26a2.5 2.5 0 0 1-2.5 2.5h-12A2.5 2.5 0 0 1 7 26V7a2.5 2.5 0 0 1 2-2.5Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      <path
        d="M9 4.5h9.2L24 10.3V26a2.5 2.5 0 0 1-2.5 2.5h-12A2.5 2.5 0 0 1 7 26V7a2.5 2.5 0 0 1 2-2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Folded corner */}
      <path
        d="M18.2 4.5V8.8c0 .83.67 1.5 1.5 1.5H24"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Checklist ticks */}
      <path
        d="M11.2 15.2 13 17l3.6-3.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.2 20.6 13 22.4l3.6-3.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 16.5h4.2M18.5 21.8h4.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Plan / checklist for Today's Task */
export function IconTodayTask({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect
        x="6"
        y="5"
        width="20"
        height="23"
        rx="3.5"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 5.2V4a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 20 4v1.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="m11 13.5 2 2 4.2-4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m11 20.5 2 2 4.2-4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 14.5H23M19.5 21.5H23"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Document with status pulse for Daily Report */
export function IconDailyReport({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M8.5 5h10.5L24 10.5V26a3 3 0 0 1-3 3H8.5A2.5 2.5 0 0 1 6 26.5v-19A2.5 2.5 0 0 1 8.5 5Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M19 5.2V9.8c0 .72.58 1.3 1.3 1.3H24"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10 15.5h8.5M10 20h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {/* Status chips */}
      <circle cx="22.5" cy="19.5" r="3.4" fill="currentColor" fillOpacity="0.2" />
      <path
        d="m20.9 19.6 1.1 1.1 2.1-2.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Analytics / layered breakdown for Detailed Report */
export function IconDetailedReport({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect
        x="5"
        y="5"
        width="22"
        height="22"
        rx="4"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* Bars */}
      <path
        d="M10 22V14.5M15.5 22V10M21 22v-5.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Goal ring */}
      <circle
        cx="22"
        cy="10.5"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M22 8.8v1.7l1.2.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
