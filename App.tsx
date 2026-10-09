import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type Coordinate = {
  latitude: number;
  longitude: number;
};

const MAPS_CO_API_KEY = process.env.EXPO_PUBLIC_MAPS_CO_API_KEY;
const DEFAULT_COORDINATE: Coordinate = {
  latitude: 60.200692,
  longitude: 24.934302,
};

export default function App() {
  const [address, setAddress] = useState("");
  const [searchedAddress, setSearchedAddress] = useState("");
  const [coordinate, setCoordinate] =
    useState<Coordinate>(DEFAULT_COORDINATE);
  const [isSearching, setIsSearching] = useState(false);

  const showAddress = async () => {
    const query = address.trim();

    if (!query) {
      Alert.alert("Enter an address", "Type an address before pressing Show.");
      return;
    }

    if (!MAPS_CO_API_KEY) {
      Alert.alert(
        "Missing maps.co API key",
        "Add EXPO_PUBLIC_MAPS_CO_API_KEY to your .env file and restart Expo.",
      );
      return;
    }

    setIsSearching(true);

    try {
      const url =
        `https://geocode.maps.co/search?q=${encodeURIComponent(query)}` +
        `&api_key=${encodeURIComponent(MAPS_CO_API_KEY)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`maps.co returned HTTP ${response.status}`);
      }

      const results: Array<{
        lat?: string;
        lon?: string;
        display_name?: string;
      }> = await response.json();
      const firstResult = results[0];

      if (!firstResult?.lat || !firstResult.lon) {
        Alert.alert("Address not found", "Try a more complete address.");
        return;
      }

      const nextCoordinate = {
        latitude: Number(firstResult.lat),
        longitude: Number(firstResult.lon),
      };

      if (
        !Number.isFinite(nextCoordinate.latitude) ||
        !Number.isFinite(nextCoordinate.longitude)
      ) {
        throw new Error("maps.co returned invalid coordinates");
      }

      setCoordinate(nextCoordinate);
      setSearchedAddress(firstResult.display_name ?? query);
    } catch (error) {
      console.error("Address search failed:", error);
      Alert.alert(
        "Search failed",
        "Could not search the address. Check your internet connection and try again.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.searchBar}>
          <TextInput
            autoCapitalize="words"
            onChangeText={setAddress}
            onSubmitEditing={showAddress}
            placeholder="Enter an address"
            returnKeyType="search"
            style={styles.input}
            value={address}
          />
          <Pressable
            accessibilityRole="button"
            disabled={isSearching}
            onPress={showAddress}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isSearching && styles.buttonDisabled,
            ]}
          >
            {isSearching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Show</Text>
            )}
          </Pressable>
        </View>
        <MapView
          region={{
            ...coordinate,
            latitudeDelta: 0.0322,
            longitudeDelta: 0.0221,
          }}
          style={styles.map}
        >
          {searchedAddress ? (
            <Marker coordinate={coordinate} title={searchedAddress} />
          ) : null}
        </MapView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    flex: 1,
    width: "100%",
  },
  searchBar: {
    backgroundColor: "#fff",
    flexDirection: "row",
    gap: 8,
    padding: 12,
    width: "100%",
  },
  input: {
    borderColor: "#c7c7c7",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#1769aa",
    borderRadius: 8,
    justifyContent: "center",
    minWidth: 76,
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
