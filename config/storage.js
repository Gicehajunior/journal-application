const multer = require("multer");
const config = require('@config/config');

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, config.PATHS.PUBLIC);
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + "-" + file.originalname);
//     }
// });

const upload = multer();

module.exports = {upload};
