import React, { memo, useCallback, useMemo } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import FastImage from "react-native-fast-image";
import { Video } from "expo-av";

const { width } = Dimensions.get("window");

// FlashList component for rendering media items
const MediaList = memo(
  ({
    mediaAlbumItems,
    onMediaPress,
    handleScroll,
    selectedAlbum,
    loadMediaFromAlbum,
    loadingMoreMedia,
  }) => {
    const renderAlbumItem = useCallback(({ item }) => {
      if (item.empty) {
        return <View style={[styles.mediaItem, styles.invisible]} />; // Invisible placeholder
      }
      return (
        <TouchableOpacity
          onPress={() => loadMediaFromAlbum(item.id, item.title)}
          style={styles.albumItem}
        >
          {item.firstMedia.mediaType === "photo" ? (
            <FastImage
              source={{
                uri: item.firstMedia.uri,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.albumImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <Video
              source={{ uri: item.firstMedia.uri }}
              style={styles.albumImage}
              resizeMode="cover"
              isLooping
              useNativeControls={false}
            />
          )}
          <View style={styles.albumInfo}>
            <Text style={styles.albumTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.albumCount}>{item.totalCount}</Text>
          </View>
        </TouchableOpacity>
      );
    }, [loadMediaFromAlbum]);
    
    const renderMediaItem = useCallback(({ item, index }) => {
      return (
        <View style={styles.itemsContainer}>
          <TouchableOpacity
            onPress={() => onMediaPress(index)}
            style={styles.mediaItem}
          >
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
    }, [onMediaPress]);
    
    const mediaData = useMemo(() => mediaAlbumItems, [mediaAlbumItems]);
    return (
      <View style={{ flex: 1 }}>
        <FlashList
          data={mediaData}
          keyExtractor={(item) => item.id}
          key={"mediaALbumItems"}
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
      </View>
    );
  }
);

export { MediaList };

const styles = StyleSheet.create({
  mediaItem: {
    margin: 1,
  },
  albumItem: {
    flex: 1,
    // margin: 2,
    overflow: "hidden",
  },
  albumImage: {
    width: (width - 36) / 3,
    aspectRatio: 1,
    borderRadius: 7,
    // objectFit: "contain"
  },
  albumInfo: {
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  albumTitle: {
    fontSize: 16,
    width: (width - 36) / 3,
    fontWeight: "bold",
  },
  albumCount: {
    fontSize: 12,
    color: "#888",
  },
  albumContainer: {
    paddingTop: 16,
  },
  albumText: {
    fontSize: 30,
    fontWeight: "bold",
    paddingBottom: 24,
  },
  invisible: {
    backgroundColor: "transparent",
    width: (width - 36) / 3,
    aspectRatio: 1,
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
