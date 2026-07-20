import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export function PlaceholderScreen({ title, note }: { title: string; note?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {note && <Text style={styles.note}>{note}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  note: {
    opacity: 0.6,
    textAlign: 'center',
  },
});
