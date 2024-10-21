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
} from "react-native";
import Share from "react-native-share";
import { FlashList } from "@shopify/flash-list";
import FastImage from "react-native-fast-image";
import { Video } from "expo-av";
import { FlatList } from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import Close from "../assets/images/icon/close.svg";
import Vault from "../assets/images/icon/vault.svg";
import Copy from "../assets/images/icon/copy.svg";
import Cut from "../assets/images/icon/cut.svg";
import Delete from "../assets/images/icon/delete.svg";
import ShareIcon from "../assets/images/icon/share.svg";
import Selected from "../assets/images/icon/selected.svg";
import Folder from "../assets/images/icon/folder.svg";
import { MaterialIcons } from "@expo/vector-icons";
import {
  formatDuration,
  getAlbumsData,
  getIdVaultData,
  getMyAlbumsData,
  getMyVaultData,
  getVaultData,
  storeAlbumData,
  storeIdVaultData,
  storeMyAlbumData,
  storeMyVaultData,
  storeVaultData,
} from "../constants/utils";

const { width, height } = Dimensions.get("window");

const MediaList = memo(
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
    refreshing,
    setResAlbums,
  }) => {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isAlbumSelectionMode, setIsAlbumSelectionMode] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedAlbums, setSelectedAlbums] = useState([]);
    const [showAlbumModal, setShowAlbumModal] = useState(false);
    const [actionType, setActionType] = useState("");
    const [VaultAlbums, setVaultAlbums] = useState([]);
    const [isVaultModelVisible, setIsVaultModelVisible] = useState(false);

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
      const isSelected = selectedAlbums.some((item) => item.id === mediaObj.id);
      if (isSelected) {
        setSelectedAlbums(selectedAlbums.filter((data) => data.id !== item.id));
      } else {
        setSelectedAlbums([...selectedAlbums, mediaObj]);
      }
    };

    const toggleSelection = (item) => {
      const mediaObj = {
        id: item.id,
        albumId: item.albumId,
        name: item.filename,
      };
      const isSelected = selectedImages.some((item) => item.id === mediaObj.id);
      if (isSelected) {
        setSelectedImages(selectedImages.filter((data) => data.id !== item.id));
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

    const loadAlbumsWithFirstImage = async () => {
      // AsyncStorage.clear();
      const albumList = await getMyVaultData();
      // if (albumList.length > 0) {
      const albumsWithImages = await Promise.all(
        albumList.map(async (album) => {
          const assets = await MediaLibrary.getAssetsAsync({
            album: album.id,
            mediaType: ["photo", "video"],
            first: 1,
            sortBy: [MediaLibrary.SortBy.modificationTime], // Fetch only the first media item
          });

          const assetCount = await MediaLibrary.getAssetsAsync({
            album: album.id,
            mediaType: ["photo", "video"],
          });
          return assetCount.totalCount > 0 // Filter out albums with no items
            ? {
                ...album,
                firstMedia: assets.assets[0], // Store the first media item (can be photo or video)
                totalCount: assetCount.totalCount, // Total number of assets (photos + videos)
              }
            : null;
        })
      );
      const storedAlbums = await getVaultData();
      if (storedAlbums !== null) {
        setVaultAlbums([...albumsWithImages.filter(Boolean), ...storedAlbums]);
      } else {
        setVaultAlbums(albumsWithImages.filter(Boolean));
      }
      // }
    };
    const renderAlbumItem = ({ item }) => {
      const mediaObj = { id: item.id };
      const isSelected = selectedAlbums.some((item) => item.id === mediaObj.id);
      if (item.empty) {
        return <View style={[styles.mediaItem, styles.invisible]} />;
      } else if (item.totalCount === 0) {
        return (
          <View style={styles.albumItem}>
            <View style={styles.albumEmptyImage}>
              <Folder />
            </View>
            <View style={styles.albumInfo}>
              <Text style={styles.albumTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.albumCount}>{item.totalCount}</Text>
            </View>
          </View>
        );
      }
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
          <View style={styles.albumImage}>
            <FastImage
              source={{
                uri: item.firstMedia.uri,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
              style={[
                styles.albumImage,
                isSelected && styles.selectedMediaItem,
              ]}
              resizeMode={FastImage.resizeMode.cover}
            />
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
      const mediaObj = { id: item.id, albumId: item.albumId };
      const isSelected = selectedImages.some((item) => item.id === mediaObj.id);
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
      if (item.empty) {
        return <View style={[styles.mediaItem, styles.invisible]} />; // Invisible placeholder
      } else if (item.totalCount === 0) {
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
      }
      return (
        <TouchableOpacity
          onPress={() => handleAlbumSelect(item)}
          style={styles.albumModelItem}
        >
          {/* {item.firstMedia.mediaType === "photo" ? ( */}
          <FastImage
            source={{
              uri: item.firstMedia.uri,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.albumModelImage}
            resizeMode={FastImage.resizeMode.cover}
          />
          {/* ) : (
            <Video
              source={{ uri: item.firstMedia.uri }}
              style={styles.albumModelImage}
              resizeMode="cover"
              useNativeControls={false}
            />
          )} */}
          <View style={styles.albumModelInfo}>
            <Text style={styles.albumModelTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.albumModelCount}>{item.totalCount}</Text>
          </View>
        </TouchableOpacity>
      );
    };

    const renderModelVaultAlbumItem = ({ item }) => {
      return (
        <TouchableOpacity
          onPress={() => handleVaultAlbumSelect(item)}
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

    const handleHide = async () => {
      setIsVaultModelVisible(true);
      loadAlbumsWithFirstImage();
    };

    const handleDeleteAlbums = async () => {
      try {
        const result = await MediaLibrary.deleteAlbumsAsync(
          selectedAlbums,
          true
        );
        onRefresh();
        closeSelectionModeAlbums();
      } catch (error) {
        console.error("Error deleting media: ", error);
      }
    };

    const handleVaultAlbumSelect = async (item) => {
      try {
        const selectedMediaIds = selectedImages.map((media) => media.id); // Extract only the ids
        const selectedMediaAlbumIds = selectedImages.map(
          (media) => media.albumId
        ); // Extract albumIds
        const selectedMediaNames = selectedImages.map((media) => media.name); // Extract albumIds
        if (selectedMediaIds.length === 0) {
          Alert.alert("No media selected");
          return;
        }

        if (item.totalCount === 0) {
          // Create a new album if no items are currently in the vault
          const newAlbum = await MediaLibrary.createAlbumAsync(
            item.title,
            selectedMediaIds[0], // Use the first selected media id
            false
          );

          // Remove existing vault data for this album title
          const data = await getVaultData();
          const updatedData = data.filter(
            (value) => value.title !== newAlbum.title
          );
          storeVaultData(updatedData);

          // Store the new vault data, now including the albumId
          const myData = await getMyVaultData();
          const newMyData = [
            ...myData,
            { id: newAlbum.id, title: newAlbum.title }, // Add albumId
          ];
          await storeMyVaultData(newMyData);
          const newItem = {
            albumId: selectedMediaAlbumIds[0],
            name: selectedMediaNames[0],
          };

          const updatedMyData = await getIdVaultData();
          await storeIdVaultData([...updatedMyData, newItem]);
          // If there are more media items, add them to the album
          for (let i = 1; i < selectedMediaIds.length; i++) {
            // Store each media data in AsyncStorage
            const newItem = {
              albumId: selectedMediaAlbumIds[i],
              name: selectedMediaNames[i],
            };

            const updatedMyData = await getIdVaultData();
            await storeIdVaultData([...updatedMyData, newItem]);
          }

          await MediaLibrary.addAssetsToAlbumAsync(
            selectedMediaIds.slice(1),
            newAlbum.id,
            false
          );
        } else {
          // Add media to an existing album
          await MediaLibrary.addAssetsToAlbumAsync(
            selectedMediaIds,
            item.id,
            false
          );
          for (let i = 0; i < selectedMediaIds.length; i++) {
            // Store each media data in AsyncStorage
            const newItem = {
              albumId: selectedMediaAlbumIds[i],
              name: selectedMediaNames[i],
            };
            const updatedMyData = await getIdVaultData();
            await storeIdVaultData([...updatedMyData, newItem]);
          }
        }

        // Optionally close the selection mode and hide the modal after adding the media
        // closeSelectionMode();
        setIsVaultModelVisible(false);
      } catch (error) {
        console.error(`Error while trying to add media:`, error);
      }
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
        if (actionType === "copy") {
          if (album.totalCount === 0) {
            const newalbum = await MediaLibrary.createAlbumAsync(
              album.title,
              selectedImages[0],
              true
            );
            const data = await getAlbumsData();
            const updatedData = data.filter(
              (value) => value.title != newalbum.title
            );
            storeAlbumData(updatedData);
            const myData = await getMyAlbumsData();
            const newMydata = [
              ...myData,
              { id: newalbum.id, title: newalbum.title },
            ];
            if (selectedImages.length > 1) {
              await MediaLibrary.addAssetsToAlbumAsync(
                selectedImages.slice(1),
                newalbum.id,
                true
              );
            }
            storeMyAlbumData(newMydata);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync(
              selectedImages,
              album.id,
              true
            );
          }
        } else if (actionType === "move") {
          if (album.totalCount === 0) {
            const newalbum = await MediaLibrary.createAlbumAsync(
              album.title,
              selectedImages[0],
              false
            );
            const data = await getAlbumsData();
            data.filter((value) => value.title != newalbum.title);
            const myData = await getMyAlbumsData();
            const newMydata = [
              ...myData,
              { id: newalbum.id, title: newalbum.title },
            ];
            if (selectedImages.length > 1) {
              await MediaLibrary.addAssetsToAlbumAsync(
                selectedImages.slice(1),
                newalbum.id,
                false
              );
            }
            storeMyAlbumData(newMydata);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync(
              selectedImages,
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

    // const renderHeader = () => {
    //   if (!loading) return null;
    //   return (
    //     <View style={{ padding: 10 }}>
    //       <ActivityIndicator size="large" />
    //     </View>
    //   );
    // };
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
          // ListHeaderComponent={renderHeader}
          refreshing={refreshing} // Show spinner when refreshing
          onRefresh={onRefresh} // Trigger on pull down
          onScroll={selectedAlbum && handleScroll}
          scrollEventThrottle={16}
          ListFooterComponent={
            loadingMoreMedia ? (
              <ActivityIndicator size="large" color="#00ff00" />
            ) : null
          }
        />

        {isSelectionMode && (
          <View style={styles.selectionFooter}>
            <TouchableOpacity
              onPress={handleHide}
              style={[
                styles.icon,
                selectedImages.length === 0 && styles.disabled,
              ]}
              disabled={selectedImages.length === 0}
            >
              <Vault />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openAlbumModal("copy")}
              style={[
                styles.icon,
                selectedImages.length === 0 && styles.disabled,
              ]}
              disabled={selectedImages.length === 0}
            >
              <Copy />
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
          visible={isVaultModelVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={VaultAlbums} // Use albums prop
                keyExtractor={(item) => item.id}
                // renderItem={renderAlbumItem}
                // estimatedItemSize={110}
                // numColumns={2}
                numColumns={2}
                renderItem={renderModelVaultAlbumItem}

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
              <TouchableOpacity onPress={() => setIsVaultModelVisible(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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

export { MediaList };
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
  selectedMediaItem: {
    opacity: 0.5,
  },
  selectionOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
  },
  selectionHeaderAlbum: {
    position: "absolute",
    top: -136,
    left: -16,
    right: -16,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    zIndex: 10,
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
