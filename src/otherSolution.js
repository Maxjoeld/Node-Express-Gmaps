const config = require('./config');
const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');

const PORT = config.port;
const API_KEY = config.gmaps.apiKey;
const server = express();
const STATUS_SUCCESSFUL = 200;
const STATUS_USER_ERROR = 422;
const url = 'https://maps.googleapis.com/maps/api/place';

server.use(bodyParser.json());

server.get('/place', (req, res) => {
  const { placeName } = req.query;

  fetch(`${url}/textsearch/json?query=${placeName}&key=${API_KEY}`)
    .then(res => res.json())
    .then(json => json.results[0].place_id)
    .then(place => {
      fetch(`${url}/details/json?placeid=${place}&key=${API_KEY}`)
        .then(res => res.json())
        .then(json => {
          res.status(STATUS_SUCCESSFUL);
          res.send(json.result);
        })
        .catch(err => {
          res.status(STATUS_USER_ERROR);
          res.send({ error: "Error fetching place details" });
        });
    })
    .catch(err => {
      res.status(STATUS_USER_ERROR);
      res.send({ error: "Error fetching nearby places" });
    });
});



server.get('/places', (req, res) => {
  const { placeNames } = req.query;

  fetch(`${url}/textsearch/json?query=${placeNames}&key=${API_KEY}`)
    .then(res => res.json())
    .then(json => json.results)
    .then(places => {
      const promises = [];

      // Iterating through every place returned and creating new promise then pushing to an array
      places.forEach(place => {
        promises.push(new Promise(resolve => {
          fetch(`${url}/details/json?placeid=${place.place_id}&key=${API_KEY}`)
            .then(res => res.json())
            .then(json => {
              resolve(json.result);
            })
            .catch(err => {
              res.status(STATUS_USER_ERROR);
              res.send({ error: "Error fetching place details" });
            });

        }));
        });

      // Executing every promise in the array and sending the array of resulting data back
      Promise.all(promises)
        .then(data => {
          res.status(STATUS_SUCCESSFUL);
          res.send(data);
        });
      })
    .catch(err => {
      res.status(STATUS_USER_ERROR);
      res.send({ error: "Error fetching nearby places" });
    });
});

server.listen(PORT, (err) => {
  if (err) console.error(err);
  else console.log(`Server is listening on port ${PORT}`);
});
