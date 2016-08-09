
var client_id = '8eda2a65a1354cf38f78b9ea91a4011b'; // Your client id
var client_secret = '2080eecb0446471a82109dfe55f0393b'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var request = require('request');
var express = require('express');
var app = express();
var fs = require("fs");
var spotifyuser = 'blze'
var access_token = 'BQBsp_zZIOWPLJsv4g2OAPJGwMsOeoxlf3qzGUhqmmeoVJjWhGrTvYSR4KrQSabjxAIQ08kNECQOCikeeUSxB4C2tU4psG34mVKPIAyTVJjOCdHyC14ql8tp9uGubLGk_BCy93FbjvvA1NYMGV6JJcaVIqPNkN-EEKj15CAoFh9EWv9iLlT6kvphOjBJz4xIbFcR-YSSH2NYtGs1aVmgbv3vdrQ7Gxu5f4HWsyjGeCGxWOXYxq0BUVo'

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
        var playlist = {playlistID: body.items[i].id, userID: body.items[i].owner.id, playlistName: body.items[i].name};
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

app.get('/playlist/tracks', function (req, res) {
   var user_id = req.query.userID;
   var playlist_id = req.query.playlistID;
   var options = {
          url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists/' + playlist_id + '/tracks',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };
        console.log(options.url);
   request.get(options, function(error, response, body){
     console.log(JSON.stringify(body));
     var tracks = [];
     for(var i = 0; i<body.items.length; i++){
       var track = {trackID: body.items[i].track.id, trackName: body.items[i].track.name, artistName: body.items[i].track.artists[0].name};
       tracks[i]=track;
     };
     res.end(JSON.stringify(tracks));
   });
})
