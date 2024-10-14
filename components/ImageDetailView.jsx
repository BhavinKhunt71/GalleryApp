import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
  PermissionsAndroid,
  FlatList,
  Animated,
  TouchableWithoutFeedback, // Import this for detecting screen touches
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { startActivityAsync, ActivityAction } from "expo-intent-launcher";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import { Feather } from "@expo/vector-icons"; // Icon set\
import BackIcon from "../assets/images/icon/backBig.svg";
import Vault from "../assets/images/icon/vault.svg";
import Rotate from "../assets/images/icon/rotate.svg";
import Delete from "../assets/images/icon/delete.svg";
import Edit from "../assets/images/icon/edit.svg";
import Share from "../assets/images/icon/share.svg";
import Folder from "../assets/images/icon/folder.svg";
import Info from "../assets/images/icon/info.svg";
import Play from "../assets/images/icon/play.svg";
import * as FileSystem from "expo-file-system";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getIdVaultData,
  getMyVaultData,
  getVaultData,
  storeIdVaultData,
  storeMyVaultData,
  storeVaultData,
} from "../constants/utils";
import { ResizeMode, Video } from "expo-av";
const { width, height } = Dimensions.get("window");

function formatDate(dateInput) {
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  dateInput = new Date(dateInput);
  const hours = dateInput.getHours();
  const minutes = dateInput.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
  const day = dateInput.getDate();
  const month = months[dateInput.getMonth()];
  const year = dateInput.getFullYear();
  return `${formattedHours}:${formattedMinutes} ${ampm} ${month} ${day}, ${year}`;
}

