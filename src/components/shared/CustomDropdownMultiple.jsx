import { useEffect, useRef, useState } from "react";
import ArrowDownIcon from "../icons/ArrowDownIcon";
import CustomInput from "./CustomInput";

const CustomDropdownMultiple = ({
  options = [],
  values,
  setValues,
  placeholder = "",
  containerStyle = {},
}) => {
  const [toggle, setToggle] = useState(false);
  const [searchedOptions, setSearchedOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
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

  useEffect(() => {
    setSelectedOptions(values);
  }, [values])

  

  const search = (e) => {
    setSearchedOptions(options.filter(o => o.text.includes(e.target.value)));
  }

  const toggleValue = (option) => {
    setSelectedOptions((prev) => {
      if (prev.includes(option)) {
        setValues(prev.filter((o) => o !== option))
        return prev.filter((o) => o !== option);
      } else {
        setValues([...prev, option])
        return [...prev, option];
      }
    });
  };


  return (
    <div
      ref={ref}
      className="custom-dropdown"
      style={containerStyle}
    >
      <div className="custom-dropdown-button" onClick={() => setToggle((t) => !t)}>
        <span>{selectedOptions.length ? selectedOptions.map(v => v.text).join(", ") : placeholder}</span>
        <ArrowDownIcon />
      </div>
      {toggle && (
        <div className="options-container">
          <CustomInput placeholder="جستجو کنید ..." onKeyUp={search} />
          <div className="options">
            {searchedOptions.map((option) => (
              <div key={option.value} className={selectedOptions.includes(option) ? "active" : ""} onClick={() => toggleValue(option)}>
                {option.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdownMultiple;
