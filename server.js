var client_id = '8eda2a65a1354cf38f78b9ea91a4011b'; // Your client id
var client_secret = '2080eecb0446471a82109dfe55f0393b'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var request = require('request');
var express = require('express');
var app = express();
var fs = require("fs");
var spotifyuser = 'blze'; // TODO Remove, should be passed from front end.
var access_token = 'BQCEHJrI5j0mezGFGF2Y6KmtH5pnF2q27C2tIC3UKBjVkeGopW3isndi1rHtyxe8dlhOQRLn7r4iaykHB2D9NdYE-DwYbDf9OgH0iooM-ivKUhXIvTqFfmwc77dn75-p71rhQHfzJubaL4S-JoX85VNPQMBnaWwpntdA_B-L1uyDkUK1i9Ycv42u-cQWt6KG1NgSIORSAbM7SV0IlOrwklVRqs6QW3SoNjQMZ2cNFUqdL4MmvssP6mA';  // TODO Remove, should be passed from front end.

app.get('/playlist', function (req, res) {
  var options = {
      url: 'https://api.spotify.com/v1/users/' + spotifyuser + '/playlists',
      headers: { 'Authorization': 'Bearer ' + access_token },
      json: true
    };
  request.get(options, function(error, response, body){
    console.log(body);
    var playlists = [];
    var counter = 0;
    for(var i = 0; i<body.items.length; i++){
      if(body.items[i].collaborative){
        var playlist = {playlistID: body.items[i].id, userID: body.items[i].owner.id, playlistName: body.items[i].name, playlistImage: body.items[i].images[0].url};
        playlists[counter]=playlist;
        counter++;
      }
    };
    res.end(JSON.stringify({ 'playlists':  playlists}));
  });
})

var server = app.listen(8081, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
})

app.get('/:user/:playlist/tracks', function (req, res) {
   var options = {
      url: 'https://api.spotify.com/v1/users/' + req.params.user + '/playlists/' + req.params.playlist + '/tracks',
      headers: { 'Authorization': 'Bearer ' + access_token },
      json: true
    };
    console.log(options.url);
    request.get(options, function(error, response, body){
      console.log(JSON.stringify(body));
      var tracks = [];
      for(var i = 0; i<body.items.length; i++){
        var track = {trackID: body.items[i].track.id, trackName: body.items[i].track.name, artistName: body.items[i].track.artists[0].name, albumName: body.items[i].track.album.name, albumImage: body.items[i].track.album.images[0].url};
        tracks[i]=track;
      };
      res.end(JSON.stringify(tracks));
   });
})

app.get('/:user/:playlist/:track', function (req, res) {
  res.end("HEJEHEJ");
})
