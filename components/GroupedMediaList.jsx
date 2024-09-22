import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import FastImage from "react-native-fast-image";
import { Video } from "expo-av";

const { width } = Dimensions.get("window");

const GroupedMediaList = memo(
  ({ groupedMediaItems, onMediaPress, handleScroll, loadingMoreMedia }) => {
    const renderGroupedMedia = useCallback(
      ({ item }) => {
        const [date, items] = item; // Destructure date and media items

        return (
          <View>
            {/* Render Date Header */}
            <Text style={styles.dateText}>{date}</Text>

            {/* Render Media Items for this date */}
            <FlashList
              data={items}
              estimatedItemSize={110}
              renderItem={({ item, index }) => (
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
              )}
              keyExtractor={(item) => item.id}
              numColumns={3}
            />
          </View>
        );
      },
      [onMediaPress]
    );

    const groupedMediaData = useMemo(() => groupedMediaItems, [groupedMediaItems]);

    return (
      <View style={{ flex: 1 }}>
        <FlashList
          data={groupedMediaData}
          key={"groupMediaItems"}
          keyExtractor={(item, index) => `${item.date}-${index}`}
          renderItem={renderGroupedMedia}
          estimatedItemSize={110}
          numColumns={1}
          onScroll={handleScroll}
          scrollEventThrottle={16}
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

export { GroupedMediaList };

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
    marginTop: 16,
    marginBottom: 8,
    textAlign: "left",
    width: "100%",
  },
});
