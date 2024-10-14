import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeAlbumData = async (albums) => {
  try {
    await AsyncStorage.setItem("albums", JSON.stringify(albums));
  } catch (error) {
    console.error("Error saving album data:", error);
  }
};

// Function to retrieve albums from AsyncStorage
export const getAlbumsData = async () => {
  try {
    //   await AsyncStorage.clear();
    const albumsData = await AsyncStorage.getItem("albums");
    return albumsData ? JSON.parse(albumsData) : [];
  } catch (error) {
    console.error("Error retrieving album data:", error);
    return [];
  }
};

export const storeMyAlbumData = async (albums) => {
  try {
    await AsyncStorage.setItem("myAlbums", JSON.stringify(albums));
  } catch (error) {
    console.error("Error saving my album data:", error);
  }
};

// Function to retrieve albums from AsyncStorage
export const getMyAlbumsData = async () => {
  try {
    // await AsyncStorage.clear();
    const albumsData = await AsyncStorage.getItem("myAlbums");
    return albumsData ? JSON.parse(albumsData) : [];
  } catch (error) {
    console.error("Error retrieving my album data:", error);
    return [];
  }
};

export const storeVaultData = async (albums) => {
  try {
    await AsyncStorage.setItem("Vault", JSON.stringify(albums));
  } catch (error) {
    console.error("Error saving my album data:", error);
  }
};

// Function to retrieve albums from AsyncStorage
export const getVaultData = async () => {
  try {
    // await AsyncStorage.clear();
    const albumsData = await AsyncStorage.getItem("Vault");
    return albumsData ? JSON.parse(albumsData) : [];
  } catch (error) {
    console.error("Error retrieving my album data:", error);
    return [];
  }
};

export const storeMyVaultData = async (albums) => {
  try {
    await AsyncStorage.setItem("myVault", JSON.stringify(albums));
  } catch (error) {
    console.error("Error saving my album data:", error);
  }
};

// Function to retrieve albums from AsyncStorage
export const getMyVaultData = async () => {
  try {
    // await AsyncStorage.clear();
    const albumsData = await AsyncStorage.getItem("myVault");
    return albumsData ? JSON.parse(albumsData) : [];
  } catch (error) {
    console.error("Error retrieving my album data:", error);
    return [];
  }
};

export const storeIdVaultData = async (albums) => {
  try {
    await AsyncStorage.setItem("idVault", JSON.stringify(albums));
  } catch (error) {
    console.error("Error saving my album data:", error);
  }
};

// Function to retrieve albums from AsyncStorage
export const getIdVaultData = async () => {
  try {
    // await AsyncStorage.clear();
    const albumsData = await AsyncStorage.getItem("idVault");
    return albumsData ? JSON.parse(albumsData) : [];
  } catch (error) {
    console.error("Error retrieving my album data:", error);
    return [];
  }
};

  // Format duration for video display
 export const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    if (m > 0) {
      return `${m}:${String(s).padStart(2, "0")}`;
    }
    return `0:${String(s).padStart(2, "0")}`;
  };


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
  // Function to load and show interstitial ad
  
 export  const groupMediaByDate = (Items, option) => {
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