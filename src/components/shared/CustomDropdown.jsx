import { useEffect, useRef, useState } from "react";
import ArrowDownIcon from "../icons/ArrowDownIcon";
import CustomInput from "./CustomInput";

const CustomDropdown = ({
  options = [],
  value,
  setValue,
  placeholder = "",
  containerStyle = {},
}) => {
  const [toggle, setToggle] = useState(false);
  const [searchedOptions, setSearchedOptions] = useState([]);
  const ref = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        ref.current &&
        !ref.current.contains(event.target)
      )
        setToggle(false);
    }

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setSearchedOptions(options);
  }, [options])

  const search = (e) => {
    console.log(e.target.value);
    setSearchedOptions(options.filter(o => o.text.includes(e.target.value)));
  }

  return (
    <div
    ref={ref}
    className="custom-dropdown"
      style={containerStyle}
    >
      <div className="custom-dropdown-button" onClick={() => setToggle((t) => !t)}>
        <span>{value ? options.find(op => op.value === value)?.text : placeholder}</span>
        <ArrowDownIcon />
      </div>
      {toggle && (
        <div className="options-container">
          <CustomInput placeholder="جستجو کنید ..." onKeyUp={search} />
          <div className="options">
            {searchedOptions.map((option) => (
              <div key={option.value} onClick={() => {
                setValue(option.value)
                setToggle(false);
              }}>
                {option.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
