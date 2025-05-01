const { PinataSDK } = require("pinata");
const path = require('path')
const fs = require('fs')
const { File } = require('formdata-node');

require('dotenv').config()

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: "example-gateway.mypinata.cloud",
});
if (!process.env.PINATA_JWT) {
    throw new Error("PINATA_JWT is not defined in environment variables.");
  }

async function storeImages(imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath)
    const files = fs.readdirSync(fullImagesPath)
    const responses = [];
    for(fileIndex in files) {
        const fileBuffer = fs.readFileSync(`${fullImagesPath}/${files[fileIndex]}`)
        const file = new File([fileBuffer], files[fileIndex]);
        try {
            const uploadResponse = await pinata.upload.public.file(file)
            
            responses.push(uploadResponse)
            // Upload to Pinata
        } catch (e) {
            console.log(e)
        }
        console.log(responses);
    }
    return {responses, files};
}

async function storeTokenUriMetadata(metadata) {
    let response;
    try {
        response = await pinata.upload.public.json(metadata)
        console.log(response)
    } catch (e){
        console.log(e, "Error on metadata")
    }
    return response;
}

// async function uploadTextFile() {
//     const file = new File(["hello"], "Testing.txt", { type: "text/plain" });
//     const upload = await pinata.upload.public.file(file);
//     console.log(upload);
//   }
  
// storeTokenUriMetadata({
//     name: "",
//     description: "",
//     image: "",
//     attributes: [
//       {
//         trait_type: "cuteness",
//         value: 100
//       }
//     ]
//   }).then(responses => {
//     console.log("All uploads completed:", responses);
// })
module.exports = { storeImages, storeTokenUriMetadata }