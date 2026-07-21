import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";

import { AuthCard } from "@/components/AuthCard";
import { Text } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const onSubmit = async () => {
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email.trim(), password);
      // If the project requires email confirmation, signUp succeeds without a
      // session; the auth listener won't fire until the user confirms and
      // logs in. Otherwise the session appears immediately and the root
      // layout redirects to the create-business step on its own.
      setCheckEmail(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to sign up");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkEmail) {
    return (
      <AuthCard>
        <Text style={styles.title}>Check your email</Text>
        <Text>
          We sent a confirmation link to {email}. Once confirmed, log in to
          finish setting up your business.
        </Text>
        <Link href="/(auth)/login" style={styles.link}>
          <Text>Back to log in</Text>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <Text style={styles.title}>Sign up</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        autoComplete="password-new"
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={submitting || !email || !password || !confirmPassword}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign up</Text>
        )}
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        <Text>Already have an account? Log in</Text>
      </Link>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2f6f4e",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#c0392b",
  },
  link: {
    marginTop: 16,
    alignSelf: "center",
  },
});
