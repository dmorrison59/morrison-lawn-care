import { SymbolView } from "expo-symbols";
import { Link, usePathname } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { NAV_ITEMS } from "./nav-items";

export function BottomNavBar() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          borderTopColor: colorScheme === "dark" ? "#222" : "#eee",
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.matchPrefix ||
          pathname.startsWith(item.matchPrefix + "/");
        const color = active ? colors.tint : colors.tabIconDefault;
        return (
          <Link key={item.key} href={item.href} asChild>
            <Pressable style={styles.item}>
              <SymbolView name={item.icon} tintColor={color} size={24} />
              <Text style={[styles.itemLabel, { color }]}>{item.label}</Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  itemLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
});
