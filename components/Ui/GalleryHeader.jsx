import React, { memo, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Button,
  PermissionsAndroid,
  Platform,
  Alert,
  Linking,
} from "react-native";
// Import AsyncStorage
import Drawer from "../../assets/images/icon/drawer.svg";
import Search from "../../assets/images/icon/search.svg";
import Dots from "../../assets/images/icon/dots.svg";
import BackIcon from "../../assets/images/icon/back.svg";
import Album from "../../assets/images/icon/album.svg";
import Camera from "../../assets/images/icon/camera.svg";
import {
  useNavigation,
  DrawerActions,
  useRoute,
} from "@react-navigation/native";
import * as ImagePicker from "react-native-image-picker"; // For opening the camera
import * as IntentLauncher from "expo-intent-launcher";
import { PERMISSIONS, request, RESULTS } from "react-native-permissions";
import uuid from "react-native-uuid";
import {
  getAlbumsData,
  getVaultData,
  storeAlbumData,
} from "../../constants/utils";
import { Ionicons } from "@expo/vector-icons";
const GalleryHeader = ({
  selectedAlbum,
  headerTitle,
  backNavigation,
  setAlbums,
  albums,
  handleSerachInput,
  value,
  handleOnClear,
  handleOnCancel,
}) => {
  const navigation = useNavigation();
  const [dotsModalVisible, setDotsModalVisible] = useState(false);
  const [createAlbumModalVisible, setCreateAlbumModalVisible] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [isSearch, setIsSerach] = useState(false);
  const route = useRoute();

  const drawerOpen = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const requestCameraPermission = async () => {
    const result = await request(PERMISSIONS.ANDROID.CAMERA);

    if (result === RESULTS.GRANTED) {
      try {
        await IntentLauncher.startActivityAsync(
          "android.media.action.STILL_IMAGE_CAMERA"
        );
      } catch (error) {
        console.error("Error launching camera:", error);
      }
    } else if (result === RESULTS.DENIED) {
      // setCameraPermission("denied");
    } else if (result === RESULTS.BLOCKED) {
      // setCameraPermission("blocked");
    }
  };
  // Function to handle album creation
  const handleCreateAlbum = async () => {
    if (!albumName) return;

    // Fetch existing albums and vault data
    const existingAlbums = await getAlbumsData();
    const existingVaultAlbums = await getVaultData();

    // Check if the album name already exists in the albums, existingAlbums, or vault albums
    const albumExists =
      albums.some(
        (album) => album.title.toLowerCase() === albumName.toLowerCase()
      ) ||
      (existingAlbums && existingAlbums.length > 0 &&
        existingAlbums.some(
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

    // Update the albums state if no duplicates are found
    const newAlbum = {
      id: uuid.v4(),
      title: albumName,
      firstMedia: null,
      totalCount: 0,
    };
    setAlbums((prevAlbums) => {
      const updatedAlbums = [...prevAlbums, newAlbum];

      return updatedAlbums;
    });

    // Reset album creation state
    setAlbumName("");
    setCreateAlbumModalVisible(false);

    // Update albums list with the new album and store them
    const updatedAlbums = [...existingAlbums, newAlbum];
    await storeAlbumData(updatedAlbums);

    console.log("Album created:", albumName);
  };

  const onCancel = () => {
    setIsSerach(false);
    handleOnCancel();
  };
  if (isSearch) {
    return (
      <View style={styles.serachMainContainer}>
        <View style={styles.serachContainer}>
          <Ionicons name="search" size={18} color="#a3a3a3" />
          <TextInput
            value={value}
            onChangeText={handleSerachInput}
            style={styles.input}
            placeholder="Search Albums"
            cursorColor={"#60a5fa"}
            placeholderTextColor="#a3a3a3"
          />
          {value && (
            <TouchableOpacity onPress={handleOnClear}>
              <Ionicons name="close" size={18} color="#a3a3a3" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
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
      {!selectedAlbum ? (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setIsSerach(true)}
          >
            <Search />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setDotsModalVisible(true)}
          >
            <Dots />
          </TouchableOpacity>
        </View>
      ) : (
        <View></View>
      )}

      {/* Dots Modal */}
      <Modal
        transparent={true}
        visible={dotsModalVisible}
        animationType="fade"
        onRequestClose={() => setDotsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setDotsModalVisible(false)}
        >
          <View style={styles.dotsModal}>
            {route.name != "Collection" ? (
              <TouchableOpacity
                onPress={() => {
                  setDotsModalVisible(false);
                  setCreateAlbumModalVisible(true);
                }}
                style={styles.modalOption}
              >
                <View style={styles.modelInfo}>
                  <Text style={styles.modelInfoTitle}>Create Album</Text>
                  <Album />
                </View>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={requestCameraPermission}
              style={styles.modalOption}
            >
              <View style={styles.modelInfo}>
                <Text style={styles.modelInfoTitle}>Open Camera</Text>
                <Camera />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
              maxLength={20}
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

export default memo(GalleryHeader);

const styles = StyleSheet.create({
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  dotsModal: {
    position: "absolute",
    top: 60,
    right: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: "#000",
    elevation: 5,
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
  serachMainContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  serachContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    width: "86%",
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 0,
    backgroundColor: "#e5e7eb",
  },
  input: {
    flex: 1,
    height: 30,
    borderRadius: 999, // To make it fully rounded
    paddingLeft: 16,
    paddingRight: 48, // Add space for clear button
    fontSize: 16,
    color: "#4b5563",
    width: "100%",
  },
  clearButton: {
    position: "absolute",
    right: 16,
  },
  cancelButton: {
    color: "#3478F6",
    fontSize: 16,
    fontWeight: "medium",
    paddingHorizontal: 8,
  },
});
