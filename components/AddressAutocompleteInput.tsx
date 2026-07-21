import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextStyle,
  View as RNView,
} from "react-native";

import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import {
  autocompletePlaces,
  generateSessionToken,
  getPlaceDetails,
  isPlacesConfigured,
  type PlaceDetails,
  type PlaceSuggestion,
} from "@/lib/places";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

export function AddressAutocompleteInput({
  value,
  onChangeText,
  onSelectPlace,
  placeholder = "Address",
  editable = true,
  style,
  multiline,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace?: (place: PlaceDetails) => void;
  placeholder?: string;
  editable?: boolean;
  style?: StyleProp<TextStyle>;
  multiline?: boolean;
}) {
  const colorScheme = useColorScheme();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const sessionTokenRef = useRef(generateSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const handleChangeText = (text: string) => {
    onChangeText(text);

    if (!isPlacesConfigured) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await autocompletePlaces(text, sessionTokenRef.current);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);
    try {
      const details = await getPlaceDetails(
        suggestion.placeId,
        sessionTokenRef.current,
      );
      onChangeText(details.formattedAddress);
      onSelectPlace?.(details);
    } catch {
      // Fall back to whatever text the user already typed/selected.
      onChangeText(suggestion.text);
    } finally {
      sessionTokenRef.current = generateSessionToken();
    }
  };

  const dropdownBackground = colorScheme === "dark" ? "#1c1c1e" : "#fff";
  const dropdownBorder = colorScheme === "dark" ? "#2c2c2e" : "#e5e5e5";

  return (
    <RNView style={styles.container}>
      <TextInput
        style={[styles.input, style, !editable && styles.inputDisabled]}
        placeholder={placeholder}
        value={value}
        onChangeText={handleChangeText}
        editable={editable}
        multiline={multiline}
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
      />
      {loading && <ActivityIndicator style={styles.spinner} size="small" />}
      {showSuggestions && (
        <RNView
          style={[
            styles.dropdown,
            {
              backgroundColor: dropdownBackground,
              borderColor: dropdownBorder,
            },
          ]}
        >
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion.placeId}
              style={styles.suggestionRow}
              onPress={() => handleSelectSuggestion(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion.text}</Text>
            </Pressable>
          ))}
        </RNView>
      )}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  spinner: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 20,
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)" },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      },
    }),
  },
  suggestionRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 15,
  },
});
