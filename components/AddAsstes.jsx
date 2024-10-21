import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import Selected from "../assets/images/icon/selected.svg";
import FastImage from "react-native-fast-image";
import { formatDuration, getIdVaultData } from "../constants/utils";

const { width, height } = Dimensions.get("window");

const MediaPicker = ({ addAssetModelVisible, type, onClose, onDone }) => {
  const [media, setMedia] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(null); // For pagination
  const [hasMoreMedia, setHasMoreMedia] = useState(true); // Track if there are more media items
  const [types, setTypes] = useState(type);
  const [refreshing, setRefreshing] = useState(false);
  const MEDIA_LIMIT = 50; // Fetch 50 items per request

  // Fetch media based on type (image or video)
  useEffect(() => {
    const fetchInitialMedia = async () => {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.granted) {
        await loadMedia(); // Load first 50 items
      }
    };

    fetchInitialMedia();
  }, [types]);

  // Load media with pagination
  const loadMedia = async () => {
    setLoading(true);
    if (!hasMoreMedia) return;
    // Fetch data from getIdvaultData
    const idVaultData = await getIdVaultData();

    // Extract the names (filenames) from idVaultData
    const idVaultNames = idVaultData.map((item) => item.name);

    const mediaAssets = await MediaLibrary.getAssetsAsync({
      mediaType:
        types === "video"
          ? MediaLibrary.MediaType.video
          : MediaLibrary.MediaType.photo,
      first: MEDIA_LIMIT, // Limit to 50 items per fetch
      after: nextPage ? nextPage : null, // Use endCursor for pagination
    });

    const filteredAssets = mediaAssets.assets.filter(
      (asset) => !idVaultNames.includes(asset.filename)
    );

    setMedia([...media, ...filteredAssets]); // Append new media to the list
    setHasMoreMedia(mediaAssets.hasNextPage);
    setNextPage(mediaAssets.endCursor);
    setLoading(false);
  };

  const handleSelectMedia = (item) => {
    const mediaObj = {
      id: item.id,
      albumId: item.albumId,
      name: item.filename,
    };
    const isSelected = selectedMedia.some((item) => item.id === mediaObj.id);
    if (isSelected) {
      setSelectedMedia(selectedMedia.filter((data) => data.id !== item.id));
    } else {
      setSelectedMedia([...selectedMedia, mediaObj]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedia();
    setRefreshing(false);
  } 
  const renderItem = ({ item }) => {
    const mediaObj = { id: item.id, albumId: item.albumId };
    const isSelected = selectedMedia.some((item) => item.id === mediaObj.id);
    // const isSelected = selectedMedia.includes(item.id);
    return (
      <TouchableOpacity
        onPress={() => handleSelectMedia(item)}
        style={styles.mediaItemContainer}
      >
        <View>
          <View style={[styles.mediaItem, { opacity: isSelected ? 0.5 : 1 }]}>
            <FastImage style={styles.mediaImage} source={{ uri: item.uri }} />
            {type === "video" && (
              <View style={styles.videoOverlay}>
                <Text style={styles.playIcon}>▶</Text>
                <Text style={styles.videoDuration}>
                  {formatDuration(item.duration)}
                </Text>
              </View>
            )}
          </View>

          {isSelected && (
            <View style={styles.selectionOverlay}>
              <Selected />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  const handleDone = () => {
    onDone(selectedMedia);
    setSelectedMedia([]);
    // onClose();
  };

  const handleClose = () => {
    setSelectedMedia([]);
    onClose();
  };
  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={addAssetModelVisible}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Select {types === "video" ? "Videos" : "Images"}
          </Text>

          <FlatList
            data={media}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            onEndReached={loadMedia} // Load more media when reaching the end
            onEndReachedThreshold={0.5} // Fetch when halfway through the list
            onRefresh={onRefresh}
            refreshing={refreshing}
            ListFooterComponent={
              loading ? (
                <ActivityIndicator size="large" color="#00ff00" />
              ) : null
            }
          />

          <View style={styles.actionContainer}>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.button, styles.closeButton]}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDone}
              style={[styles.button, styles.doneButton]}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: width - 60,
    padding: 16,
    height: height - 80,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  mediaItemContainer: {
    // marginBottom: 10,
    flex: 1,
    // justifyContent: "center",
    // alignItems: "center",
  },
  mediaItem: {
    margin: 1,
  },
  mediaImage: {
    width: (width - 92) / 2,
    aspectRatio: 1,
    borderRadius: 7,
  },
  videoOverlay: {
    position: "absolute",
    bottom: 5,
    left: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  selectionOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
  },
  playIcon: {
    color: "white",
    marginRight: 5,
  },
  videoDuration: {
    color: "white",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    padding: 4,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  closeButton: {
    // backgroundColor: "red",
  },
  doneButton: {
    // backgroundColor: "green",
  },
  buttonText: {
    color: "#3B7CE2",
    // marginTop: 8,
    fontWeight: "600",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "right",
  },
});

export default MediaPicker;
