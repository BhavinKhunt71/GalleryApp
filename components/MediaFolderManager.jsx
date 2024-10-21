import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  FlatList,
  Button,
  Modal,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { VaultMediaList } from "./VaultMediaAlbumList";
import * as FileSystem from "expo-file-system";
import FastImage from "react-native-fast-image";
import AlbumTitle from "./Ui/AlbumTitle";
import { useCallback } from "react";
import {
  getAlbumsData,
  getIdVaultData,
  getMyAlbumsData,
  getMyVaultData,
  getVaultData,
  storeIdVaultData,
  storeMyVaultData,
  storeVaultData,
} from "../constants/utils";
import uuid from "react-native-uuid";
import VaultGalleryHeader from "./Ui/VaultGalleryHeader";
import AddAsset from "./AddAsstes";
import Plus from "../assets/images/icon/plus.svg";
import Video from "../assets/images/icon/video.svg";
import Image from "../assets/images/icon/image.svg";
import ImageDetailView from "./ImageDetailView";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

const MediaFolderManager = () => {
  const [albums, setAlbums] = useState([]);
  const [mediaItems, setMediaItems] = useState([]); // Updated to store both images and videos
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(null); // Track selected media item (image/video)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasMoreMedia, setHasMoreMedia] = useState(true); // Track if there are more media items
  const [loadingMoreMedia, setLoadingMoreMedia] = useState(false); // Show loading indicator when fetching more items
  const [nextPage, setNextPage] = useState(null); // For pagination
  const [headerTitle, setHeaderTitle] = useState(); // Header title
  const [seletedTotalCount, setSeletedTotalCount] = useState();
  const [createAlbumModalVisible, setCreateAlbumModalVisible] = useState(false);
  const [plusModalVisible, setPlusModalVisible] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [addAssetVideoModelVisible, setAddAssetVideoModelVisible] = useState(false);
  const [addAssetImageModelVisible, setAddAssetImageModelVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [type, setType] = useState();
  useEffect(() => {
    requestPermission();
  }, []);

  const requestPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === "granted") {
      loadAlbumsWithFirstImage();
    } else {
      alert("Permission required to access files.");
    }
  };
  const loadAlbumsWithFirstImage = async () => {
    setRefreshing(true);
    const albumList = await getMyVaultData();
    const albumsWithImages = await Promise.all(
      albumList.map(async (album) => {
        const assetCount = await MediaLibrary.getAssetsAsync({
          album: album.id,
          mediaType: ["photo", "video"],
        });
        return assetCount.totalCount > 0 // Filter out albums with no items
          ? {
              ...album,
              totalCount: assetCount.totalCount, // Total number of assets (photos + videos)
            }
          : null;
      })
    );
    const storedAlbums = await getVaultData();
    if (storedAlbums !== null) {
      setAlbums([...albumsWithImages.filter(Boolean), ...storedAlbums]);
    } else {
      setAlbums(albumsWithImages.filter(Boolean));
    }
    // }
    setRefreshing(false);
  };

  const loadMediaFromAlbum = async (albumId, albumName, totalCount) => {
    setSelectedAlbum(albumId);
    setSeletedTotalCount(totalCount);
    setHeaderTitle(albumName); // Set album name in header
    const albumAssets = await MediaLibrary.getAssetsAsync({
      album: albumId,
      mediaType: ["photo", "video"], // Load both photos and videos
      first: 100,
      sortBy: [MediaLibrary.SortBy.modificationTime], // Fetch only the first media item
    });
    setMediaItems(albumAssets.assets);
    setHasMoreMedia(albumAssets.hasNextPage);
    setNextPage(albumAssets.endCursor);
  };

  const loadMoreMedia = async () => {
    if (!hasMoreMedia || loadingMoreMedia) return;
    // setRefreshing(false);
    setLoadingMoreMedia(true);
    const moreAssets = await MediaLibrary.getAssetsAsync({
      album: selectedAlbum,
      mediaType: ["photo", "video"],
      first: 100,
      after: nextPage,
      sortBy: [MediaLibrary.SortBy.modificationTime], // Fetch only the first media item
    });
    setMediaItems([...mediaItems, ...moreAssets.assets]);
    setHasMoreMedia(moreAssets.hasNextPage);
    setNextPage(moreAssets.endCursor);
    setLoadingMoreMedia(false);
    // setRefreshing(false);
  };

  const handleScroll = ({ nativeEvent }) => {
    const contentHeight = nativeEvent.contentSize.height;
    const scrollOffset = nativeEvent.contentOffset.y;
    const visibleHeight = nativeEvent.layoutMeasurement.height;

    const halfwayPoint = contentHeight / 2;

    if (scrollOffset + visibleHeight >= halfwayPoint && !loadingMoreMedia) {
      loadMoreMedia(); // Trigger function when user reaches halfway
    }
  };

  const openMedia = (index) => {
    setSelectedMediaIndex(index);
    setIsModalVisible(true);
  };

  const backNavigation = useCallback(() => {
    setSelectedAlbum(null);
    setHeaderTitle(null);
    setMediaItems([]);
  }, []);

  const handleAddAsset = (value) => {
    setPlusModalVisible(false);
    if(value === "video"){
      setAddAssetVideoModelVisible(true);
    }
    else{
      setAddAssetImageModelVisible(true);
    }
    setType(value);
  };

  const handleCreateAlbum = async () => {
    if (!albumName) return;
    // Fetch existing albums and vault data
    const albumsData = await MediaLibrary.getAlbumsAsync();
    const existingAlbumsData = await getAlbumsData();
    const existingVaultAlbums = await getVaultData();

    // Check if the album name already exists in the albums, existingAlbums, or vault albums
    const albumExists =
    albumsData.some(
        (album) => album.title.toLowerCase() === albumName.toLowerCase()
      ) ||
      (existingAlbums && existingAlbums.length > 0 &&
        existingAlbumsData.some(
          (album) => album.title.toLowerCase() === albumName.toLowerCase()
        )) ||
      (existingVaultAlbums && existingVaultAlbums.length > 0 &&
        existingVaultAlbums.some(
          (album) => album.title.toLowerCase() === albumName.toLowerCase()
        ));

    if (albumExists) {
      // Display a warning message if the album name already exists
      Alert.alert(
        "Duplicate Album",
        "An album with this name already exists. Please choose a different name."
      );
      return;
    }

    // Update the albums state
    const newAlbum = {
      id: uuid.v4(),
      title: albumName,
      firstMedia: null,
      totalCount: 0,
    };
    setAlbums((prevAlbums) => {
      const updatedAlbums = [...prevAlbums, newAlbum];

      // Store updated albums to AsyncStorage

      return updatedAlbums;
    });

    // Reset album creation state
    setAlbumName("");
    setCreateAlbumModalVisible(false);
    const existingAlbums = await getVaultData();

    // Update albums list with the new album
    const updatedAlbums = [...existingAlbums, newAlbum];

    // Store updated albums back to AsyncStorage
    await storeVaultData(updatedAlbums);
  };
  const handleAddItems = async (selectedMedia) => {
    try {
      const selectedMediaIds = selectedMedia.map((media) => media.id); // Extract only the ids
      const selectedMediaAlbumIds = selectedMedia.map((media) => media.albumId); // Extract albumIds
      const selectedMediaNames = selectedMedia.map((media) => media.name); // Extract albumIds
      if (selectedMediaIds.length === 0) {
        Alert.alert("No media selected");
        return;
      }

      if (seletedTotalCount === 0) {
        // Create a new album if no items are currently in the vault
        const newAlbum = await MediaLibrary.createAlbumAsync(
          headerTitle,
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
        setSeletedTotalCount(selectedMediaIds.length);
        if(type === "video"){
          setAddAssetVideoModelVisible(false);
        }
        else{
          setAddAssetImageModelVisible(false);
        }
      } else {
        // Add media to an existing album
        await MediaLibrary.addAssetsToAlbumAsync(
          selectedMediaIds,
          selectedAlbum,
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
        setSeletedTotalCount(selectedMediaIds.length);
      }
      if(type === "video"){
        setAddAssetVideoModelVisible(false);
      }
      else{
        setAddAssetImageModelVisible(false);
      }
    } catch (error) {
      if(type === "video"){
        setAddAssetVideoModelVisible(false);
      }
      else{
        setAddAssetImageModelVisible(false);
      }
      Alert.alert(`Error while trying to add media.`);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedAlbum) {
      setSelectedAlbum(null);
    } 
      await loadAlbumsWithFirstImage();
    
    setRefreshing(false);
  };
  const closeMediaDetail = () => {
    setIsModalVisible(false);
  };

  const handleImageDeletion = (updatedMediaItems) => {
    setMediaItems(updatedMediaItems);
    setSeletedTotalCount(seletedTotalCount - 1);
    // Decrease the total count in the selected album
    setAlbums((prevAlbums) =>
      prevAlbums.map((album) =>
        album.id === selectedAlbum
          ? { ...album, totalCount: seletedTotalCount - 1 }
          : album
      )
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff"/>
      {selectedAlbum ? (
        <VaultGalleryHeader
          backNavigation={backNavigation}
          headerTitle={headerTitle}
        />
      ) : (
        <Text style={styles.albumText}>Vault</Text>
      )}
      <VaultMediaList
        mediaAlbumItems={selectedAlbum ? mediaItems : albums}
        onMediaPress={openMedia}
        handleScroll={selectedAlbum && handleScroll}
        selectedAlbum={selectedAlbum}
        loadMediaFromAlbum={loadMediaFromAlbum}
        loadingMoreMedia={loadingMoreMedia}
        setMediaItems={setMediaItems}
        albums={albums}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      {!selectedAlbum ? (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setCreateAlbumModalVisible(true)}
        >
          <Text style={styles.createButtonText}>Create New Folder</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setPlusModalVisible(!plusModalVisible)}
          >
            <Plus />
          </TouchableOpacity>
          {plusModalVisible && (
            <View style={styles.floatingButtonContainer}>
              <TouchableOpacity
                style={styles.floatingVideosButton}
                onPress={() => handleAddAsset("video")}
              >
                <Video />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.floatingImagesButton}
                onPress={() => handleAddAsset("image")}
              >
                <Image />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      <AddAsset
        onClose={() => setAddAssetImageModelVisible(false)}
        addAssetModelVisible={addAssetImageModelVisible}
        onDone={handleAddItems}
        type={"image"}
      />
        <AddAsset
        onClose={() => setAddAssetVideoModelVisible(false)}
        addAssetModelVisible={addAssetVideoModelVisible}
        onDone={handleAddItems}
        type={"video"}
      />

      {isModalVisible && (
        <ImageDetailView
          mediaItems={mediaItems}
          selectedMediaIndex={selectedMediaIndex}
          onClose={closeMediaDetail}
          setMediaItems={handleImageDeletion}
          isModalVisible={isModalVisible}
          totalCount={seletedTotalCount}
          IsVault={false}
        />
      )}
      
      {/* Create Album Modal */}
      <Modal
        transparent={true}
        visible={createAlbumModalVisible}
        animationType="slide"
        onRequestClose={() => setCreateAlbumModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createAlbumModal}>
            <Text style={styles.modalTitle}>New Album</Text>
            <TextInput
              value={albumName}
              onChangeText={setAlbumName}
              placeholder="Enter album name"
              style={styles.textInput}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => setCreateAlbumModalVisible(false)}
              >
                <Text style={styles.modalCreateClose}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateAlbum}>
                <Text style={styles.modalCreateClose}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MediaFolderManager;
// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  albumText: {
    fontSize: 30,
    fontWeight: "bold",
    paddingBottom: 16,
  },
  floatingButton: {
    position: "absolute",
    bottom: 12,
    right: 14,
    backgroundColor: "#3478F6",
    borderRadius: 999,
    width: 58,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingButtonContainer: {
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    right: 20,
    bottom: 76,
  },
  floatingVideosButton: {
    backgroundColor: "#3478F6",
    borderRadius: 999,
    width: 40,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  floatingImagesButton: {
    backgroundColor: "#3478F6",
    borderRadius: 999,
    width: 40,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  createButton: {
    backgroundColor: "#3478F3",
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modelInfo: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
    alignItems: "center",
  },
  modelInfoTitle: {
    fontSize: 16,
    fontWeight: "medium",
  },
  modalOption: {
    padding: 10,
  },
  createAlbumModal: {
    width: 243,
    backgroundColor: "#fff",
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: "#000",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#BCBCBB",
    padding: 6,
    marginBottom: 16,
    borderRadius: 8,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  modalCreateClose: {
    color: "#3B7CE2",
    // marginTop: 8,
    fontWeight: "600",
    fontWeight: "bold",
    fontSize: 16,
    // textAlign: "right",
  },
});
