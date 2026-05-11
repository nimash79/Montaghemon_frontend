import * as React from "react";

const PlusIcon = ({ width = 24, height = 24, ...props }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* border with spacing */}
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="#B6BCDF"
      strokeWidth="1.5"
      fill="none"
    />

    {/* plus */}
    <path d="M12 7V17" stroke="#B6BCDF" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 12H17" stroke="#B6BCDF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default PlusIcon;
