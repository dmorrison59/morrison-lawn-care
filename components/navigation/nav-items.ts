import type { SymbolViewProps } from "expo-symbols";

export type NavIconName = SymbolViewProps["name"];

export type NavItem = {
  key: string;
  href:
    | "/(tabs)/customers"
    | "/(tabs)/quotes"
    | "/(tabs)/jobs"
    | "/(tabs)/settings";
  label: string;
  // Pathname prefix (via usePathname(), which strips route groups) used to
  // decide whether this item is active — customers has nested routes like
  // /customers/new and /customers/[id], so it's a prefix match, not exact.
  matchPrefix: string;
  icon: NavIconName;
};

export const NAV_ITEMS: NavItem[] = [
  {
    key: "customers",
    href: "/(tabs)/customers",
    label: "Customers",
    matchPrefix: "/customers",
    icon: { ios: "person.2", android: "group", web: "group" },
  },
  {
    key: "quotes",
    href: "/(tabs)/quotes",
    label: "Quotes",
    matchPrefix: "/quotes",
    icon: { ios: "doc.text", android: "description", web: "description" },
  },
  {
    key: "jobs",
    href: "/(tabs)/jobs",
    label: "Jobs",
    matchPrefix: "/jobs",
    icon: { ios: "wrench.and.screwdriver", android: "build", web: "build" },
  },
  {
    key: "settings",
    href: "/(tabs)/settings",
    label: "Settings",
    matchPrefix: "/settings",
    icon: { ios: "gearshape", android: "settings", web: "settings" },
  },
];
