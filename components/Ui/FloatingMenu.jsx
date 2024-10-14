import React, { useMemo, useCallback, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import RightArrow from "../../assets/images/icon/rightArrow";
import LeftArrow from "../../assets/images/icon/leftArrow.svg";

const FloatingMenu = ({ handleOptionSelect ,selectedOption}) => {
  // Memoize the menu options since they don't change
  const menuOptions = useMemo(() => ["Year", "Month", "Day"], []);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen]);

  const handleSelect = (option) => {
    setIsMenuOpen(false);
    handleOptionSelect(option);
  };

  return (
    <>
      <TouchableOpacity style={styles.floatingButton} onPress={toggleMenu}>
        {isMenuOpen ? <RightArrow /> : <LeftArrow />}
      </TouchableOpacity>

      {isMenuOpen && (
        <View style={styles.menu}>
          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.menuOption,
                selectedOption === option && styles.menuOptionSelected,
              ]}
              onPress={() => handleSelect(option)}
            >
              <Text
                style={[
                  styles.menuText,
                  selectedOption === option && styles.textSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
};

export default React.memo(FloatingMenu);

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 6,
    right: 14,
    backgroundColor: "#3478F6",
    borderRadius: 999,
    width: 44,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    position: "absolute",
    display: "flex",
    flexDirection: "row",
    bottom: 12,
    right: 60,
    backgroundColor: "#929292",
    borderRadius: 5,
    padding: 2,
    elevation: 5,
  },
  menuOption: {
    color: "#515151",
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  menuOptionSelected: { backgroundColor: "#fff", borderRadius: 5 },
  menuText: { fontSize: 14, fontWeight: "medium", color: "#515151" },
  textSelected: { color: "#000" },
});
