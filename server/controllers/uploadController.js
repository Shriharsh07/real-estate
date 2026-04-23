const cloudinary = require("../config/cloudinary");

exports.uploadImages = async (req, res) => {
  try {
    const files = req.files;

    const uploadPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "properties" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        ).end(file.buffer);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);

    res.json(imageUrls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};  