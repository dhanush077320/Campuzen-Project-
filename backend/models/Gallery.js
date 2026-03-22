const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileData: {
        type: String, // Base64 encoding of the file
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Gallery', GallerySchema);
