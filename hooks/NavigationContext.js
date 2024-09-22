// NavigationContext.js
import React, { createContext, useContext, useState } from "react";

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [selectedOption, setSelectedOption] = useState("Year");
  const [showJumpToDatePopup, setShowJumpToDatePopup] = useState(false); // Add this line
  const [selectedCountry, setSelectedCountry] = useState({
    label: "India",
    value: "IN",
  });

  return (
    <NavigationContext.Provider
      value={{
        selectedOption,
        setSelectedOption,
        showJumpToDatePopup,
        setShowJumpToDatePopup,
        selectedCountry,
        setSelectedCountry,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  return useContext(NavigationContext);
};
