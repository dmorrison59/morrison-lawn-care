import { Stack } from "expo-router";

export default function CustomersStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Customers" }} />
      <Stack.Screen name="new" options={{ title: "New Customer", presentation: "modal" }} />
      <Stack.Screen name="[id]" options={{ title: "Customer" }} />
    </Stack>
  );
}
