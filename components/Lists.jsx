import React, { memo, useCallback, useMemo } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import FastImage from "react-native-fast-image";
import { Video } from "expo-av";

// FlashList component for rendering media items
const MediaList = memo(({ mediaAlbumItems, onMediaPress, handleScroll, loadingMoreMedia }) => {
  const renderMediaItem = useCallback(
    ({ item, index }) => {
      return (
        <View style={styles.itemsContainer}>
          <TouchableOpacity onPress={() => onMediaPress(index)} style={styles.mediaItem}>
            {item.mediaType === "photo" ? (
              <FastImage
                source={{
                  uri: item.uri,
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.mediaImage}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <Video
                source={{ uri: item.uri }}
                style={styles.mediaImage}
                useNativeControls
                resizeMode="cover"
                isLooping
              />
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [onMediaPress] // only re-create the function if onMediaPress changes
  );

  return (
   <FlashList
          data={mediaAlbumItems}
          keyExtractor={(item) => item.id}
          key={"mediaItems"}
          renderItem={selectedAlbum ? renderMediaItem : renderAlbumItem}
          numColumns={3}
          onScroll={selectedAlbum && handleScroll}
          scrollEventThrottle={16} // Control how frequently the onScroll event fires
          estimatedItemSize={110}
          ListFooterComponent={
            loadingMoreMedia ? (
              <ActivityIndicator size="large" color="#00ff00" />
            ) : null
          }
        />
  );
});


export { MediaList };

const styles = StyleSheet.create({
    mediaItem: {
      margin: 1,
    },
    mediaImage: {
      width: (width - 36) / 3,
      aspectRatio: 1,
      borderRadius: 7,
    },
    itemsContainer: {
      display: "flex",
      flexDirection: "column",
    },
    dateText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
      marginTop: 50,
      marginBottom: 8,
      textAlign: "left",
      width: "100%",
    },
  });
  