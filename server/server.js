const express = require('express');
//this is the port, on which the server will be hosted. E.g. http://localhost:3000/
const port = 3000;
var router = express.Router();
//Cors is a Cross-Origin Resource Sharing. Do not delte it, as the browser will block the connection to the server
var cors = require('cors')

let sentiment = require('./Sentiment');

const app = express();

app.use(cors())

app.get('/sentimentData', function(req, res){
    let result;
    sentiment.getCoinScore(req.query.name)
    .then(response => {
        res.status(200).send((response).toString());
    }, function(reason){
        console.log('error');
    });
})

app.listen(port, function () {
    console.log("Server is running on "+ port +" port");
});
