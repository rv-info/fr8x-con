// FR8X-CON Mobile — Login Screen
// Supports Account Password Authentication (primary) & Email OTP with Biometric fallback.

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

type AuthMode = "password" | "otp";
type OTPStep = "email" | "otp";

export default function LoginScreen() {
  const {
    signInWithPassword,
    sendOTP,
    verifyOTP,
    biometricAvailable,
    biometricEnabled,
    authenticateWithBiometrics,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>("password");
  const [otpStep, setOtpStep] = useState<OTPStep>("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handlePasswordSignIn = useCallback(async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid company email address");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }
    setIsLoading(true);
    setError(null);

    const result = await signInWithPassword(email.trim().toLowerCase(), password.trim());
    setIsLoading(false);
    if (!result.success) {
      setError(result.error ?? "Invalid email or password");
    }
  }, [email, password, signInWithPassword]);

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
      setOtpStep("otp");
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
  }, [otp, email, verifyOTP]);

  const handleBiometric = useCallback(async () => {
    const success = await authenticateWithBiometrics();
    if (!success) {
      Alert.alert("Biometric authentication failed", "Please sign in with your password or OTP.");
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

          {/* Mode Switcher Tabs */}
          <View style={styles.modeTabsContainer}>
            <TouchableOpacity
              style={[styles.modeTab, mode === "password" && styles.modeTabActive]}
              onPress={() => {
                setMode("password");
                setError(null);
              }}
            >
              <Text style={[styles.modeTabText, mode === "password" && styles.modeTabTextActive]}>
                Password Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === "otp" && styles.modeTabActive]}
              onPress={() => {
                setMode("otp");
                setOtpStep("email");
                setError(null);
              }}
            >
              <Text style={[styles.modeTabText, mode === "otp" && styles.modeTabTextActive]}>
                OTP Sign In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {mode === "password" ? (
              <>
                <Text style={styles.cardTitle}>Account Login</Text>
                <Text style={styles.cardDescription}>
                  Enter your official corporate email and account password
                </Text>

                <Text style={styles.fieldLabel}>Business Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@company.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  accessibilityLabel="Email address"
                />

                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handlePasswordSignIn}
                    accessibilityLabel="Password"
                  />
                  <TouchableOpacity
                    style={styles.showHideButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.showHideText}>{showPassword ? "Hide" : "Show"}</Text>
                  </TouchableOpacity>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handlePasswordSignIn}
                  disabled={isLoading}
                  accessibilityLabel="Sign in with Password"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Sign In with Password</Text>
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
            ) : otpStep === "email" ? (
              <>
                <Text style={styles.cardTitle}>One-Time Password Login</Text>
                <Text style={styles.cardDescription}>
                  Enter your company email to receive a 6-digit OTP
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="name@company.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="send"
                  onSubmitEditing={handleSendOTP}
                  accessibilityLabel="Email address for OTP"
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
                    <Text style={styles.primaryButtonText}>Send OTP Code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>Verify OTP</Text>
                <Text style={styles.cardDescription}>
                  Enter the 6-digit code sent to{" "}
                  <Text style={styles.emailHighlight}>{email}</Text>
                </Text>

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
                      if (resendCooldown === 0) handleSendOTP();
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
                    setOtpStep("email");
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
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.accent,
    letterSpacing: 3,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  modeTabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: COLORS.accent,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  modeTabTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "100%",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 18,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  emailHighlight: {
    color: COLORS.accent,
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
  },
  passwordContainer: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 60,
  },
  showHideButton: {
    position: "absolute",
    right: 14,
    top: 14,
  },
  showHideText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "600",
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
  },
  otpInputFilled: {
    borderColor: COLORS.accent,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginBottom: 12,
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
  },
  resendTextDisabled: {
    color: COLORS.textMuted,
  },
  changeEmailText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
  },
});
