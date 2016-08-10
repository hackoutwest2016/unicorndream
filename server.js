var client_id = '8eda2a65a1354cf38f78b9ea91a4011b'; // Your client id
var client_secret = '2080eecb0446471a82109dfe55f0393b'; // Your secret
var redirect_uri = 'http://localhost:8081/callback'; // Your redirect uri

var request = require('request');
var express = require('express');
var cookieParser = require('cookie-parser');
var querystring = require('querystring');
var stateKey = 'spotify_auth_state';
var app = express();
app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.get('/:user/playlist', function (req, res) {
  var options = {
      url: 'https://api.spotify.com/v1/users/' + req.params.user + '/playlists',
      headers: { 'Authorization': 'Bearer ' + req.query.access_token },
      json: true
    };
  request.get(options, function(error, response, body){
    console.log(body);
    var playlists = [];
    var counter = 0;
    for (var i = 0; i < body.items.length; i++){
      if (body.items[i].collaborative){
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
      headers: { 'Authorization': 'Bearer ' + req.query.access_token },
      json: true
    };
    console.log(options.url);
    request.get(options, function(error, response, body){
      // console.log(JSON.stringify(body));
      var tracks = [];
      for(var i = 0; i<body.items.length; i++){
        var track = {trackID: body.items[i].track.id, trackName: body.items[i].track.name, artistName: body.items[i].track.artists[0].name, albumName: body.items[i].track.album.name, albumImage: body.items[i].track.album.images[0].url};
        tracks[i]=track;
      };
      res.end(JSON.stringify({ 'tracks':  tracks}));
   });
})

var voteMap = new Map();
var trackKey;
var trackValue= 0;

app.get('/:user/:playlist/:track', function (req, res) {
    var trackKey = req.params.track;
    if(req.query.vote == 'up'){
      console.log("The song is voted up");
      if(voteMap.get(trackKey) == undefined){ //if track has no votes yet
          trackValue = trackValue+1;
          voteMap.set(trackKey, trackValue);
      } else{
          trackValue=voteMap.get(trackKey) + 1;
          voteMap.set(trackKey, trackValue);
        }
    }else if (req.query.vote == 'down'){
      console.log("The song is voted down");
      if(voteMap.get(trackKey) == undefined){ //if track has no votes yet
          trackValue = trackValue-1;
          voteMap.set(trackKey, trackValue);
      } else{
          trackValue=voteMap.get(trackKey) - 1;
          voteMap.set(trackKey, trackValue);
        }
    }
      console.log("VoteMap consists of" + voteMap);

      if(req.query.vote != null){
        var options = {
          url: 'http://localhost:8081/' + req.params.user + '/' + req.params.playlist + '/tracks?access_token=' + req.query.access_token,
          headers: { 'Authorization': 'Bearer ' + req.query.access_token },
          json: true
        };
        request.get(options, function(error, response, body){
          var songPosition;
          var songTotalVotes;

          for(var i = 0; i<body.tracks.length; i++){
            if(body.tracks[i].trackID == trackKey){
              songPosition = i;
              break;
            }
          }
          songTotalVotes = voteMap.get(trackKey);
          console.log("SongTotalVotes: " + songTotalVotes);
          console.log("SongPosition: " + SongPosition);
          console.log(voteMap);
       for(var j = 0; j<body.tracks.length; j++){
         console.log("votes in current song in the loop and its id " + voteMap.get(body.tracks[j].trackID) +" "+ body.tracks[j].trackID);
        if((voteMap.get(body.tracks[j].trackID) >= songTotalVotes || voteMap.get(body.tracks[j].trackID) != null) && body.tracks[j].trackID != trackKey ){
          console.log("Votes of current song in the loop >= the song we just voted. The id of current song: " + body.tracks[j].trackID);
          console.log("Votes of current tack and its id " + voteMap.get(body.tracks[j].trackID) + " " + body.tracks[j].trackID );
          var insertPosition = j;
          console.log("InsertPosition: " + insertPosition);
          var options = { url: 'https://api.spotify.com/v1/users/' + req.params.user + '/playlists/' + req.params.playlist + '/tracks', method: 'PUT', headers: { 'Authorization': 'Bearer ' + req.query.access_token }, json: {
            'range_start': songPosition,
            'range_length': 1,
            'insert_before': insertPosition
          }};
          request(options, function(error, response, body){
            // console.log("Response" + JSON.stringify(response));
            // console.log("Body " + JSON.stringify(body));
            // console.log("error " + error);
          })
        }
      }
      res.redirect('/' + req.params.user + '/' + req.params.playlist + '/tracks?access_token=' + req.query.access_token );
    });
  } //if-sats

        //  res.send("hejhej")
});

// Login code below stolen from https://github.com/spotify/web-api-auth-examples
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.get('/user', function(req, res) {
  var options = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + req.query.access_token },
    json: true
  };
  request.get(options, function(error, response, body) {
    res.redirect('/' + body.id + '/playlist?' +
    querystring.stringify({
      access_token: req.query.access_token,
      refresh_token: req.query.refresh_token
    }));
  });
})

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-collaborative';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.end(querystring.stringify({
      error: 'state_mismatch'
    }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        res.redirect('/user?' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        console.log("ERROR: " + error)
        console.log(response);
        console.log(body);
        res.end(JSON.stringify(error));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});
