//app.js

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var express = require('express');
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io')(serv,{});

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

//serv.listen(2000);
serv.listen(process.env.PORT || 2000);

console.log("Server started.");

var socketList = {};
var playerList = {};
var roomList = {};

var playerCount = 0;
var updateCount = 0; 

//Player..
Player = function (id, username){
	
	var plyr  = {
		
		id:id,
		username:username,
		roomid : '',
		strikeCount : 0,
		winCount : 0,
		gamePoints : 0,
		isReady:false,
		isInsideRoom : false,
		isPlaying : false,
		isPlayingOnePlayer : false,
		isRequestingRematch : false,
		plyrIndex : -1,
		grid : [],
		fleet  : []
	
	}

	plyr.score = function () {
		
		plyr.gamePoints += 1;
	}

	plyr.resetData = function () {
		//..
	}

	return plyr;

}

//Rooms..
GameRoom = function ( id, isTimed=false ) {
	
	var rm = {

		id : id,
		prepLimit : 15,
		turnLimit : 10,
		turn : 0,
		counter : 0,
		isWinner : '',
		playerIDs : [],
		playerCount : 0,
		clickedPost : -1,
		isHit : false,
		isTimed : isTimed,
		isGameOn : false,
		timer : null

	}

	rm.startPrepTimer = function () {

		rm.counter = 0;
		rm.timer.setInterval(() => {
		
			if ( rm.counter >= rm.prepLimit ) {
				clearInterval ( rm.timer );
			}
			counter++;

		},1000);

	}

	rm.startBlitzTimer = function () {

		rm.counter = 0;
		rm.timer.setInterval(() => {
		
			if ( rm.counter >= rm.turnLimit ) {
				clearInterval ( rm.timer );
			}
			counter++;

		},1000);

	}
	
	rm.stopTimer = function () {
		
		clearInterval( rm.timer );

		rm.counter = 0;
	}
	
	rm.startPreparations = function () {
		//..
		if ( rm.isTimed ) rm.startPrepTimer();
		
	}

	rm.startGame  = function () {
		//..
		rm.isGameOn = true;

		//if ( rm.isTimed ) rm.startBlitzTimer();
	}

	rm.endGame = function () {
		//..
	}

	rm.stopGame = function () {
		//..
		rm.isGameOn = false;
	}

	rm.resetGame = function () {
		//..
	}

	rm.switchTurn = function () {

		rm.turn = rm.turn == 0 ? 1 : 0;

	}

	return rm;
	
}

io.on('connection', function(socket){
	
	socketList[socket.id] = socket;
	
	socket.on("initUser", function (data) {
		
		var newPlayer = Player ( socket.id, data );

		playerList [ socket.id ] = newPlayer;

		console.log ( '\n --> ' + newPlayer.username  + ' has entered the game.' );
		
	});
	
	socket.on("enterGame", function (data) {
	
		if ( data.isSinglePlayer ) {

			var newRoom = GameRoom ( socket.id, data );
				
			newRoom.playerIDs.push ( socket.id )

			roomList [ socket.id ] = newRoom;

			var player = playerList [ socket.id ];

			player.roomid = socket.id;

			var data = {
			
				'isSinglePlayer' : true,
				'players' : {
					'self' : player.username,
				}
	
			};

			socket.emit ('initGame', data );


		}else {
	
			var availableRoom = getAvailableRoom();

			console.log ('\n --> avail room',  availableRoom );

			if ( availableRoom == null ) {

				var newRoom = GameRoom ( socket.id, data );
				
				newRoom.playerIDs.push ( socket.id );

				newRoom.playerCount += 1;

				roomList [ socket.id ] = newRoom;

				var player = playerList [ socket.id ];

				player.roomid = socket.id;

				
				socket.emit ('waitingGame', {} );

				console.log ( '\n --> Room Created :', newRoom.id );

			}else  {
				
				var player = playerList [ socket.id ];

				player.roomid = availableRoom;

				var gameRoom = roomList [ availableRoom ];

				gameRoom.playerIDs.push ( socket.id );

				gameRoom.playerCount += 1;

				//initialize game..
				initGame ( gameRoom.playerIDs );
		
			}

		}

			
	});

	socket.on("playerReady", function (data) {
		
		var player = playerList [socket.id];
		
		initGridData ( socket.id, data );

		console.log ( '\n ...  data sent by ' + player.username );
		
		var checker = checkPlayersAreReady ( player.roomid );

		if ( checker ) {
			
			sendGameData ( player.roomid );

			startGame ( player.roomid );

		}
		
	});
	
	socket.on("gridClicked", function ( data ) {
		//..
		console.log ('received', playerList[socket.id].username );

		analyzeGridClicked ( data, socket.id );

	});

	socket.on("rematchRequest", function (data) {
		
		var plyr = playerList [ socket.id ]
		
		plyr.requestsRematch = true;
		
		if ( bothPlayersRequestsRematch (plyr.roomid) ) {
			
			roomList[plyr.roomid].resetGame();
			
		}else {
			
			socket.emit ('waitingRematch', null );
		}
	});
	
	socket.on("leaveGame", function(data) {
		
		var plyr = playerList[socket.id];
		
		console.log ( 'left game', plyr.roomid );

		leaveRoom ( socket.id, plyr.roomid );

	});
	
	socket.on("disconnect",function () {
			

		if ( playerList.hasOwnProperty(socket.id) ) {
			
			var plyr = playerList[socket.id];
			
			console.log ( 'disconnect', plyr.roomid );

			if ( plyr.roomid != '' ) leaveRoom ( socket.id, plyr.roomid );
			
			console.log ( '\n <-- ' + plyr.username  + ' has left the game.' );

			delete playerList [socket.id];

		}

		delete socketList [socket.id];
		
	});
	

});


