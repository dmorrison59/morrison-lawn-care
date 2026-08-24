import { Stack } from "expo-router";

export default function JobsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Jobs" }} />
      <Stack.Screen name="new" options={{ title: "New Job", presentation: "modal" }} />
      <Stack.Screen name="[id]" options={{ title: "Job" }} />
    </Stack>
  );
}
