import React, { useState } from "react";
import CheckmarkIcon from "../icons/CheckmarkIcon";

const CustomCheckbox = ({checked = false, onChange, ...props}) => {
  return (
    <div className={checked ? "custom-checkbox active" : "custom-checkbox"} data-sound-click onClick={onChange} {...props}>
      {checked && <CheckmarkIcon />}
    </div>
  );
};
export default CustomCheckbox;