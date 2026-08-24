import { Stack } from "expo-router";

export default function QuotesStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Quotes" }} />
      <Stack.Screen name="new" options={{ title: "New Quote", presentation: "modal" }} />
      <Stack.Screen name="[id]" options={{ title: "Quote" }} />
    </Stack>
  );
}
