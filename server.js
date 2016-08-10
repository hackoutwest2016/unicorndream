var client_id = '8eda2a65a1354cf38f78b9ea91a4011b'; // Your client id
var client_secret = '2080eecb0446471a82109dfe55f0393b'; // Your secret
var redirect_uri = 'http://localhost:8081/callback'; // Your redirect uri

var request = require('request');
var express = require('express');
var cookieParser = require('cookie-parser');
var querystring = require('querystring');
var stateKey = 'spotify_auth_state';
var localhost = 'http://localhost:8081/';
var app = express();
app.use(express.static(__dirname + '/public'))
   .use(cookieParser());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});


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
    var url = localhost + req.params.user + '/';
    var postfix = '/tracks?access_token=' + req.query.access_token;
    for (var i = 0; i < body.items.length; i++){
      if (body.items[i].collaborative){
        var playlist = { playlistID: body.items[i].id, 
          userID: body.items[i].owner.id, 
          playlistName: body.items[i].name, 
          playlistImage: body.items[i].images[0].url,
          'url': url + body.items[i].id + postfix };
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
      var url = localhost + req.params.user + '/' + req.params.playlist + '/';
      var voteDown = '?vote=down'
      var voteUp = '?vote=up'
      var postfix = '&access_token=' + req.query.access_token;
      for(var i = 0; i<body.items.length; i++){
        var track = { trackID: body.items[i].track.id,
          trackName: body.items[i].track.name,
          artistName: body.items[i].track.artists[0].name,
          albumName: body.items[i].track.album.name,
          albumImage: body.items[i].track.album.images[0].url,
          'voteUp': url + body.items[i].track.id + voteUp + postfix,
          'voteDown': url + body.items[i].track.id + voteDown + postfix };
        tracks[i]=track;
      };
      res.end(JSON.stringify({ 'tracks':  tracks}));
   });
})

var voteMap = new Map();
var trackKey;

app.get('/:user/:playlist/:track', function (req, res) {
    var trackKey = req.params.track;
    var trackValue= voteMap.get(trackKey);

    if(req.query.vote == 'up'){
      console.log("The song is voted up");
      if(trackValue == undefined){ //if track has no votes yet
          trackValue = 1;
          voteMap.set(trackKey, trackValue);
      } else{
          trackValue=voteMap.get(trackKey) + 1;
          voteMap.set(trackKey, trackValue);
        }
    }else if (req.query.vote == 'down'){
      console.log("The song is voted down");
      if(voteMap.get(trackKey) == undefined){ //if track has no votes yet
          trackValue = -1;
          voteMap.set(trackKey, trackValue);
      } else{
          trackValue=voteMap.get(trackKey) - 1;
          voteMap.set(trackKey, trackValue);
        }
    }
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
          console.log("SongPosition: " + songPosition);
          console.log(voteMap);
          var insertPosition = undefined;

          if(songTotalVotes > 0 && voteMap.size==1){ //if only one song is voted
      	     insertPosition=0;
           }else if (songTotalVotes<0 && voteMap.size == 1){
      	      insertPosition = body.tracks.length;
            } else{ //if more than one song is voted

              for(var j = 0; j<body.tracks.length; j++){ //loop through all the songs
                if(songTotalVotes>0){ //if song is voted up
              	  if(songTotalVotes >= voteMap.get(body.tracks[j].trackID) ||      voteMap.get(body.tracks[j].trackID==null)){
               	 	  var insertPosition = j;
                		  insertPosition=j;
                		  break;
              	   }
                }else if (songTotalVotes<=0){
              	 if(songTotalVotes >= voteMap.get(body.tracks[j].trackID)){
              		  insertPosition = j;
              		  break;
                  }
                }
            }
        }
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


        setTimeout(function(){
          res.redirect('/' + req.params.user + '/' + req.params.playlist + '/tracks?access_token=' + req.query.access_token );
        }, 5000);
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
    res.end(JSON.stringify({'body': body.id,
      'access_token': req.query.access_token,
      'url': localhost + body.id + '/playlist?access_token=' + req.query.access_token}));
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
