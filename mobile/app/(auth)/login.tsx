// FR8X-CON Mobile — Login Screen
// Email OTP authentication with biometric fallback.

import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/hooks/useAuth";

const COLORS = {
  bg: "#0F172A",
  surface: "#1E293B",
  border: "#334155",
  accent: "#56C5F0",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  error: "#F87171",
  success: "#4ADE80",
};

type AuthStep = "email" | "otp";

export default function LoginScreen() {
  const { sendOTP, verifyOTP, biometricAvailable, biometricEnabled, authenticateWithBiometrics } =
    useAuth();

  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Countdown for OTP resend
  const startResendTimer = useCallback(() => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSendOTP = useCallback(async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await sendOTP(email.trim().toLowerCase());
    setIsLoading(false);
    if (result.success) {
      setStep("otp");
      startResendTimer();
    } else {
      setError(result.error ?? "Failed to send OTP");
    }
  }, [email, sendOTP, startResendTimer]);

  const handleVerifyOTP = useCallback(async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await verifyOTP(email.trim().toLowerCase(), otpString);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error ?? "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
    // On success: auth state updates automatically via onAuthStateChanged
  }, [otp, email, verifyOTP]);

  const handleBiometric = useCallback(async () => {
    const success = await authenticateWithBiometrics();
    if (!success) {
      Alert.alert("Biometric authentication failed", "Please sign in with your email OTP.");
    }
  }, [authenticateWithBiometrics]);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleOtpKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === "Backspace" && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Brand */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>FR8X-CON</Text>
            <Text style={styles.brandSubtitle}>Enterprise Freight Platform</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {step === "email" ? (
              <>
                <Text style={styles.cardTitle}>Sign In</Text>
                <Text style={styles.cardDescription}>
                  Enter your company email to receive a one-time password
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="yourname@company.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="send"
                  onSubmitEditing={handleSendOTP}
                  accessibilityLabel="Email address"
                />

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                  accessibilityLabel="Send OTP"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>

                {biometricAvailable && biometricEnabled && (
                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometric}
                    accessibilityLabel="Sign in with biometrics"
                  >
                    <Text style={styles.biometricButtonText}>
                      🔑 Sign in with{" "}
                      {Platform.OS === "ios" ? "Face ID / Touch ID" : "Fingerprint"}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>Verify OTP</Text>
                <Text style={styles.cardDescription}>
                  Enter the 6-digit code sent to{" "}
                  <Text style={styles.emailHighlight}>{email}</Text>
                </Text>

                {/* 6-digit OTP input */}
                <View style={styles.otpContainer}>
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(i, v)}
                      onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      accessibilityLabel={`OTP digit ${i + 1}`}
                    />
                  ))}
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={isLoading}
                  accessibilityLabel="Verify OTP"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.resendRow}>
                  <Text style={styles.cardDescription}>Didn&apos;t receive the code? </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (resendCooldown === 0) {
                        handleSendOTP();
                      }
                    }}
                    disabled={resendCooldown > 0}
                    accessibilityLabel="Resend OTP"
                  >
                    <Text
                      style={[
                        styles.resendText,
                        resendCooldown > 0 && styles.resendTextDisabled,
                      ]}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setStep("email");
                    setOtp(["", "", "", "", "", ""]);
                    setError(null);
                  }}
                  accessibilityLabel="Change email"
                >
                  <Text style={styles.changeEmailText}>← Change email</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.accent,
    letterSpacing: 3,
    fontFamily: "Inter-Bold",
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontFamily: "Inter-Regular",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: "Inter-Bold",
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: "Inter-Regular",
  },
  emailHighlight: {
    color: COLORS.accent,
    fontFamily: "Inter-Medium",
  },
  input: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 16,
    fontFamily: "Inter-Regular",
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
  },
  biometricButton: {
    marginTop: 16,
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },
  biometricButtonText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  otpInput: {
    width: 46,
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: "#0F172A",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    fontFamily: "Inter-Bold",
  },
  otpInputFilled: {
    borderColor: COLORS.accent,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginBottom: 12,
    fontFamily: "Inter-Regular",
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  resendText: {
    color: COLORS.accent,
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  resendTextDisabled: {
    color: COLORS.textMuted,
  },
  changeEmailText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
    fontFamily: "Inter-Regular",
  },
});
