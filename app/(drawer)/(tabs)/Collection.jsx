import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Text } from "react-native";
import * as MediaLibrary from "expo-media-library";
import FloatingMenu from "../../../components/Ui/FloatingMenu";
import { GroupedMediaList } from "../../../components/GroupedMediaList";
import { MediaList } from "../../../components/MediaAlbumList";
import ImageDetailView from "../../../components/ImageDetailView";
import GalleryHeader from "../../../components/Ui/GalleryHeader"; // Import GalleryHeader component
import AlbumTitle from "../../../components/Ui/AlbumTitle"; // Import AlbumTitle component
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyAlbumsData, groupMediaByDate } from "../../../constants/utils";
import { InterstitialAd, TestIds } from "react-native-google-mobile-ads";

const adUnitId1 = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-1358580905548176/1538470693"; // Use your ad unit ID
const adUnitId2 = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-1358580905548176/1538470693"; // Use your ad unit ID

const interstitial1 = InterstitialAd.createForAdRequest(adUnitId1);
const interstitial2 = InterstitialAd.createForAdRequest(adUnitId2);

const GalleryApp = () => {
  const [albums, setAlbums] = useState([]);
  const [resAlbums, setResAlbums] = useState(albums);
  const [mediaItems, setMediaItems] = useState([]); // Updated to store both images and videos
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(null); // Track selected media item (image/video)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasMoreMedia, setHasMoreMedia] = useState(true); // Track if there are more media items
  const [loadingMoreMedia, setLoadingMoreMedia] = useState(false); // Show loading indicator when fetching more items
  const [nextPage, setNextPage] = useState(null); // For pagination
  const [headerTitle, setHeaderTitle] = useState(); // Header title
  const [selectedOption, setSelectedOption] = useState(null);
  const [groupedMediaItems, setGroupedMediaItems] = useState([]);
  const [seletedTotalCount, setSeletedTotalCount] = useState();
  const [noAlbum, setNoAlbum] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    filterAlbums(searchQuery);
    // if(albums.length > 0){
    //   setNoAlbum(false);
    // }
  }, [albums, searchQuery]);

  useEffect(() => {
    interstitial1.load();
    interstitial2.load();
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
    const albumList = await getMyAlbumsData();
    if (albumList.length > 0) {
      setNoAlbum(false);
      const albumsWithImages = await Promise.all(
        albumList.map(async (album) => {
          const assets = await MediaLibrary.getAssetsAsync({
            album: album.id,
            mediaType: ["photo", "video"],
            first: 1,
            sortBy: [MediaLibrary.SortBy.modificationTime], // Fetch only the first media item
          });

          // const assetCount = await MediaLibrary.getAssetsAsync({
          //   album: album.id,
          //   mediaType: ["photo", "video"],
          // });

          return assets.totalCount > 0 // Filter out albums with no items
            ? {
                ...album,
                firstMedia: assets.assets[0], // Store the first media item (can be photo or video)
                totalCount: assets.totalCount, // Total number of assets (photos + videos)
              }
            : null;
        })
      );
      const storedAlbums = await AsyncStorage.getItem("albums");
      if (storedAlbums !== null) {
        setAlbums([
          ...albumsWithImages.filter(Boolean),
          ...JSON.parse(storedAlbums),
        ]); // Remove null entries
      } else {
        setAlbums(albumsWithImages.filter(Boolean));
      }
    } else {
      setNoAlbum(true);
    }
    setRefreshing(false);
  };

  const loadMediaFromAlbum = async (albumId, albumName, totalCount) => {
    setRefreshing(true);
    if(interstitial1.loaded){
      interstitial1.show();
    }
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
    setRefreshing(false);
  };

  const loadMoreMedia = async () => {
    if (!hasMoreMedia || loadingMoreMedia) return;

    setLoadingMoreMedia(true);
    const moreAssets = await MediaLibrary.getAssetsAsync({
      album: selectedAlbum,
      mediaType: ["photo", "video"],
      first: 100,
      after: nextPage,
      sortBy: [MediaLibrary.SortBy.modificationTime], // Fetch only the first media item
    });
    const group = groupMediaByDate(
      [...mediaItems, ...moreAssets.assets],
      selectedOption
    );
    setGroupedMediaItems(group);
    setMediaItems([...mediaItems, ...moreAssets.assets]);
    setHasMoreMedia(moreAssets.hasNextPage);
    setNextPage(moreAssets.endCursor);
    setLoadingMoreMedia(false);
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
    if(interstitial2.loaded){
      interstitial2.show();
    }
    setSelectedMediaIndex(index);
    setIsModalVisible(true);
  };

  const backNavigation = useCallback(() => {
    setSelectedAlbum(null);
    setHeaderTitle(null);
    setMediaItems([]);
    setGroupedMediaItems([]);
    setSelectedOption(null);
  }, []);

  const handleOptionSelect = (option) => {
    if (selectedOption === option) {
      setSelectedOption(null); // Deselect the option
    } else {
      setSelectedOption(option);
      const grouped = groupMediaByDate(mediaItems, option);
      setGroupedMediaItems(grouped);
    }
  };
  const closeMediaDetail = () => {
    setIsModalVisible(false);
  };

  const onRefresh = async () => {
    if (selectedAlbum) {
      setRefreshing(true);
      await loadMediaFromAlbum();
      setRefreshing(false);
    } else {
      setRefreshing(true);
      await loadAlbumsWithFirstImage();
      setRefreshing(false);
    }
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
  const filterAlbums = (query) => {
    let filteredAlbums = [];
    if (query.trim()) {
      filteredAlbums = filteredAlbums.filter((album) =>
        album.title.toLowerCase().includes(query.toLowerCase())
      );
    }
    if (filteredAlbums.length > 0) {
      setResAlbums(filteredAlbums);
    } else {
      setResAlbums(albums);
    }
  };
  const handleSerachInput = (value) => {
    setSearchQuery(value);
    filterAlbums(value);
  };

  const handleOnClear = () => {
    setSearchQuery("");
    filterAlbums("");
  };

  const handleOnCancel = () => {
    setSearchQuery("");
    setResAlbums(albums);
  };

  return (
    <View style={styles.container}>
      <GalleryHeader
        selectedAlbum={selectedAlbum}
        headerTitle={headerTitle}
        backNavigation={backNavigation}
        setAlbums={setAlbums}
        albums={albums}
        value={searchQuery}
        handleSerachInput={handleSerachInput}
        handleOnCancel={handleOnCancel}
        handleOnClear={handleOnClear}
      />
      <AlbumTitle headerTitle={headerTitle} title={"Collection"} />
      {noAlbum && <Text style={styles.noAlbumText}>No personal collection found</Text>}
      {selectedOption && selectedAlbum ? (
        <GroupedMediaList
          groupedMediaItems={groupedMediaItems}
          onMediaPress={openMedia}
          handleScroll={handleScroll}
          loadingMoreMedia={loadingMoreMedia}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      ) : (
        <MediaList
          mediaAlbumItems={selectedAlbum ? mediaItems : resAlbums}
          onMediaPress={openMedia}
          handleScroll={selectedAlbum && handleScroll}
          selectedAlbum={selectedAlbum}
          loadMediaFromAlbum={loadMediaFromAlbum}
          loadingMoreMedia={loadingMoreMedia}
          setMediaItems={setMediaItems}
          albums={albums}
          onRefresh={onRefresh}
          setResAlbums={setAlbums}
          refreshing={refreshing}
        />
      )}
      {selectedAlbum && (
        <FloatingMenu
          handleOptionSelect={handleOptionSelect}
          selectedOption={selectedOption}
        />
      )}
      {isModalVisible && (
        <ImageDetailView
          mediaItems={mediaItems}
          selectedMediaIndex={selectedMediaIndex}
          onClose={closeMediaDetail}
          setMediaItems={handleImageDeletion}
          isModalVisible={isModalVisible}
          totalCount={seletedTotalCount}
          IsVault={true}
        />
      )}
    </View>
  );
};

export default GalleryApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  noAlbumText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: "70%",
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
});
