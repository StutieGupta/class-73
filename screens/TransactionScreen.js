import React, { Component } from "react";
import db from "../config";
import firebase from "firebase";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  ToastAndroid,
} from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";

export default class TransactionScreen extends Component {
  constructor() {
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedData: "",
      buttonState: "normal",
      scannedstudentId: "",
      scannedbookId: "",
      tMessage: "",
    };
  }

  getCameraPermissions = async (id) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      hasCameraPermissions: status === "granted",
      buttonState: id,
      scanned: false,
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    const { buttonState } = this.state;
    if (buttonState == "BookId") {
      this.setState({
        scanned: true,
        scannedbookId: data,
        buttonState: "normal",
      });
    } else if (buttonState == "StudentId") {
      this.setState({
        scanned: true,
        scannedstudentId: data,
        buttonState: "normal",
      });
    }
  };

  handleTransaction = async() => {
    var transactionType = await this.checkbookEligibility() //isue,return,false
    console.log("transactiontype", transactionType)
    if(!transactionType){
      Alert.alert("the book doesnt exist in the library")
      this.setState({
        scannedbookId: '' ,
        scannedstudentId: ''
      })
    }
    else if(transactionType==="issue"){
      var isStudentIEligible = await this.checkStudentEligibilityForBookIssue() //false/true/false
      if(isStudentIEligible){
        this.initiateBookIssue()
        Alert.alert("Book issued to the student")
      }
    }
    else{
      var isStudentREligible =await  this.checkStudentEligibilityForBookReturn()//true, false
      if(isStudentREligible){
        this.initiateBookReturn()
        Alert.alert("Book returned to the library");
      }
    }
  };

  checkbookEligibility=async()=>{
    const bookRef =await db.collection("books").where("bookId","==",this.state.scannedbookId).get();
    var transactionType="";
    if(bookRef.docs.length===0){
      transactionType =false;

    }
    else{
      bookRef.docs.map((doc)=>{
        var book = doc.data();
        if(book.bookAvailability){
          transactionType = "issue"
        }
        else{
          transactionType = "return"
        }
      })
    }
    return transactionType;
  }

  checkStudentEligibilityForBookIssue=async()=>{
  const studentRef = await db.collection("students").where("studentId","===",this.state.scannedstudentId).get();
 var isStudentIEligible="";
 if(studentRef.docs.length==0){
   isStudentIEligible = false;
   Alert.alert("student doesnt exists in the database");
   this.setState({
    scannedbookId: '' ,
    scannedstudentId: ''
  })
 }else{
   studentRef.docs.map((doc)=>{
     var student = doc.data()
     if(student.numberOfBooksIssued<2){
       isStudentIEligible = true;
     }
     else{
       isStudentIEligible = false;
       Alert.alert("The student has already issued 2 books ");
       this.setState({
        scannedbookId: '' ,
        scannedstudentId: ''
      })
     }
   })
 }
 return isStudentIEligible;
}

 checkStudentEligibilityForBookReturn = async () => {
   const transactionRef = await db.collection("transaction").where("bookId", "===", this.state.scannedbookId).get()
   var isStudentREligible = ''
   transactionRef.docs.map ((doc )=> {
     var lastBookTransaction = doc.data()
     if(lastBookTransaction.studentId === this.state.scannedstudentId){
       isStudentREligible = true;
     }
     else{
       isStudentREligible = false;
       Alert.alert ("the book wasnt issued by the student");
       this.setState({
         scannedbookId: '',
         scannedstudentId: ''
       })
     }

   } )

   return isStudentREligible;
   
 }
 
  initiateBookIssue = async () => {
    db.collection("transactions").add({
      studentId: this.state.scannedstudentId,
      bookId: this.state.scannedbookId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: Issue,
    });
    db.collection("books").doc(this.state.scannedbookId).update({
      bookAvailability: false,
    });
    db.collection("students")
      .doc(this.state.scannedstudentId)
      .update({
        numberOfBooksIssued: firebase.firestore.FieldValue.increment(1),
      });
    Alert.alert("Book Issued");
    this.setState({
      scannedbookId: '' ,
      scannedstudentId: ''
    })
  };

  initiateBookReturn = async () => {
    db.collection("transactions").add({
      studentId: this.state.scannedstudentId,
      bookId: this.state.scannedbookId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transactionType: Return,
    });
    db.collection("books").doc(this.state.scannedbookId).update({
      bookAvailability: true,
    });
    db.collection("students")
      .doc(this.state.scannedstudentId)
      .update({
        numberOfBooksIssued: firesbase.firestore.FieldValue.increment(-1),
      });
    Alert.alert("Book Returned");
    this.setState({
      scannedbookId: '',
      scannedstudentId: ''
    })
  };

  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if (buttonState !== "normal" && hasCameraPermissions) {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
        />
      );
    } else if (buttonState === "normal") {
      return (
        <KeyboardAvoidingView style={styles.container} behavior= "padding"> 
          <Image
            style={{ height: 200, width: 200 }}
            source={require("../assets/booklogo.jpg")}
          />

          <View style={styles.inputView}>
            <TextInput
              style={styles.inputBox}
              placeholder="bookId"
              value={this.state.scannedbookId}
              onChangeText={(text) => {
                this.setState({
                  scannedbookId: text,
                });
              }}
            />

            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                this.getCameraPermissions("BookId");
              }}
            >
              <Text style={styles.buttonText}>scan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.container}>
            <View style={styles.inputView}>
              <TextInput
                style={styles.inputBox}
                placeholder="studentId"
                value={this.state.scannedstudentId}
                onChangeText={(text) => {
                  this.setState({
                    scannedstudentId: text,
                  });
                }}
              />

              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => {
                  this.getCameraPermissions("StudentId");
                }}
              >
                <Text style={styles.buttonText}>scan</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => this.handleTransaction()}>
            <Text> Submit</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      );
    }
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  displayText: {
    fontSize: 15,
    textDecorationLine: "underline",
  },
  scanButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    margin: 10,
  },
  buttonText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
  },
  inputView: {
    flexDirection: "row",
    margin: 20,
  },
  inputBox: {
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20,
  },
  scanButton: {
    backgroundColor: "#66BB6A",
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0,
  },
});
