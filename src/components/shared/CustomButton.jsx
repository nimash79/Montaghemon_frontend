import { Link } from "react-router";

const CustomButton = ({
  text,
  link = false,
  route = "",
  outline = false,
  className = "",
  ...props
}) => {
  if (link)
    return (
      <Link
        to={route}
        className={outline ? `custom-button outline ${className}` : `custom-button ${className}`}
        {...props}
      >
        {text}
      </Link>
    );
  else
    return (
      <button
        type="button"
        className={outline ? `custom-button outline ${className}` : `custom-button ${className}`}
        {...props}
      >
        {text}
      </button>
    );
};

export default CustomButton;
