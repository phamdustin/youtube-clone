"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const storage_1 = require("./storage");
// Create the local directories for videos
(0, storage_1.setupDirectories)();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.post('/process-video', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('Invalid message payload received.');
        }
    }
    catch (error) {
        console.error(error);
        res.status(400).send('Bad request: missing filename.');
        return;
    }
    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;
    yield (0, storage_1.downloadRawVideo)(inputFileName);
    try {
        yield (0, storage_1.convertVideo)(inputFileName, outputFileName);
    }
    catch (error) {
        yield Promise.all([
            (0, storage_1.deleteRawVideo)(inputFileName),
            (0, storage_1.deleteProcessedVideo)(outputFileName)
        ]);
        res.status(500).send('Internal Server Error: video processing failed.');
        return;
    }
    // Upload the processed video to Cloud Storage
    yield (0, storage_1.uploadProcessedVideo)(outputFileName);
    yield Promise.all([
        (0, storage_1.deleteRawVideo)(inputFileName),
        (0, storage_1.deleteProcessedVideo)(outputFileName)
    ]);
    res.status(200).send('Processing finished successfully');
    return;
}));
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
