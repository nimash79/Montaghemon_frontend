import * as React from "react";

const CheckIcon = ({
  width = 24,
  height = 24,
  borderColor = "#B6BCDF",
  color = "#B6BCDF",
  borderWidth = 1.5,
  ...props
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* border */}
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke={borderColor}
      strokeWidth={borderWidth}
      fill="none"
    />

    {/* check */}
    <path
      d="M7 12.5L10.5 16L17 9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CheckIcon;
