import express from 'express';

import { 
  uploadProcessedVideo,
  downloadRawVideo,
  deleteRawVideo,
  deleteProcessedVideo,
  convertVideo,
  setupDirectories
} from './storage';
import { ALL } from 'dns';

// Create the local directories for videos
setupDirectories();

const app = express();
app.use(express.json());

app.post('/process-video', async (req, res) => {

  let data

  try {
    const message = Buffer.from(req.body.message.data, 'base64').toString('utf8')
    data = JSON.parse(message);
    if (!data.name) {
      throw new Error('Invalid message payload received.');
    } 
    }catch (error) {
      console.error(error)
      res.status(400).send('Bad request: missing filename.')
      return      
  }
  
  const inputFileName = data.name;
  const outputFileName = `processed-${inputFileName}`


  await downloadRawVideo(inputFileName);

  try {
    await convertVideo(inputFileName, outputFileName)
  } catch (error) {
    await Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(outputFileName)      
    ]);
    res.status(500).send('Internal Server Error: video processing failed.')
    return
  
  }
  // Upload the processed video to Cloud Storage
  await uploadProcessedVideo(outputFileName);

  await Promise.all([
    deleteRawVideo(inputFileName),
    deleteProcessedVideo(outputFileName)
  ]);
  res.status(200).send('Processing finished successfully');
  return 
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




