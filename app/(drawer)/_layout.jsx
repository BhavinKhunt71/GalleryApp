import { View, Text, StyleSheet, Image } from "react-native";
import React, { useEffect } from "react";
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

const CustomDrawerContent = (props) => {
  const pathname = usePathname();

  useEffect(() => {
    console.log(pathname);
  }, [pathname]);

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView
        {...props}
        scrollEnabled={false}
        contentContainerStyle={{ backgroundColor: "#ECF3FF" }}
      >
        <View style={styles.userImgContainer}>
          <Image
            source={require("../../assets/images/icon/icon.png")}
            width={86}
            height={86}
            style={styles.userImg}
          />
          <Text style={styles.userName}>Gallery</Text>
        </View>

        <View style={{ backgroundColor: "#fff", paddingTop: 10 }}>
          <DrawerItem
            icon={() => (
              <Image
                source={require("../../assets/images/icon/Home.png")}
                style={pathname == "/" ? styles.selectedIcon : styles.Icon}
              />
            )}
            label={"Home"}
            labelStyle={[
              styles.navItemLabel,
              { color: pathname == "/" ? "#fff" : "#000" },
            ]}
            style={{
              backgroundColor: pathname == "/" ? "#3478F6" : "#fff",
            }}
            onPress={() => {
              router.push("/(drawer)/(tabs)/");
            }}
          />
          <DrawerItem
            icon={() => (
              <Image
                source={require("../../assets/images/icon/photos.png")}
                style={
                  pathname == "/Photos" ? styles.selectedIcon : styles.Icon
                }
              />
            )}
            label={"Photos"}
            labelStyle={[
              styles.navItemLabel,
              { color: pathname == "/Photos" ? "#fff" : "#000" },
            ]}
            style={{
              backgroundColor: pathname == "/Photos" ? "#3478F6" : "#fff",
            }}
            onPress={() => {
              router.push("/(drawer)/(tabs)/Photos");
            }}
          />
          <DrawerItem
            icon={() => (
              <Image
                source={require("../../assets/images/icon/vidoes.png")}
                style={
                  pathname == "/Videos" ? styles.selectedIcon : styles.Icon
                }
              />
            )}
            label={"Videos"}
            labelStyle={[
              styles.navItemLabel,
              { color: pathname == "/Videos" ? "#fff" : "#000" },
            ]}
            style={{
              backgroundColor: pathname == "/Videos" ? "#3478F6" : "#fff",
            }}
            onPress={() => {
              router.push("/(drawer)/(tabs)/Videos");
            }}
          />
          <DrawerItem
            icon={() => (
              <Image
                source={require("../../assets/images/icon/collection.png")}
                style={
                  pathname == "/Collection" ? styles.selectedIcon : styles.Icon
                }
              />
            )}
            label={"Collection"}
            labelStyle={[
              styles.navItemLabel,
              { color: pathname == "/Collection" ? "#fff" : "#000" },
            ]}
            style={{
              backgroundColor: pathname == "/Collection" ? "#3478F6" : "#fff",
            }}
            onPress={() => {
              router.push("/(drawer)/(tabs)/Collection");
            }}
          />
          <DrawerItem
            icon={() => (
              <Image
                source={require("../../assets/images/icon/vault.png")}
                style={pathname == "/Vault" ? styles.selectedIcon : styles.Icon}
              />
            )}
            label={"Vault"}
            labelStyle={[
              styles.navItemLabel,
              { color: pathname == "/Vault" ? "#fff" : "#000" },
            ]}
            style={{
              backgroundColor: pathname == "/Vault" ? "#3478F6" : "#fff",
            }}
            onPress={() => {
              router.push("/(drawer)/(tabs)/Vault");
            }}
          />
        </View>
      </DrawerContentScrollView>
    </View>
  );
};

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerActiveTintColor: "#fff",
          drawerActiveBackgroundColor: "#3478F6",
          drawerStyle: { width: 230 },
        }}
      >
        {/* <Drawer.Screen name="favourites" options={{headerShown: true}} />
      <Drawer.Screen name="settings" options={{headerShown: true}} /> */}
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  navItemLabel: {
    marginLeft: -10,
    fontSize: 16,
    fontWeight: "500",
  },
  Icon: {
    width: 20,
    height: 20,
    tintColor: "#3478F6",
    objectFit: "contain",
  },
  selectedIcon: {
    tintColor: "#FFFFFF",
    width: 20,
    height: 20,
    objectFit: "contain",
  },
  userInfoWrapper: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginBottom: 10,
    backgroundColor: "#000000",
  },
  userImgContainer:{
      paddingVertical: 50,
      justifyContent: 'center',
      alignItems: 'center'
  },
  userImg: {
    width: 86,
    height: 86,
  },
  userDetailsWrapper: {
    marginTop: 25,
    marginLeft: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: "500",
    textAlign:'center',
    paddingTop: 10,
  },
  userEmail: {
    fontSize: 16,
    fontStyle: "italic",
    textDecorationLine: "underline",
  },
});
