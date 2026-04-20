const MusicIcon = ({ width = 24, height = 24, color = "#7B61FF" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 3v10.55c-.47-.34-1.06-.55-1.75-.55-1.66 0-3 1.12-3 2.5s1.34 2.5 3 2.5 3-1.12 3-2.5V7h4V3h-5z"
        fill={color}
      />
    </svg>
  );
};

export default MusicIcon;