import React, { memo, useCallback, useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
  Button,
  Alert,
  Image,
} from "react-native";
import Share from "react-native-share";
import FastImage from "react-native-fast-image";
import { FlatList } from "react-native";
import * as MediaLibrary from "expo-media-library";
import Close from "../assets/images/icon/close.svg";
import Cut from "../assets/images/icon/cut.svg";
import Delete from "../assets/images/icon/delete.svg";
import ShareIcon from "../assets/images/icon/share.svg";
import Selected from "../assets/images/icon/selected.svg";
import Folder from "../assets/images/icon/folder.svg";
import { MaterialIcons } from "@expo/vector-icons";
import {
  formatDuration,
  getIdVaultData,
  getMyVaultData,
  getVaultData,
  storeIdVaultData,
  storeMyVaultData,
  storeVaultData,
} from "../constants/utils";

const { width, height } = Dimensions.get("window");

const VaultMediaList = memo(
  ({
    mediaAlbumItems,
    onMediaPress,
    handleScroll,
    selectedAlbum,
    loadMediaFromAlbum,
    loadingMoreMedia,
    setMediaItems,
    albums, // Albums data passed via props
    onRefresh,
    refreshing
  }) => {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [showAlbumModal, setShowAlbumModal] = useState(false);
    const [actionType, setActionType] = useState(""); // 'copy' or 'move'
    const [isAlbumSelectionMode, setIsAlbumSelectionMode] = useState(false);
    const [selectedAlbums, setSelectedAlbums] = useState([]);
    // const [selectedAlbumForAction, setSelectedAlbumForAction] = useState(null);

    const handleLongPressAlbum = (item) => {
      setIsAlbumSelectionMode(true);
      toggleSelection(item);
    };

    const handleLongPress = (item) => {
      setIsSelectionMode(true);
      toggleSelection(item);
    };

    const toggleSelectionAlbum = (item) => {
      const mediaObj = {
        id: item.id,
      };
      // console.log(mediaObj)
      const isSelected = selectedAlbums.some((item) => item.id === mediaObj.id);
      if (isSelected) {
        setSelectedAlbums(selectedAlbums.filter((data) => data.id !== item.id));
      } else {
        setSelectedAlbums([...selectedAlbums, mediaObj]);
      }
    };

    const toggleSelection = async (item) => {
      const mediaObj = { id: item.id, name: item.filename };
      const isSelected = selectedImages.some((val) => val.id === mediaObj.id);
      if (isSelected) {
        setSelectedImages(
          selectedImages.filter((val) => val.id !== mediaObj.id)
        );
      } else {
        setSelectedImages([...selectedImages, mediaObj]);
      }
    };

    const closeSelectionModeAlbums = () => {
      setIsAlbumSelectionMode(false);
      setSelectedAlbums([]);
    };
    const closeSelectionMode = () => {
      setIsSelectionMode(false);
      setSelectedImages([]);
    };

    const renderAlbumItem = ({ item }) => {
      const mediaObj = { id: item.id };
      const isSelected = selectedAlbums.some((item) => item.id === mediaObj.id);
      return (
        <TouchableOpacity
          onLongPress={() => handleLongPressAlbum(item)}
          onPress={() => {
            if (isAlbumSelectionMode) {
              toggleSelectionAlbum(item);
            } else {
              loadMediaFromAlbum(item.id, item.title, item.totalCount);
            }
          }}
          style={styles.albumItem}
        >
          <View style={styles.albumEmptyImage}>
            <Folder />
            {isSelected && (
              <View style={styles.selectionOverlay}>
                <Selected />
              </View>
            )}
          </View>
          <View style={styles.albumInfo}>
            <Text style={styles.albumTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.albumCount}>{item.totalCount}</Text>
          </View>
        </TouchableOpacity>
      );
    };

    const renderMediaItem = ({ item, index }) => {
      const isSelected = selectedImages.some((val) => val.id === item.id);
      return (
        <View style={styles.itemsContainer}>
          <TouchableOpacity
            onLongPress={() => handleLongPress(item)}
            onPress={() => {
              if (isSelectionMode) {
                toggleSelection(item);
              } else {
                onMediaPress(index);
              }
            }}
            style={[styles.mediaItem, isSelected && styles.selectedMediaItem]}
          >
            <FastImage
              source={{
                uri: item.uri,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.mediaImage}
              resizeMode={FastImage.resizeMode.cover}
            />
            {item.mediaType === "video" && (
              <View style={styles.videoOverlay}>
                <Text style={styles.playIcon}>▶</Text>
                <Text style={styles.videoDuration}>
                  {formatDuration(item.duration)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {isSelected && (
            <View style={styles.selectionOverlay}>
              <Selected />
            </View>
          )}
        </View>
      );
    };

    const renderModelAlbumItem = ({ item }) => {
      return (
        <TouchableOpacity
          onPress={() => handleAlbumSelect(item)}
          style={styles.albumModelItem}
        >
          <View style={styles.albumModelEmptyImage}>
            <Folder />
          </View>
          <View style={styles.albumModelInfo}>
            <Text style={styles.albumModelTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.albumModelCount}>{item.totalCount}</Text>
          </View>
        </TouchableOpacity>
      );
    };

    const mediaData = useMemo(() => mediaAlbumItems, [mediaAlbumItems]);

    const openAlbumModal = (action) => {
      setActionType(action); // Set 'copy' or 'move'
      setShowAlbumModal(true);
    };

    const handleAlbumSelect = async (album) => {
      if (album.id === selectedAlbum) {
        Alert.alert(
          "Warning",
          `You cannot ${actionType} media to the same album.`
        );
        return;
      }

      try {
        //  await MediaLibrary.deleteAssetsAsync(selectedImages,album.id);c'
        const selectedMediaIds = selectedImages.map((media) => media.id); // Extract only the ids
        if (actionType === "copy") {
          if (album.totalCount === 0) {
            const newalbum = await MediaLibrary.createAlbumAsync(
              album.title,
              selectedMediaIds[0],
              true
            );
            // console.log(newalbum);
            const data = await getVaultData();
            const updatedData = data.filter(
              (value) => value.title != newalbum.title
            );
            storeVaultData(updatedData);
            const myData = await getMyVaultData();
            const newMydata = [
              ...myData,
              { id: newalbum.id, title: newalbum.title },
            ];
            if (selectedImages.length > 1) {
              await MediaLibrary.addAssetsToAlbumAsync(
                selectedMediaIds.slice(1),
                newalbum.id,
                true
              );
            }
            storeMyVaultData(newMydata);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync(
              selectedMediaIds,
              album.id,
              true
            );
          }
        } else if (actionType === "move") {
          if (album.totalCount === 0) {
            const newalbum = await MediaLibrary.createAlbumAsync(
              album.title,
              selectedMediaIds[0],
              false
            );
            const data = await getVaultData();
            const updatedData = data.filter(
              (value) => value.title != newalbum.title
            );
            storeVaultData(updatedData);
            const myData = await getMyVaultData();
            const newMydata = [
              ...myData,
              { id: newalbum.id, title: newalbum.title },
            ];
            if (selectedImages.length > 1) {
              await MediaLibrary.addAssetsToAlbumAsync(
                selectedMediaIds.slice(1),
                newalbum.id,
                false
              );
            }
            storeMyVaultData(newMydata);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync(
              selectedMediaIds,
              album.id,
              false
            );
          }
          setMediaItems((prevItems) =>
            prevItems.filter((item) => !selectedImages.includes(item.id))
          );
        }
        Alert.alert("Success", `Media ${actionType}ed successfully!`);
        closeSelectionMode();
        setShowAlbumModal(false);
      } catch (error) {
        console.error(`Error while trying to ${actionType} media:`, error);
      }
    };

    const handleDeleteAlbums = async () => {
      try {
        const result = await MediaLibrary.deleteAlbumsAsync(
          selectedAlbums,
          true
        );
        const prevMyVaultData = await getMyVaultData();
        const updatedMyVaultData = prevMyVaultData.filter(
          (album) =>!selectedAlbums.includes(album.id)
        );
        storeMyVaultData(updatedMyVaultData);
        onRefresh();
        closeSelectionModeAlbums();
      } catch (error) {
        console.error("Error deleting media: ", error);
      }
    };

    const handleDelete = async () => {
      try {
        const result = await MediaLibrary.deleteAssetsAsync(selectedImages);
        setMediaItems((prevItems) =>
          prevItems.filter((item) => !selectedImages.includes(item.id))
        );
        closeSelectionMode();
      } catch (error) {
        console.error("Error deleting media: ", error);
      }
    };

    const handleShare = async () => {
      try {
        if (selectedImages.length > 0) {
          const selectedMedia = mediaAlbumItems
            .filter((item) => selectedImages.includes(item.id))
            .map((media) => media.uri);

          const shareOptions = {
            title: "Share Media",
            urls: selectedMedia,
            failOnCancel: false,
          };

          await Share.open(shareOptions);
        }
      } catch (error) {
        console.error("Error sharing media: ", error);
      }
    };

    const handleUnhide = async () => {
      try {
        // Retrieve vault data (assuming it's stored in async storage)
        const vaultData = await getIdVaultData(); // getIdVaultData should return the data as an array
        const names = [];
        // Loop through the selected images
        for (const selectedImage of selectedImages) {
          // Find the index of the matching item based on the name property
          const matchingIndex = vaultData.findIndex(
            (vaultItem) => vaultItem.name === selectedImage.name
          );
          if (matchingIndex !== -1) {
            // If a matching item is found, extract the vault item
            const vaultItem = vaultData[matchingIndex];

            // Extract albumId and id from the vault item
            const { albumId, id: vaultItemId } = vaultItem;
            console.log(albumId);
            // Extract id from the selected image
            const { id: selectedItemId } = selectedImage;

            // Add the selected item to the album
            await MediaLibrary.addAssetsToAlbumAsync(
              [selectedItemId],
              albumId,
              false
            );

            // Remove the matched item from the vault data
            const uptedData = vaultData.splice(matchingIndex, 1); // Removes the item from the arr
          }
        }

        // Store the updated vault data
        await storeIdVaultData(vaultData);

        console.log("Vault data successfully updated.");
      } catch (error) {
        console.error("Error handling vault data:", error);
      }
    };
    return (
      <View style={[{ flex: 1 }, isSelectionMode && { paddingBottom: 36 }]}>
        {isSelectionMode && (
          <View style={styles.selectionHeader}>
            <TouchableOpacity
              onPress={closeSelectionMode}
              style={styles.button}
            >
              <Close />
            </TouchableOpacity>

            <Text>{selectedImages.length} selected</Text>
            <TouchableOpacity
              onPress={() =>
                setSelectedImages(mediaData.map((item) => item.id))
              }
            >
              <MaterialIcons name="select-all" size={24} color="#3478F6" />
            </TouchableOpacity>
          </View>
        )}

        {isAlbumSelectionMode && (
          <View style={styles.selectionHeaderAlbum}>
            <TouchableOpacity
              onPress={closeSelectionModeAlbums}
              style={styles.button}
            >
              <Close />
            </TouchableOpacity>

            <Text>{selectedAlbums.length} selected</Text>
            <TouchableOpacity onPress={handleDeleteAlbums}>
              <Delete />
            </TouchableOpacity>
          </View>
        )}
        <FlatList
          data={mediaData}
          keyExtractor={(item) => item.id}
          renderItem={selectedAlbum ? renderMediaItem : renderAlbumItem}
          numColumns={3}
          onScroll={selectedAlbum && handleScroll}
          scrollEventThrottle={16}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListFooterComponent={
            loadingMoreMedia ? (
              <ActivityIndicator size="large" color="#00ff00" />
            ) : null
          }
        />

        {isSelectionMode && (
          <View style={styles.selectionFooter}>
            <TouchableOpacity
              onPress={handleUnhide}
              style={[
                styles.icon,
                selectedImages.length === 0 && styles.disabled,
              ]}
              disabled={selectedImages.length === 0}
            >
              <Image
                source={require("../assets/images/icon/unlock.png")}
                tintColor={"#3B7CE2"}
                style={styles.Icon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openAlbumModal("move")}
              style={[
                styles.icon,
                selectedImages.length === 0 && styles.disabled,
              ]}
              disabled={selectedImages.length === 0}
            >
              <Cut />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[
                styles.icon,
                selectedImages.length === 0 && styles.disabled,
              ]}
              disabled={selectedImages.length === 0}
            >
              <Delete />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={[
                styles.icon,
                selectedImages.length === 0 && styles.disabled,
              ]}
              disabled={selectedImages.length === 0}
            >
              <ShareIcon />
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={showAlbumModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={albums} // Use albums prop
                keyExtractor={(item) => item.id}
                // renderItem={renderAlbumItem}
                // estimatedItemSize={110}
                // numColumns={2}
                numColumns={2}
                renderItem={renderModelAlbumItem}

                // renderItem={({ item }) => (
                //   <TouchableOpacity
                //     style={styles.albumItem}
                //     onPress={() => handleAlbumSelect(item)}
                //   >
                //     <Text>{item.title}</Text>
                //   </TouchableOpacity>
                // )}
              />
              {/* <Button title="Close" onPress={() => setShowAlbumModal(false)} /> */}
              <TouchableOpacity onPress={() => setShowAlbumModal(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
);

export { VaultMediaList };
const styles = StyleSheet.create({
  mediaItem: {
    margin: 1,
  },
  albumItem: {
    flex: 1,
    overflow: "hidden",
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
  albumImage: {
    width: (width - 36) / 3,
    aspectRatio: 1,
    borderRadius: 7,
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
  selectedImage: {
    opacity: 0.5,
  },
  Icon: {
    width: 20,
    height: 20,
  },
  selectIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  selectSign: {
    color: "#fff",
    fontSize: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: width - 60,
  },
  modalContent: {
    width: width - 60,
    padding: 16,
    height: height - 120,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  mediaImage: {
    width: (width - 36) / 3,
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
  playIcon: {
    color: "white",
    marginRight: 5,
  },
  videoDuration: {
    color: "white",
  },
  selectedMediaItem: {
    opacity: 0.5,
  },
  selectionOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
  },
  selectionHeaderAlbum: {
    // position: "absolute",
    // top: -136,
    // left: -16,
    // right: -16,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    // zIndex: 10,
  },
  selectionHeader: {
    position: "absolute",
    top: -68,
    left: -16,
    right: -16,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    zIndex: 10,
  },
  selectionFooter: {
    position: "absolute",
    bottom: -16,
    left: -16,
    right: -16,
    // height: 60,
    backgroundColor: "#F9F9F9",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    // paddingHorizontal: 2,
    paddingVertical: 16,
    zIndex: 10,
  },
  invisible: {
    width: (width - 36) / 3,
    aspectRatio: 1,
    borderRadius: 7,
  },
  icon: {
    width: 20,
    height: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  albumModelItem: {
    flex: 1,
    overflow: "hidden",
    margin: 1,
  },
  albumModelImage: {
    width: (width - 92) / 2,
    aspectRatio: 1,
    borderRadius: 7,
  },
  albumModelEmptyImage: {
    width: (width - 92) / 2,
    aspectRatio: 1,
    borderRadius: 7,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F1FF",
  },
  albumEmptyImage: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: (width - 36) / 3,
    aspectRatio: 1,
    backgroundColor: "#E8F1FF",
    borderRadius: 7,
  },
  albumModelInfo: {
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  albumModelTitle: {
    fontSize: 16,
    width: (width - 92) / 2,
    fontWeight: "bold",
  },
  albumModelCount: {
    fontSize: 12,
    color: "#888",
  },
  modalClose: {
    color: "#3B7CE2",
    // marginTop: 8,
    fontWeight: "600",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "right",
  },
});
