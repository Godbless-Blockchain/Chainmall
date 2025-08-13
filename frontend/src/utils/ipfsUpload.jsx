import axios from "axios";

const PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
// In a Vite project, environment variables are exposed on `import.meta.env` and must be prefixed with VITE_
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

export async function uploadFileToIPFS(file) {
  // Add a check to ensure the JWT is available.
  if (!PINATA_JWT) {
    const errorMessage = "Pinata JWT not found. Please ensure VITE_PINATA_JWT is set in your .env file and that you have restarted your development server.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(PINATA_URL, formData, {
      maxBodyLength: "Infinity", // prevent axios from trimming files
      headers: {
        // Axios will automatically set the Content-Type to multipart/form-data
        // when you pass a FormData object. Manually setting it can cause issues.
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    const cid = response.data.IpfsHash; // Pinata returns IpfsHash as CID
    return {
      cid,
      url: `https://gateway.pinata.cloud/ipfs/${cid}`,
    };
  } catch (error) {
    console.error("Error uploading to Pinata IPFS:", error);
    // Make the re-thrown error more specific for easier debugging
    if (error.response && error.response.status === 401) {
      throw new Error("Pinata authentication failed. Please check that your VITE_PINATA_JWT is correct.");
    }
    throw new Error("Failed to upload image to IPFS. Please check the console for details.");
  }
}