const ImageDetailView = ({
  mediaItems,
  selectedMediaIndex,
  onClose,
  setMediaItems,
  isModalVisible,
  totalCount,
  IsVault,
}) => {
  const { top, bottom } = useSafeAreaInsets();
  const [rotateAngle, setRotateAngle] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(selectedMediaIndex);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isVaultModelVisible, setIsVaultModelVisible] = useState(false);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [albums, setAlbums] = useState([]);
  const [headerFooterVisible, setHeaderFooterVisible] = useState(false); // Visibility state

  const [fileSize, setFileSize] = useState(null); // State to hold file size

  const currentMedia = mediaItems[currentIndex];
  const videoRef = useRef(null);
  useEffect(() => {
    const fetchFileSize = async () => {
      if (isDetailsVisible) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(currentMedia.uri);
          const sizeInKB = fileInfo.size / 1024;
          const sizeInMB = sizeInKB / 1024;

          const formattedSize =
            sizeInMB > 1
              ? `${sizeInMB.toFixed(2)} MB`
              : `${sizeInKB.toFixed(2)} KB`;

          setFileSize(formattedSize);
        } catch (error) {
          console.error("Error fetching file size:", error);
        }
      }
    };

    fetchFileSize();
  }, [isDetailsVisible, currentMedia]);
  const toggleDetailsModal = () => {
    setIsDetailsVisible(!isDetailsVisible);
  };

  const rotateImage = () => {
    setRotateAngle((prev) => prev + 90);
  };
  const loadAlbumsWithFirstImage = async () => {
    // AsyncStorage.clear();
    const albumList = await getMyVaultData();
    // console.log(albumList);
    // console.log(albumList);
    // if (albumList.length > 0) {
    const albumsWithImages = await Promise.all(
      albumList.map(async (album) => {
        // console.log(album.id)
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
        // console.log(assets.title);
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
    // console.log(storedAlbums);
    if (storedAlbums !== null) {
      setAlbums([...albumsWithImages.filter(Boolean), ...storedAlbums]);
    } else {
      setAlbums(albumsWithImages.filter(Boolean));
    }
    // }
  };

  const deleteImage = async () => {
    try {
      const result = await MediaLibrary.deleteAssetsAsync([currentMedia.id]);
      if (result) {
        const updatedMediaItems = mediaItems.filter(
          (item) => item.id !== currentMedia.id
        );
        setMediaItems(updatedMediaItems);
        if (updatedMediaItems.length === 0) {
          onClose();
        } else if (currentIndex >= updatedMediaItems.length) {
          setCurrentIndex(updatedMediaItems.length - 1);
        }
      } else {
        alert("Failed to delete the image. Please check if the file exists.");
      }
    } catch (error) {
      alert("Failed to delete the image. Please try again.");
    }
  };

  const openInGallery = async () => {
    try {
      console.log(currentMedia);
      if (currentMedia.mediaType === "photo") {
        const googlePhotosUrl = `content://media/external/images/media/${currentMedia.id}`;
        await IntentLauncher.startActivityAsync("android.intent.action.EDIT", {
          data: googlePhotosUrl,
          type: "image/*",
          // packageName: "com.google.android.apps.photos", // Package name for Google Photos
        });
      }
      else{
        const googlePhotosUrl = `content://media/external/video/media/${currentMedia.id}`;
        await IntentLauncher.startActivityAsync("android.intent.action.EDIT", {
          data: googlePhotosUrl,
          type: "video/*",
          // packageName: "com.google.android.apps.photos", // Package name for Google Photos
        });
      }
    } catch (error) {
      alert(
        "Google Photos app is not available, or the image cannot be opened."
      );
    }
  };
  const shareImage = async () => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(currentMedia.uri);
    } else {
      alert("Sharing is not available on this device.");
    }
  };

  const handleImageTap = () => {
    setHeaderFooterVisible((prev) => !prev); // Toggle header/footer visibility
  };

  const handleHide = async () => {
    setIsVaultModelVisible(true);
    loadAlbumsWithFirstImage();
  };
  const handleAlbumSelect = async (selectedMedia) => {
    try {
      if (selectedMedia.totalCount === 0) {
        // Create a new album if no items are currently in the vault
        const newAlbum = await MediaLibrary.createAlbumAsync(
          selectedMedia.title,
          currentMedia.id,
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
          albumId: currentMedia.albumId,
          name: currentMedia.filename,
        };

        const updatedMyData = await getIdVaultData();
        await storeIdVaultData([...updatedMyData, newItem]);
      } else {
        // Add media to an existing album
        await MediaLibrary.addAssetsToAlbumAsync(
          currentMedia.id,
          selectedMedia.id,
          false
        );

        const newItem = {
          albumId: currentMedia.albumId,
          name: currentMedia.filename,
        };
        console.log(newItem);
        const updatedMyData = await getIdVaultData();
        await storeIdVaultData([...updatedMyData, newItem]);
      }
      const updatedMyData = await getIdVaultData();
      console.log(updatedMyData);
      setIsVaultModelVisible(false);
    } catch (error) {
      console.error(`Error while trying to add media:`, error);
    }
  };
  const handleUnhide = async () => {
    try {
      // Retrieve vault data (assuming it's stored in async storage)
      const vaultData = await getIdVaultData(); // getIdVaultData should return the data as an array
      const matchingIndex = vaultData.findIndex(
        (vaultItem) => vaultItem.name === currentMedia.filename
      );

      if (matchingIndex !== -1) {
        // If a matching item is found, extract the vault item
        const vaultItem = vaultData[matchingIndex];

        // Extract albumId and id from the vault item
        const { albumId, id: vaultItemId } = vaultItem;
        console.log(albumId);
        // Extract id from the selected image
        const { id: selectedItemId } = currentMedia;

        // Add the selected item to the album
        await MediaLibrary.addAssetsToAlbumAsync(
          [selectedItemId],
          albumId,
          false
        );

        // Remove the matched item from the vault data
        const uptedData = vaultData.splice(matchingIndex, 1); // Removes the item from the array
        console.log(uptedData);
      }

      // Store the updated vault data
      await storeIdVaultData(vaultData);
      const updatedMediaItems = mediaItems.filter(
        (item) => item.id !== currentMedia.id
      );
      setMediaItems(updatedMediaItems);
      if (updatedMediaItems.length === 0) {
        onClose();
      } else if (currentIndex >= updatedMediaItems.length) {
        setCurrentIndex(updatedMediaItems.length - 1);
      }
      console.log("Vault data successfully updated.");
    } catch (error) {
      console.error("Error handling vault data:", error);
    }
  };
  const handleVideoPlay = () => {
    setIsVideoModalVisible(true); // Open video modal when play button is clicked
  };

  const handleVideoClose = () => {
    setIsVideoModalVisible(false); // Close the video modal
    if (videoRef.current) {
      videoRef.current.stopAsync(); // Stop the video when the modal is closed
    }
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
  return (
    <Modal visible={isModalVisible} transparent={false} animationType="fade">
      <View style={styles.container}>
        {/* HEADER */}
        {headerFooterVisible && (
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <BackIcon />
            </TouchableOpacity>
            <View>
              <Text style={styles.countText}>{`${
                currentIndex + 1
              } of ${totalCount}`}</Text>
              <Text style={styles.dateText}>
                {formatDate(currentMedia.modificationTime)}
              </Text>
            </View>
            {/* <TouchableOpacity onPress={onClose}> */}
            {IsVault ? (
              <TouchableOpacity onPress={handleHide}>
                <Vault />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleUnhide}>
                <Image
                  source={require("../assets/images/icon/unlock.png")}
                  tintColor={"#3B7CE2"}
                  style={styles.Icon}
                />
              </TouchableOpacity>
            )}
            {/* </TouchableOpacity> */}
          </View>
        )}

        {/* FOOTER */}
        {headerFooterVisible && (
          <View style={styles.footer}>
            <TouchableOpacity onPress={rotateImage}>
              <Rotate />
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteImage}>
              <Delete />
            </TouchableOpacity>
            <TouchableOpacity onPress={openInGallery}>
              <Edit />
            </TouchableOpacity>
            <TouchableOpacity onPress={shareImage}>
              <Share />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleDetailsModal}>
              <Info />
            </TouchableOpacity>
          </View>
        )}
        {/* IMAGE DISPLAY */}
        <View style={styles.flashListContainer}>
          <FlatList
            data={mediaItems}
            renderItem={({ item }) => (
              <View style={styles.imageWrapper}>
                <TouchableOpacity activeOpacity={1} onPress={handleImageTap}>
                  <Image
                    source={{ uri: item.uri }}
                    resizeMode="contain"
                    onLoad={(e) => {
                      const { height: h, width: w } = e.nativeEvent.source;
                      setImageDimensions({ height: h, width: w });
                    }}
                    style={[
                      {
                        width: width,
                        height:
                          imageDimensions.width && imageDimensions.height
                            ? (width * imageDimensions.height) /
                              imageDimensions.width
                            : 300,
                        resizeMode: "contain",
                      },
                      { transform: [{ rotate: `${rotateAngle}deg` }] },
                    ]}
                  />
                  {item.mediaType === "video" && (
                    <TouchableOpacity
                      style={styles.playButtonContainer}
                      onPress={handleVideoPlay}
                    >
                      <Play />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            )}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollToIndex={currentIndex}
            initialScrollIndex={currentIndex}
            keyExtractor={(item) => item.id}
            onScroll={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x /
                  e.nativeEvent.layoutMeasurement.width
              );
              setRotateAngle(0);
              setCurrentIndex(index);
            }}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />
        </View>

        <Modal
          visible={isVaultModelVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainerVault}>
            <View style={styles.modalContentVault}>
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
              <TouchableOpacity onPress={() => setIsVaultModelVisible(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* VIDEO MODAL */}
        <Modal
          visible={isVideoModalVisible}
          transparent={false}
          animationType="fade"
        >
          <View style={styles.videoModalContainer}>
            <TouchableOpacity onPress={handleVideoClose} style={styles.button}>
              <BackIcon />
            </TouchableOpacity>

            <Video
              ref={videoRef}
              source={{ uri: currentMedia.uri }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              style={styles.videoPlayer}
              // style={[
              //   {
              //     width: rotateAngle == 180 ? width : height,
              //     height:
              //     rotateAngle == 180 ? imageDimensions.width && imageDimensions.height
              //         ? (width * imageDimensions.height) /
              //           imageDimensions.width
              //         : 300 : width,
              //     resizeMode: "contain",
              //   },
              //   { transform: [{ rotate: `${rotateAngle}deg` }] },
              // ]}
              shouldPlay
              // rotation={rotateAngle}
            />
          </View>
        </Modal>
        {/* DETAILS MODAL */}
        <Modal
          visible={isDetailsVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Details</Text>
              <View style={styles.infoContainer}>
                <Text style={styles.infoKeyText}>Name</Text>
                <Text style={styles.infoValueText}>
                  {currentMedia.filename}
                </Text>
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.infoKeyText}>Path</Text>
                <Text style={styles.infoValueText}> {currentMedia.uri}</Text>
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.infoKeyText}>File Size</Text>
                <Text style={styles.infoValueText}>
                  {fileSize ? fileSize : "Loading..."}
                </Text>
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.infoKeyText}>Resolution</Text>
                <Text style={styles.infoValueText}>
                  {currentMedia.width} X {currentMedia.height}
                </Text>
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.infoKeyText}>Last Modified</Text>
                <Text style={styles.infoValueText}>
                  {formatDate(currentMedia.modificationTime)}
                </Text>
              </View>
              <TouchableOpacity onPress={toggleDetailsModal}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

