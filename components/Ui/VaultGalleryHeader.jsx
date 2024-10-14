import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BackIcon from "../../assets/images/icon/back.svg";

const GalleryHeader = ({  headerTitle, backNavigation }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={backNavigation} style={styles.button}>
        <BackIcon />
      </TouchableOpacity>

      {headerTitle ? (
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      ) : null}
      <View style={styles.headerActions}></View>
    </View>
  );
};

export default memo(GalleryHeader);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // paddingHorizontal: 20,
    paddingBottom: 16,

  },
  button: {
    width: 36,
    aspectRatio: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    elevation: 8,
    borderRadius: 99,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
});
