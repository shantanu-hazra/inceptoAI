import dotenv from "dotenv";
import { Upload } from "./cloudOperations.js";

dotenv.config();

async function handleUpload(file_name, dataObject) {
  try {
    const jsonString = JSON.stringify(dataObject, null, 2);
    const fileBuffer = Buffer.from(jsonString, "utf-8");

    const downloadUrl = await Upload(fileBuffer, file_name)
      .then((url) => ({ url }))
      .catch((error) => {
        console.error("Upload Error:", error);
        return { error };
      });

    return downloadUrl;
  } catch (err) {
    console.error("Data Conversion Error:", err);
    return { error: err };
  }
}

export { handleUpload };
