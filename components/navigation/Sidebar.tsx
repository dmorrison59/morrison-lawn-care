import { SymbolView } from "expo-symbols";
import { Link, usePathname } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { NAV_ITEMS } from "./nav-items";

const SIDEBAR_WIDTH = 220;

export function Sidebar() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          width: SIDEBAR_WIDTH,
          borderRightColor: colorScheme === "dark" ? "#222" : "#eee",
        },
      ]}
    >
      <Text style={styles.brand}>Morrison Lawn Care</Text>

      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.matchPrefix ||
          pathname.startsWith(item.matchPrefix + "/");
        const color = active ? colors.tint : colors.tabIconDefault;
        return (
          <Link key={item.key} href={item.href} asChild>
            <Pressable
              style={StyleSheet.flatten([
                styles.item,
                active && styles.itemActive,
              ])}
            >
              <SymbolView name={item.icon} tintColor={color} size={20} />
              <Text
                style={[
                  styles.itemLabel,
                  { color: active ? colors.tint : colors.text },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

export { SIDEBAR_WIDTH };

const styles = StyleSheet.create({
  container: {
    height: "100%",
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: 24,
    paddingHorizontal: 12,
    gap: 4,
  },
  brand: {
    fontSize: 15,
    fontWeight: "700",
    opacity: 0.7,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  itemActive: {
    backgroundColor: "rgba(47, 111, 78, 0.12)",
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
});
