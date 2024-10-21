import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native";
import * as Keychain from "react-native-keychain";
import BigLock from "../../../assets/images/icon/bigLock.svg";
import BackSpace from "../../../assets/images/icon/backSpace.svg";
import CustomSelect from "../../../components/Ui/CustomSelect";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MediaFolderManager from "../../../components/MediaFolderManager";
import { InterstitialAd, TestIds } from "react-native-google-mobile-ads";
import { StatusBar } from "expo-status-bar";

const adUnitId1 = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-1358580905548176/1538470693"; // Use your ad unit ID
const adUnitId2 = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-1358580905548176/1538470693"; // Use your ad unit ID

const interstitial1 = InterstitialAd.createForAdRequest(adUnitId1);
const interstitial2 = InterstitialAd.createForAdRequest(adUnitId2);
const securityQuestionsData = [
  {
    label: "What was the name of your first pet?",
    value: "first_pet_name",
  },
  {
    label: "What was the make and model of your first car?",
    value: "first_car_model",
  },
  {
    label: "What was the name of your elementary school?",
    value: "elementary_school_name",
  },
  {
    label: "What was your childhood nickname?",
    value: "childhood_nickname",
  },
  {
    label: "What is your favorite book?",
    value: "favorite_book",
  },
  {
    label: "What is your father's middle name?",
    value: "father_middle_name",
  },
];

// Passcode Input Component
const PasscodeInput = ({ value }) => (
  <View style={styles.passcodeBox}>
    <Text style={styles.passcodeText}>{value ? "*" : ""}</Text>
  </View>
);

