//File: services/s3/productImageService.js

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

const uploadProductImage = async (fileBuffer, fileType) => {
  const fileKey = `products/${uuidv4()}.${fileType}`;
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: `image/${fileType}`,
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    // return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    return fileKey; // Return the file key [S3] instead of the full URL
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const generatePresignedUrl = async (fileKey) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 }); // URL expires in 5 minutes
    return url;
  } catch (error) {
    console.error("Error generating pre-signed URL", error);
    throw error;
  }
};

const getProductImage = async (fileKey) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
    };

    const data = await s3Client.send(new GetObjectCommand(params));
    return data.Body;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const deleteProductImage = async (fileKey) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
    };

    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  uploadProductImage,
  getProductImage,
  deleteProductImage,
  generatePresignedUrl
};