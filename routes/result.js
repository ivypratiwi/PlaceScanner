const express = require('express');
const jsonfile = require('jsonfile')
const router = express.Router();

//Routing
router.get('/', function (req, res, next) {
    const jsonfile = (req.query.param).trim();
    const jsonpath = `./data/file_api_result/${jsonfile}.json`;

    readJSON(jsonpath)
        .then(rsp => {
            res.render('result', { data: rsp, MAP_API_KEY: process.env.GOOGLE_MAP_API_KEY })
        })
        .catch(e => console.error(e))
})


function readJSON(filepath) {
    return jsonfile.readFile(filepath)
        .then(res => { return res })
        .catch(e => console.error(e))
}


module.exports = router;
