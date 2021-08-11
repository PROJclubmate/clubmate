const S3     = require('aws-sdk/clients/s3'),
  fs         = require('fs'),
  util       = require('util'),
  unlinkFile = util.promisify(fs.unlink),
  path       = require('path'),
  multer     = require('multer'),
  sharp      = require('sharp');
  // ImageKit   = require("imagekit");

// Multer config
const storage = multer.diskStorage({
  destination: './tmp_uploads/',
  filename: function(req, file, cb){
    cb(null, Date.now()+'_'+file.originalname);
  }
});
const fileFilter = function (req, file, cb){
  const filetypes = /jpg|jpeg|png|gif|bmp|webp/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  if(!(mimetype && extname)){
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
}
const limits = {
  // files: 1,
  fileSize: 10*1024*1024,
};
const upload = multer({storage, fileFilter, limits});

// AWS config
const s3 = new S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION
});
async function uploadFile(file, folder, size){
  let fileNameWithoutExt = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
  let fileName = fileNameWithoutExt.length > 20 ? fileNameWithoutExt.slice(fileNameWithoutExt.length - 20) : fileNameWithoutExt;
  const {data, info} = await sharp(file.path)
  .resize(size, size, {fit: 'inside'})
  .webp()
  .toBuffer({resolveWithObject: true});
  let format = info.format == 'jpeg' ? 'jpg' : info.format;
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Body: data,
    Key: folder+Date.now()+'_'+fileName+'.'+format,
    ContentType: 'image/'+format,
    ContentLength: info.size
  }
  return s3.upload(uploadParams).promise();
}
async function clubStoriesUpload(file){
  const uri = file.split(';base64,').pop();
  let imgBuffer = Buffer.from(uri, 'base64');
  const {data, info} = await sharp(imgBuffer)
  .resize(1080, 1080, {fit: 'inside'})
  .toBuffer({resolveWithObject: true});
  let format = info.format;
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Body: data,
    Key: 'clubStories/'+Date.now()+'.'+format,
    ContentType: 'image/'+format,
    ContentLength: info.size
  }
  return s3.upload(uploadParams).promise();
}
function removeTmpUpload(filePath){
  return unlinkFile(filePath);
}
function deleteFile(fileKey){
  const deleteParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey
  }
  return s3.deleteObject(deleteParams).promise();
}
// function deleteFiles(fileKeysArr){
//   let objects = [];
//   for(let i in fileKeysArr){
//     objects.push({Key : fileKeysArr[i]});
//   }
//   const deleteParams = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Delete: {
//       Objects: objects
//     }
//   }
//   return s3.deleteObjects(deleteParams).promise();
// }

// Imagekit.io config
// const imagekit = new ImageKit({
//   publicKey : process.env.IK_PUBLIC_KEY,
//   privateKey : process.env.IK_PRIVATE_KEY,
//   urlEndpoint : process.env.IK_URL_ENDPOINT
// });
// const thumb_100_obj = {'height' : '100', 'width' : '100', 'quality': '90', 'effectSharpen': '-', 'crop': 'maintain_ratio', 'format' : 'webp'};
// const thumb_200_obj = {'height' : '200', 'width' : '200', 'quality': '90', 'effectSharpen': '-', 'crop': 'maintain_ratio', 'format' : 'webp'};
const ik_UrlEndpoint = process.env.IK_URL_ENDPOINT;
const thumb_100_prefix = ik_UrlEndpoint+'tr:h-100,w-100,q-90,e-sharpen,c-maintain_ratio,f-webp/';
const thumb_200_prefix = ik_UrlEndpoint+'tr:h-200,w-200,q-90,e-sharpen,c-maintain_ratio,f-webp/';

module.exports = {upload, uploadFile, clubStoriesUpload, removeTmpUpload, deleteFile,
  thumb_100_prefix, thumb_200_prefix};