function getAvailableRoom () {

	for ( var i in roomList ) {
		if ( roomList[i].playerCount == 1 ) return roomList[i].id;
	}
	return null;

}

function initGame ( playerIDs ) {

	for ( var i = 0; i < playerIDs.length; i++ ) {

		var counter = i == 0 ? 1 : 0;

		var self = playerList [ playerIDs[i] ];

		var oppo =  playerList [playerIDs[counter]];

		var data = {
			
			'isSinglePlayer' : false,
			'players' : {
				'self' : self.username,
				'oppo' : oppo.username
			}

		};

		var socket = socketList [ playerIDs[i] ];

		socket.emit ('initGame', data );

	}

}

function checkPlayersAreReady ( roomID ) {

	var gameRoom = roomList [roomID];

	for ( var i = 0; i < gameRoom.playerCount; i++ ) {

		var player = playerList [  gameRoom.playerIDs[i] ];

		if ( !player.isReady ) return false;
	}

	return true;

}

function startGame ( roomID ) {

	console.log ( '\n Game has started...', roomID );

	var gameRoom = roomList[roomID];

	gameRoom.startGame();

	for ( var i=0; i<gameRoom.playerCount; i++) {

		var socket = socketList [ gameRoom.playerIDs[i] ];

		socket.emit ('startGame');
	}

} 

function leaveRoom ( playerid, roomid ) {
	
	var player = playerList [playerid];

	player.roomid = '';

	if ( roomList.hasOwnProperty( roomid ) ) {
		
		var gameRoom = roomList [roomid];
		
		var index = gameRoom.playerIDs.indexOf ( playerid );
		
		gameRoom.playerIDs.splice ( index, 1);

		gameRoom.playerCount += -1;

		if ( gameRoom.playerCount > 0 ) {
			
			if ( gameRoom.isGameOn ) gameRoom.stopGame ();

			var socket = socketList [ gameRoom.playerIDs[0] ];
			
			socket.emit ('opponentLeft', {} );
			
			console.log ( '\n <-- Opponent Left :', roomid  );

		} else {
			//...
			delete roomList [roomid];

			console.log ( '\n <-- Room deleted :', roomid  );

		}

		console.log ('\n <-- ' + player.username + ' has left the game room.' );

	}
	
}

function initGridData ( playerid, fleet ) {

	var player = playerList [ playerid ];
		
	player.isReady = true;

	player.fleet = fleet;

	player.grid = [];

	//initialize grid data..

	for ( var z=0; z<100; z++) {

		player.grid.push ( {
			'isResided' : false,
			'isTrashed' : false,
			'index' :  -1
		});

	}	

	//update grid data base on fleet data sent..

	for ( var i=0; i<fleet.length; i++ ) {
		
		var rotation = fleet[i].rotation;

		var len = fleet[i].length;

		var index = fleet[i].index;

		var post = fleet[i].post;


		for ( var j=0;j<len;j++) {

			player.grid [post].isResided = true;

			player.grid [post].index = i;

			if ( rotation == 0 ) {
				post++;
			}else {
				post += 10;
			}

		}

	}
	
	//...

	
}

