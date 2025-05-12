import cloudinary from "./cloudConfig.js";
import { Readable } from "stream";

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

async function Upload(fileBuffer, pathname) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: pathname.replace(".json", ""), // Don't include extension in public_id
        format: "json",
        folder: "inceptoResults", // Make sure no default folder is used
      },
      (error, result) => {
        if (error) {
          console.error("Upload failed:", error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    bufferToStream(fileBuffer).pipe(uploadStream);
  });
}

export { Upload };
