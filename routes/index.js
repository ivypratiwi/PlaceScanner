const express = require('express');
const multer = require('multer');
const axios = require('axios');
const vision = require('@google-cloud/vision');
const fs = require('fs')
const nodeGeocoder = require('node-geocoder');
const htmlentities = require('html-entities').AllHtmlEntities;
const jsonfile = require('jsonfile');
const router = express.Router();


/* Multer Configuration*/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './data/file_upload');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
    cb(null, true);
  } else {
    req.fileValidationError = 'Please upload an image in JPEG or PNG type.';
    cb(null, false), new Error('Please upload an image in JPEG or PNG type.');
  }
}
const upload = multer({ storage: storage, fileFilter: fileFilter });

/*Geocode configuration*/
const options = {
  provider: 'openstreetmap',
  language: 'en'
};
const geoCoder = nodeGeocoder(options);




/*Routing*/

router.get('/', function (req, res, next) {
  res.render('index')
})

router.post('/', upload.single('uploadImage'), async function (req, res, next) {
  try {
    if (req.fileValidationError) {
      return res.status(400).render('index', { status: req.fileValidationError });
    }
    const filepath = req.file.path
    const filename = req.file.filename
    const landmarks = await getVisionResult(filepath);
    const path = `./data/file_api_result/${landmarks.description}.json`
    await preprocessResult(landmarks, res, path);

    //Continue to fetch other APIs when Vision returns landmark and no JSON file exist.
    if (!res.headersSent) {
      const processedData = {
        longitude: landmarks.locations[0].latLng.longitude,
        latitude: landmarks.locations[0].latLng.latitude,
        landmarkdescription: landmarks.description,
        photopath: `/file_upload/${filename}`
      };
      const geocode = await getGeoCode(processedData);
      const youtubedata = await getYoutubeVideo(processedData, geocode);
      const result = { ...processedData, ...geocode, ...youtubedata };
      const jsonfilepath = `./data/file_api_result/${result.landmarkdescription}.json`
      await writeJSONFile(jsonfilepath, result, res);
      return res.redirect(`/result/?param=${result.landmarkdescription}`)
    }
  } catch (e) {
    return res.status(500).render('index', { status: 'There is an issue while fetching data. Please try again.' });
  }
});






/*All Functions*/
async function preprocessResult(landmarks, res, path) {
  try {
    //No landmark detected
    if (landmarks.length === 0) {
      res.render('index', { status: `Please upload a landmark photo` })
      Promise.break;
    }
    //File already exist in the filepath
    if (fs.existsSync(path)) {
      res.redirect(`/result/?param=${landmarks.description}`);
      Promise.break;
    }
  } catch (err) {
    return res.status(500).render('index', { status: 'There is an issue while fetching data. Please try again.' });
  }
}

async function getVisionResult(filepath) {
  try {
    const client = new vision.ImageAnnotatorClient();
    const [result] = await client.landmarkDetection(filepath);
    const landmarks = await result.landmarkAnnotations;
    //take the largest confidence score if result more than 1.
    if (landmarks.length !== 0) {
      const final_landmark = await landmarks.sort((a, b) => b.score - a.score)[0];
      return final_landmark;
    }
    else {
      return landmarks
    }
  }
  catch (e) {
    console.log(e);
  }
}

function getYoutubeVideo(processedData, rsp) {
  const { landmarkdescription } = processedData;
  const { country } = rsp.geocode;
  const youtube = {
    api_key: process.env.YOUTUBE_API_KEY,
    part: 'snippet',
    maxResults: '1',
    qparam: `${landmarkdescription}%20${country}`,
    type: 'video',
    embed: 'true',
    definition: 'high'
  };
  const options = {
    hostname: 'www.googleapis.com',
    path: `/youtube/v3/search?part=${youtube.part}&maxResults=${youtube.maxResults}&q=${youtube.qparam}&type=${youtube.type}&videoEmbeddable=${youtube.embed}&videoDefinition=${youtube.definition}&key=${youtube.api_key}`,
    method: 'GET'
  };
  const urlplace = `https://${options.hostname}${options.path}`
  return axios.get(urlplace)
    .then(result => {
      const data = result.data.items[0];
      //Retun a dictionary and changing the title from HTML entities to text.
      return ({
        youtubedata: {
          url: `https://www.youtube.com/embed/${data.id.videoId}`,
          title: htmlentities.decode(data.snippet.title),
          error: false
        }
      });
    }).catch(e => {
      return ({ youtubedata: { error: true } })
    })
}

function writeJSONFile(file, obj, res) {
  return jsonfile.writeFile(file, obj)
    .catch(e => {
      res.status(500).render('index', { status: 'There is an issue with our server. Please try again later' })
    })

}

async function getGeoCode(result) {
  try {
    const { longitude } = result;
    const { latitude } = result;
    const rsp = await (geoCoder.reverse({ lat: latitude, lon: longitude }));
    const data = rsp[0];
    const geocodedata = ({
      geocode: {
        country: data.country,
        city: data.city,
        state: data.state,
        address: data.formattedAddress,
        error: false
      }
    });
    return geocodedata;
  }
  catch (err) {
    return ({ geocode: { error: true } })
  }
}

module.exports = router;
