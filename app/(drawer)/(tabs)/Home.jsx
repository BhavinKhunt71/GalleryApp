import React, { useState,useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { Video } from "expo-av"; // For video rendering
import FastImage from "react-native-fast-image"; // FastImage for image rendering
import Drawer from "../../../assets/images/icon/drawer.svg";
import Search from "../../../assets/images/icon/search.svg";
import Dots from "../../../assets/images/icon/dots.svg";
import RightArrow from "../../../assets/images/icon/rightArrow.svg";
import LeftArrow from "../../../assets/images/icon/leftArrow.svg";
import BackIcon from "../../../assets/images/icon/back.svg"; // Assume you have a back icon
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { GroupedMediaList } from "../../../components/GroupedMediaList";

const { width } = Dimensions.get("window");

function formatDate(timestamp, formatType) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (formatType) {
    switch (formatType.toLowerCase()) {
      case "year":
        return date.getFullYear(); // Return the year in YYYY format

      case "month":
        // Return the month and year in "Month YYYY" format
        return date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

      case "day":
        if (date.toDateString() === today.toDateString()) {
          return "Today"; // Return 'Today' if it's the same day
        } else if (date.toDateString() === yesterday.toDateString()) {
          return "Yesterday"; // Return 'Yesterday' if it's the previous day
        } else {
          // Return the date in "1 March 2024" format
          return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        }

      default:
        return "Invalid format type"; // Return an error message for unsupported types
    }
  }
}