export default ImageDetailView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    display: "flex",
    justifyContent: "space-between",
  },
  header: {
    position: "absolute", // Position header absolutely
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    zIndex: 10,
  },
  Icon: {
    width: 20,
    height: 20,
  },
  footer: {
    position: "absolute", // Position footer absolutely
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    zIndex: 10,
    backgroundColor: "#F9F9F9",
  },
  countText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  dateText: {
    fontSize: 14,
    color: "grey",
  },
  flashListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageWrapper: {
    justifyContent: "center",
    alignItems: "center",
    // width: width - 32, // Ensure image container has appropriate width
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
    borderColor: "#4b5563",
    borderWidth: 2,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    paddingBottom: 12,
    color: "#1E293B", // Stronger title color
  },
  button: {
    width: 36,
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
    aspectRatio: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    elevation: 8,
    borderRadius: 99,
  },
  infoContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    paddingBottom: 10, // Increased padding for clarity
  },
  playButtonContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 25,
  },
  videoModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  infoKeyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#334155",
  },
  infoValueText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#475569", // Softer grey for values
  },
  modalClose: {
    color: "#3B7CE2",
    marginTop: 8,
    fontWeight: "600",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "right",
  },
  modalContainerVault: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContentVault: {
    width: width - 60,
    padding: 16,
    height: height - 120,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  mediaImageVault: {
    width: (width - 36) / 3,
    aspectRatio: 1,
    borderRadius: 7,
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
});
