import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/lib/auth-context';

export default function TabOneScreen() {
  const { session, business, role, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{business?.name ?? 'Morrison Lawn Care'}</Text>
      <Text>Logged in as {session?.user.email}</Text>
      <Text>Role: {role}</Text>
      <Pressable style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#2f6f4e',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
