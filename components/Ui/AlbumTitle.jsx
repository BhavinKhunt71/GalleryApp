import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";

const AlbumTitle = ({ headerTitle,title }) => {
  return (
    <View style={styles.albumContainer}>
      {!headerTitle ? <Text style={styles.albumText}>{title}</Text> : null}
    </View>
  );
};

export default memo(AlbumTitle);

const styles = StyleSheet.create({
  albumContainer: {
    paddingTop: 16,
  },
  albumText: {
    fontSize: 30,
    fontWeight: "bold",
    paddingBottom: 24,
  },
});
