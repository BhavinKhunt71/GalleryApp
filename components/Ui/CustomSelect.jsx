import React, { useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";

const CustomSelect = ({ item, defaultSelect, onPress }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultSelect);
  const [items, setItems] = useState(item);
  const changeValue = (value) => {
    onPress(value);
  };
  return (
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue}
      setItems={setItems}
      onSelectItem={changeValue}
      theme="LIGHT"
      searchable={false}
    />
  );
};

export default CustomSelect;
