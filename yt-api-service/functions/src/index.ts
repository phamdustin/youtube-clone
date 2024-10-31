import * as functions from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {Storage} from "@google-cloud/storage";
import {onCall} from "firebase-functions/v2/https";

initializeApp();

const firestore = new Firestore();
const storage = new Storage();

const rawVideoBucketName = "dp-yt-raw-videos";

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

export const generateUploadUrl = onCall({maxInstances: 1,
  region: "us-west1"}, async (request) => {
  // check if the user is authenticated
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be acalled while authenticated"
    );
  }
  const auth = request.auth;
  const data = request.data;
  const bucket = storage.bucket(rawVideoBucketName);

  // Generate a unique filename
  // uses the uid with the time
  const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;

  // Get a v4 signed URL for uploading file
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
    // 15 minutes for the user to upload
  });

  return {url, fileName};
});


const videoCollectionId = "videos";

export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: "processing" | "processed",
  title?: string,
  description?: string
}

export const getVideos = onCall({maxInstances: 1,
  region: "us-west1"}, async () => {
  const querySnapshot =
    await firestore.collection(videoCollectionId).limit(10).get();
  return querySnapshot.docs.map((doc) => doc.data());
});
