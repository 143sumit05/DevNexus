
const express = require("express");
const cloudinary = require("../config/cloudinary");
const upload = require("../middlewares/upload");

const uploadRouter = express.Router();

uploadRouter.post("/upload/profile-photo", upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please select a photo"
            });
        }

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "NeXora/profile-photos",
                    resource_type: "image"
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            stream.end(req.file.buffer);
        });

        res.json({
            message: "Photo uploaded successfully",
            photoUrl: result.secure_url
        });

    } catch (err) {
        console.error("Photo upload error:", err);
        res.status(500).json({
            message: "Photo upload failed"
        });
    }
});

module.exports = uploadRouter;