const VaultScreen = () => {
  const [passcode, setPasscode] = useState(["", "", "", ""]);
  const [confirmPasscode, setConfirmPasscode] = useState(["", "", "", ""]);
  const [isPasscodeSet, setIsPasscodeSet] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState(
    securityQuestionsData[0]
  );
  const [securityAnswer, setSecurityAnswer] = useState();
  const [modelVisible, setModelVisible] = useState(false);
  const [isSecondTime, SetIsSecondTime] = useState(false);
  const [step, setStep] = useState(1); // 1 = Enter passcode, 2 = Confirm passcode

  useEffect(() => {
    const checkPasscode = async () => {
      const credentials = await Keychain.getGenericPassword();
      const security = await AsyncStorage.getItem("security");
      if (security) {
      }
      if (credentials) {
        SetIsSecondTime(true);
      }
    };
    checkPasscode();
  }, []);

  useEffect(() => {
    interstitial1.load();
    interstitial2.load();
  }, []);
  // Handle number click on custom keypad
  const handleNumberPress = (number) => {
    if (step === 1) {
      const newPasscode = [...passcode];
      const index = newPasscode.findIndex((digit) => digit === "");
      if (index !== -1) {
        newPasscode[index] = number;
        setPasscode(newPasscode);
      }
    } else {
      const newPasscode = [...confirmPasscode];
      const index = newPasscode.findIndex((digit) => digit === "");
      if (index !== -1) {
        newPasscode[index] = number;
        setConfirmPasscode(newPasscode);
      }
    }
  };

  // Handle backspace press
  const handleBackspacePress = () => {
    if (step === 1) {
      const newPasscode = [...passcode];
      const lastFilledIndex = newPasscode.findIndex((digit) => digit === "");

      if (lastFilledIndex === -1) {
        // All boxes are filled, remove the last one
        newPasscode[3] = "";
      } else if (lastFilledIndex > 0) {
        // Remove the last filled box
        newPasscode[lastFilledIndex - 1] = "";
      } else if (lastFilledIndex === 0) {
        // If we are at the first index, clear it
        newPasscode[0] = "";
      }
      setPasscode(newPasscode);
    } else {
      const newPasscode = [...confirmPasscode];
      const lastFilledIndex = newPasscode.findIndex((digit) => digit === "");

      if (lastFilledIndex === -1) {
        // All boxes are filled, remove the last one
        newPasscode[3] = "";
      } else if (lastFilledIndex > 0) {
        // Remove the last filled box
        newPasscode[lastFilledIndex - 1] = "";
      } else if (lastFilledIndex === 0) {
        // If we are at the first index, clear it
        newPasscode[0] = "";
      }
      setConfirmPasscode(newPasscode);
    }
  };

  // Handle Passcode Setup (Automatically triggered when all 4 digits are filled)
  useEffect(() => {
    if (passcode.every((digit) => digit !== "") && step === 1) {
      if (isSecondTime) {
        validatePasscode();
      } else {
        setStep(2);
        setConfirmPasscode(["", "", "", ""]);
      }
    } else if (confirmPasscode.every((digit) => digit !== "") && step === 2) {
      handleSetPasscode();
    }
  }, [passcode, confirmPasscode]);

  const validatePasscode = async () => {
    const credentials = await Keychain.getGenericPassword();
    if (credentials.password === passcode.join("")) {
      Alert.alert("Success", "Access granted to the vault!");
      setPasscode(["", "", "", ""]);
      if(interstitial1.loaded){
        interstitial1.show();
      }
      setIsPasscodeSet(true);
    } else {
      Alert.alert("Error", "Incorrect passcode.");
      setPasscode(["", "", "", ""]);
    }
  };
  const handleSetPasscode = async () => {
    const passcodeStr = passcode.join("");
    const confirmPasscodeStr = confirmPasscode.join("");

    if (passcodeStr === confirmPasscodeStr) {
      const security = await AsyncStorage.getItem("security");
      if(!security){
        setModelVisible(true);
      }
      else{
        const passcodeVal = passcode.join("");
      await Keychain.setGenericPassword("key", passcodeVal);
      if(interstitial1.loaded){
        interstitial1.show();
      }
      setIsPasscodeSet(true);
      }
    } else {
      Alert.alert("Error", "Passcodes do not match.");
      setConfirmPasscode(["", "", "", ""]);
      setStep(2); // Reset to confirmation step
    }
  };

  const handleSecurityQuestionSubmit = async () => {
    if (!securityQuestion || !securityAnswer) {
      Alert.alert("Error", "Please select a question and provide an answer.");
      return;
    }
    if(isSecondTime){
      const security = await AsyncStorage.getItem("security");
      if(security){
        const securityData = JSON.parse(security);
        if(securityData.question.value === securityQuestion.value && securityData.answer === securityAnswer){
          setPasscode(["", "", "", ""]);
          // setIsPasscodeSet(true);
          
          setStep(1);
          SetIsSecondTime(false);
          setModelVisible(false);
          Alert.alert("Success", "Correct security question and answer.!");
        }
        else{
          Alert.alert("Error", "Incorrect security question or answer.");
        }
      }
    }
    else{
      const passcodeVal = passcode.join("");
      await Keychain.setGenericPassword("key", passcodeVal);
      // await Keychain.setGenericPassword(securityQuestion,securityAnswer);
      const securityData = {
        question: securityQuestion,
        answer: securityAnswer,
      };
      await AsyncStorage.setItem("security", JSON.stringify(securityData));
      setModelVisible(false);
      if(interstitial1.loaded){
        interstitial1.show();
      }
      setIsPasscodeSet(true);
    }
  };
  const handleSecurityQuestion = (value) => {
    setSecurityQuestion(value);
  };

  const handleResetPassword = async () => {
    setModelVisible(true);
  }
  // Custom Keypad Component
  const CustomKeypad = () => {
    const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
    return (
      <View style={styles.keypadContainer}>
        <View style={styles.keypadRow}>
          {numbers.slice(0, 3).map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.keypadButton}
              onPress={() => handleNumberPress(num)}
            >
              <Text style={styles.keypadButtonText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {numbers.slice(3, 6).map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.keypadButton}
              onPress={() => handleNumberPress(num)}
            >
              <Text style={styles.keypadButtonText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {numbers.slice(6, 9).map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.keypadButton}
              onPress={() => handleNumberPress(num)}
            >
              <Text style={styles.keypadButtonText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          <View style={styles.keypadInvisibleButton} />
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress("0")}
          >
            <Text style={styles.keypadButtonText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={handleBackspacePress}
          >
            {/* <Text style={styles.keypadButtonText}></Text> */}
            <BackSpace />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
       <StatusBar backgroundColor="#3478F6" />
      {!isPasscodeSet ? (
        <View style={styles.passCodeMainContainer}>
          <BigLock />
          <Text style={styles.title}>PassCode</Text>
          <Text style={styles.desc}>
            {step === 1 ? "Set 4 digit Passcode." : "Confirm Passcode."}
          </Text>
          <View style={styles.passcodeContainer}>
            {(step === 1 ? passcode : confirmPasscode).map((digit, index) => (
              <PasscodeInput key={index} value={digit} />
            ))}
          </View>
          <CustomKeypad />
          <TouchableOpacity
              // style={styles.resetPasscodeButton}
              onPress={handleResetPassword}
            >
              <Text style={styles.resetPasscodeText}>Reset passcode</Text>
            </TouchableOpacity>
        </View>
      ) : (
        <>
          <MediaFolderManager />
        </>
      )}
      <Modal visible={modelVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Security Question</Text>
            <CustomSelect
              onPress={handleSecurityQuestion}
              defaultSelect={"first_pet_name"}
              item={securityQuestionsData}
            />
            <Text style={styles.modalLabel}>Enter Security Answer</Text>
            <TextInput
              placeholder="Your answer"
              style={styles.textInput}
              value={securityAnswer}
              onChangeText={setSecurityAnswer}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSecurityQuestionSubmit}
            >
              <Text style={styles.submitButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default VaultScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  passCodeMainContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3478F6",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
    color: "#fff",
  },
  desc: {
    fontSize: 18,
    marginBottom: 20,
    color: "#fff",
  },
  passcodeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  passcodeBox: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: "#979797",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderRadius: 16,
  },
  passcodeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  keypadContainer: {
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  keypadInvisibleButton: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderRadius: 10,
  },
  keypadButton: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  resetPasscodeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "medium",
    textDecorationLine:"underline"
  },
  submitButton: {
    padding: 15,
    backgroundColor: "#2196F3",
    borderRadius: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  vaultTitle: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 7,
    justifyContent: "center",
    // alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 10,
    width: "100%",
    borderRadius: 5,
    marginBottom: 20,
  },
  submitButton: {
    // padding: 15,
    paddingVertical: 10,
    backgroundColor: "#3478F6",
    borderRadius: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