function sendGameData ( roomID ) { // gameproper...

	var gameRoom = roomList[roomID];
	
	for ( var i=0; i< gameRoom.playerCount; i++) {
			
		var turn = ( i == gameRoom.turn ) ? 'self' : 'oppo'; 
		
		var self = playerList [ gameRoom.playerIDs [i] ];

		var oppo = playerList [ gameRoom.playerIDs [ i == 0 ? 1 : 0 ] ];

		var selfGrid = [], oppoGrid = [];

		for ( var j = 0; j < 100; j++ ) {
			
			selfGrid.push ( { 
				'isTrashed' : self.grid[j].isTrashed, 
				'isResided' : (self.grid[j].isTrashed) ? self.grid[j].isResided : false,
 				'index' :  self.grid[j].index 
			});

			oppoGrid.push ( { 
				'isTrashed' : oppo.grid[j].isTrashed, 
				'isResided' : (oppo.grid[j].isTrashed) ? oppo.grid[j].isResided : false,
 				'index' :  oppo.grid[j].index 
			});

		}

		var selfFleet = [], oppoFleet = [];

		for ( var k = 0; k < 6; k++ ) {

			selfFleet.push ({ 
				'remains' : self.fleet[k].remains, 
				'length' : self.fleet[k].length, 
				'code' : self.fleet[k].code 
			});

			oppoFleet.push ({ 
				'remains' : oppo.fleet[k].remains, 
				'length' : oppo.fleet[k].length, 
				'code' : oppo.fleet[k].code 
			});

		}

		var data = {

			'turn' : turn,

			'self' : {
				'grid' : selfGrid,
				'fleet' : selfFleet
			},
			'oppo': {
				'grid' : oppoGrid,
				'fleet' : oppoFleet
			}

		};

		console.log ( '\n <-- sent to', self.id );

		var socket = socketList [ self.id ];

		socket.emit ('sendData', data );

	}

}

function analyzeGridClicked ( post, playerid ) {
	
	var isWinner = false;

	var plyr = playerList[playerid];

	var opponent = playerList [ getOpponentsId ( playerid ) ];

	var room = roomList[plyr.roomid];

	var isHit = ( opponent.grid[post].isResided ) ? true : false;

	opponent.grid[post].isTrashed = true;

	room.clickedPost = post;

	room.isHit = isHit;

	if ( isHit ) {

		var shipIndex = opponent.grid[post].index;

		opponent.fleet[shipIndex].remains += -1;

		isWinner = checkWinner ( opponent.id );

		if ( isWinner ) {
			
			room.isWinner = playerid;
			
			room.endGame ();

		}else {

			
		}

	}else {

		
	}

	
}

function getOpponentsId ( playerid ) {
	
	var plyr = playerList[playerid];
	
	if ( plyr.roomid != '' ) {
		
		var index = roomList[ plyr.roomid ].playerIDs.indexOf( playerid );
		
		var oppIndex = ( index == 0 ) ? 1 : 0;
		
		return roomList[ plyr.roomid ].playerIDs[oppIndex];
	}

	return '';

}

function checkWinner ( playerid ) {

	var fleet = playerList[playerid].fleet;

	for ( var i=0; i<fleet.length; i++) {
		if ( fleet[i].remains > 0 ) return false;
	}

	return true;
}
//............






resetGame = function (roomid) {
	
	var rm = roomList[roomid];
	
	for ( var i=0; i<rm.players.length; i++) {
			
		var socket = socketList [ rm.players[i] ];
		
		playerList[rm.players[i]].resetGame();
		
		socket.emit ('resetGame', null );
	}
}

sendErrorMessages = function ( playerid, msg ) {

	socketList[playerid].emit ('sendErrorMessage' , msg );
}

joinRoom = function ( playerid, roomid ) {
	
	var plyr = playerList[playerid];

	if ( roomList.hasOwnProperty( roomid ) ){
		
		if ( roomList[roomid].players.length < 2 ) {
		
			playerList[playerid].roomid = roomid;
			playerList[playerid].gamePoints = 0;
			playerList[playerid].gameid = roomList[roomid].players.length;
			
			roomList[roomid].players.push ( playerid );
			
			console.log ('\n --> []' + playerList[playerid].username + ' has joined the room ' + roomid );
			
			if ( roomList[roomid].players.length >= 2  ) {
				roomList[roomid].initGame();
			}
			
			sendPlayersData();
		}
		
	}
	//....
}

bothPlayersRequestsRematch = function ( roomid ) {
	
	var playersArr = roomList[roomid].players;
	
	for ( var i = 0; i < playersArr.length; i++ ) {
		
		if ( !playerList[ playersArr[i] ].requestsRematch ) return false;
	}
	return true;
}



isWinner = function ( oppoid ) {
	var fleetData = playerList[oppoid].fleetData;
	
	for ( var i in fleetData ) {
		if ( fleetData[i].cells.length !== fleetData[i].hitCount ) return false;
	}
	return true;
}


