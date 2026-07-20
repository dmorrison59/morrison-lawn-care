import { Slot } from "expo-router";
import { useWindowDimensions } from "react-native";

import { View } from "@/components/Themed";
import { BottomNavBar } from "@/components/navigation/BottomNavBar";
import { Sidebar } from "@/components/navigation/Sidebar";

// Below this width we're in "phone" territory (including Expo Go on an
// actual phone, which always hits this branch): a bottom nav bar. At or
// above it — most browser windows, tablets in landscape — a left sidebar
// reads better than a nav bar stretched edge to edge.
const WIDE_LAYOUT_BREAKPOINT = 768;

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_LAYOUT_BREAKPOINT;

  if (isWide) {
    return (
      <View style={{ flex: 1, flexDirection: "row" }}>
        <Sidebar />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <BottomNavBar />
    </View>
  );
}
