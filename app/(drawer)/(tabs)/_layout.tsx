import { Tabs } from "expo-router";
import React from "react";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function TabLayout() {
  return (
    <SafeAreaView style={{ flex: 1}}>
       <StatusBar backgroundColor="#fff" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors["light"].tint,
          headerShown: false,
          tabBarLabelStyle: {
            display: "none",
          }, 
          tabBarStyle : styles.tabBar         
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Image
                source={require("../../../assets/images/icon/Home.png")}
                tintColor={focused ? color : "#555555"}
                style={styles.Icon}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Photos"
          options={{
            title: "Photos",
            tabBarIcon: ({ color, focused }) => (
              <Image
                source={require("../../../assets/images/icon/photos.png")}
                tintColor={focused ? color : "#555555"}
                style={styles.Icon}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Videos"
          options={{
            title: "Videos",
            tabBarIcon: ({ color, focused }) => (
              <Image
                source={require("../../../assets/images/icon/vidoes.png")}
                tintColor={focused ? color : "#555555"}
                style={styles.Icon}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Collection"
          options={{
            title: "collections",
            tabBarIcon: ({ color, focused }) => (
              <Image
                source={require("../../../assets/images/icon/collection.png")}
                tintColor={focused ? color : "#555555"}
                style={styles.Icon}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Vault"
          options={{
            title: "Vault",
            tabBarIcon: ({ color, focused }) => (
              <Image
                source={require("../../../assets/images/icon/vault.png")}
                tintColor={focused ? color : "#555555"}
                style={styles.Icon}
              />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  Icon: {
    width: 20,
    height: 20,
    resizeMode : "contain",
  },
  tabBar: {
    backgroundColor: "#F9F9F9",
  },
});