const GalleryApp = () => {
  const [albums, setAlbums] = useState([]);
  const [mediaItems, setMediaItems] = useState([]); // Updated to store both images and videos
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(null); // Track selected media item (image/video)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasMoreMedia, setHasMoreMedia] = useState(true); // Track if there are more media items
  const [loadingMoreMedia, setLoadingMoreMedia] = useState(false); // Show loading indicator when fetching more items
  const [nextPage, setNextPage] = useState(null); // For pagination
  const [headerTitle, setHeaderTitle] = useState(); // Header title
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [groupedMediaItems, setGroupedMediaItems] = useState();
  // const [selectedDate, setSelectecDate] = useState("year"); //
  const navigation = useNavigation();

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

  const drawerOpen = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const loadAlbumsWithFirstImage = async () => {
    const albumList = await MediaLibrary.getAlbumsAsync();
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
    setAlbums(albumsWithImages.filter(Boolean)); // Remove null entries
  };

  const loadMediaFromAlbum = async (albumId, albumName) => {
    setSelectedAlbum(albumId);
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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

  const renderAlbumItem = ({ item }) => {
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
  };
  const renderMediaItem = ({ item, index }) => {
    return (
      <View style={styles.itemsContainer}>
        <TouchableOpacity
          onPress={() => openMedia(index)}
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
  };

  const backNavigation = () => {
    setSelectedAlbum(null);
    setHeaderTitle(null);
  };

  const adjustDataForColumns = (data, numColumns) => {
    const numberOfFullRows = Math.floor(data.length / numColumns);
    let numberOfElementsLastRow = data.length - numberOfFullRows * numColumns;
    while (
      numberOfElementsLastRow !== numColumns &&
      numberOfElementsLastRow !== 0
    ) {
      data.push({ id: `empty-${numberOfElementsLastRow}`, empty: true });
      numberOfElementsLastRow++;
    }
    return data;
  };

  // const groupMediaByDate = (Items, option) => {
  //   const groupedData = Items.reduce((acc, item) => {
  //     const formattedDate = formatDate(item.modificationTime, option);
  //     if (!acc[formattedDate]) {
  //       acc[formattedDate] = [];
  //     }
  //     acc[formattedDate].push(item);
  //     return acc;
  //   }, {});
  //   return Object.entries(groupedData);
  // };

  const groupMediaByDate = (Items, option) => {
    const groupedData = Items.reduce((acc, item) => {
      const formattedDate = formatDate(item.modificationTime, option);
      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push(item);
      return acc;
    }, {});

    // Convert the object to an array of [date, items] entries and sort by date
    const sortedGroupedData = Object.entries(groupedData).sort((a, b) => {
      // Sort based on the option selected
      if (option === "Year") {
        return parseInt(b[0]) - parseInt(a[0]); // Descending order for years
      }
      // For Month and Day, we need to parse dates for proper sorting
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateB - dateA; // Descending order for months and days
    });

    return sortedGroupedData;
  };

  const handleOptionSelect = (option) => {
    if (selectedOption === option) {
      setSelectedOption(null); // Deselect the option
    } else {
      setSelectedOption(option); // Select the option
      const grouped = groupMediaByDate(mediaItems, option);
      setGroupedMediaItems(grouped); // Save the grouped items
    }
  };
  // const renderGroupedMedia = ({ item }) => {
  //   const [date, items] = item; // Destructure date and media items

  //   return (
  //     <View>
  //       {/* Render Date Header */}
  //       <Text style={styles.dateText}>{date}</Text>

  //       {/* Render Media Items for this date */}
  //       <FlashList
  //         data={items}
  //         estimatedItemSize={110}
  //         renderItem={({ item, index }) => (
  //           <TouchableOpacity
  //             onPress={() => openMedia(index)}
  //             style={styles.mediaItem}
  //           >
  //             {item.mediaType === "photo" ? (
  //               <FastImage
  //                 source={{
  //                   uri: item.uri,
  //                   priority: FastImage.priority.high,
  //                   cache: FastImage.cacheControl.immutable,
  //                 }}
  //                 style={styles.mediaImage}
  //                 resizeMode={FastImage.resizeMode.cover}
  //               />
  //             ) : (
  //               <Video
  //                 source={{ uri: item.uri }}
  //                 style={styles.mediaImage}
  //                 useNativeControls
  //                 resizeMode="cover"
  //                 isLooping
  //               />
  //             )}
  //           </TouchableOpacity>
  //         )}
  //         keyExtractor={(item) => item.id}
  //         numColumns={3}
  //       />
  //     </View>
  //   );
  // };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {selectedAlbum ? (
          <TouchableOpacity onPress={backNavigation} style={styles.button}>
            <BackIcon />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={drawerOpen} style={styles.button}>
            <Drawer />
          </TouchableOpacity>
        )}
        {headerTitle ? (
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        ) : null}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.button}>
            <Search />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Dots />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.albumContainer}>
        {!headerTitle ? <Text style={styles.albumText}>Home</Text> : null}
      </View>
      {selectedOption && selectedAlbum ? (
        // <FlashList
        //   data={groupedMediaItems}
        //   key={"groupMediaItems"}
        //   keyExtractor={(item, index) => `${item.date}-${index}`}
        //   renderItem={renderGroupedMedia}
        //   estimatedItemSize={110}
        //   numColumns={1}
        //   onScroll={selectedAlbum && handleScroll}
        //   scrollEventThrottle={16}
        //   ListFooterComponent={
        //     loadingMoreMedia ? (
        //       <ActivityIndicator size="large" color="#00ff00" />
        //     ) : null
        //   }
        // />
        <GroupedMediaList
          groupedMediaItems={groupedMediaItems}
          onMediaPress={openMedia}
          handleScroll={handleScroll}
          loadingMoreMedia={loadingMoreMedia}
        />
      ) : (
        <FlashList
          data={selectedAlbum ? mediaItems : adjustDataForColumns(albums, 3)}
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
      )}
      {selectedAlbum && (
        <>
          <TouchableOpacity style={styles.floatingButton} onPress={toggleMenu}>
            {isMenuOpen ? <RightArrow /> : <LeftArrow />}
          </TouchableOpacity>

          {isMenuOpen && (
            <View style={styles.menu}>
              {["Year", "Month", "Day"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.menuOption,
                    selectedOption === option && styles.menuOptionSelected,
                  ]}
                  onPress={() => handleOptionSelect(option)}
                >
                  <Text
                    style={[
                      styles.menuText,
                      selectedOption === option && styles.textSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
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
  mediaItem: {
    margin: 1,
  },
  mediaImage: {
    width: (width - 36) / 3,
    aspectRatio: 1,
    borderRadius: 7,
  },
  invisible: {
    backgroundColor: "transparent",
    width: (width - 36) / 3,
    aspectRatio: 1,
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
  floatingButton: {
    position: "absolute",
    bottom: 6,
    right: 14,
    backgroundColor: "#3478F6",
    borderRadius: 999,
    width: 44,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    position: "absolute",
    display: "flex",
    flexDirection: "row",
    bottom: 12,
    right: 60,
    backgroundColor: "#929292",
    borderRadius: 5,
    padding: 2,
    // padding: 8,
    elevation: 5,
  },
  menuOption: {
    color: "#515151",
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  menuOptionSelected: { backgroundColor: "#fff", borderRadius: 5 },
  menuText: { fontSize: 14, fontWeight: "medium", color: "#515151" },
  textSelected: {
    color: "#000",
  },
});
