import * as functions from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

initializeApp();

const firestore = new Firestore();

export const createUser = functions.identity.beforeUserCreated(
  {region: "us-west1"}, (UserRecord) => {
    const userInfo= {
      uid: UserRecord.data.uid,
      email: UserRecord.data.email,
      photoUrl: UserRecord.data.photoURL,
    };

    // Store in collections "users", in the document with the user's UID,
    // and use all of 'userInfo' data to store
    firestore.collection("users").doc(UserRecord.data.uid).set(userInfo);
    logger.info(`User Created: ${JSON.stringify(userInfo)}`);
    return;
  });
