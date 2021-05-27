class SceneA extends Phaser.Scene {

    constructor ()
    {
        super('SceneA');
    }

    preload ()
    {

    }

    create ( data )
    {

        console.log ( data );
        
        this.fleetData = [
            { frm : 0, len:5, type: 'carrier'},
            { frm : 1, len:4, type: 'battleship'},
            { frm : 2, len:3, type: 'cruiser'},
            { frm : 3, len:3, type: 'submarine'},
            { frm : 4, len:2, type: 'destroyer'},
            { frm : 4, len:2, type: 'destroyer'},
        ];

        this.myGame = { 'singlePlayer' : true, 'withTimer' : false };

        this.cellSize = 80;

        this.selectedShip = '';

        this.turn = '';

        this.playersData = {};

        this.gridPostShot = [];

        this.timerIsTicking = false;

        this.controlPanelShown = false;
        //..

        this.add.image ( 960, 540, 'bg' );

        this.initSoundFx();

        this.initSocketIO();

        this.initPlayers ();

        this.createPlayerIndicators ();

        this.createField ();

        this.createEmojis();

        this.createControls();

        this.activateDrag ();

        this.showPrompt ('Initializing..', 40, 0, true );

        this.time.delayedCall ( 1000, this.startPrep, [], this );

    }   

    playMusic ( off = false ){

        if ( off ) {
            this.bgmusic.pause();
        }else {
            this.bgmusic.resume();
        }

    }

    playSound  ( snd, vol=0.5 ) {

        if ( !this.soundOff) this.soundFx.play ( snd, { volume : vol });

    }

    initPlayers () {


        const names = ['Nong', 'Chalo', 'Nasty', 'Caloy'];

        let oppoUsername = '', 
            
            oppoAI = false, 
            
            oppoChip = 0;

        if ( !this.gameData.game.multiplayer  ) {

            oppoUsername = names [ Phaser.Math.Between (0, names.length - 1) ] + ' (CPU)';

            oppoAI = true;

            oppoChip = this.gameData.players ['self'].chip == 0 ? 1 : 0;

        }  else {

            oppoUsername = this.gameData.players ['oppo'].username;

            oppoChip = this.gameData.players ['oppo'].chip;
            
        }   

        //..
        this.players ['self'] = new Player ('self', this.gameData.players['self'].username, this.gameData.players['self'].chip );

        this.players ['oppo'] = new Player ('oppo', oppoUsername, oppoChip, oppoAI );

        this.turn = this.gameData.turn;     
    
    }

    initSoundFx () 
    {
        //sfx
        this.soundFx = this.sound.addAudioSprite('sfx');

        //bg music..
        this.bgmusic = this.sound.add('sceneabg').setVolume(0.1).setLoop(true);

        this.bgmusic.play();

    
    }

    initSocketIO () 
    {

        socket.on ('playerHasMoved', data => {

            //console.log ( data );

            this.removeBlinkers ();

            this.makeTurn ( data.plyr, data.post );

        });

        socket.on ('oppoPieceClicked', data => {

            //console.log ( data );

            if ( data.piecePost != -1 ) {

                this.piecesCont.getByName ( this.gridData [ data.piecePost ].residentPiece ).setPicked ();

                this.pieceClicked = this.gridData [ data.piecePost ].residentPiece;

                this.createBlinkers ( data.piecePost, 2, false );

            }else {

                if ( this.pieceClicked != '' ) {

                    this.piecesCont.getByName ( this.pieceClicked ).setPicked ( false );

                    this.pieceClicked = '';

                    this.removeBlinkers ();

                }
                
            }

        });

        socket.on ('playerIsReady', data => {
           
            this.players [data.player].isReady = true;

            this.playerIndicatorsCont.getByName (data.player).ready();

        });

        socket.on ('endPrepTime', () => {

            //console.log ('hey end');
            if ( this.timerIsTicking ) this.stopTimer ();

            this.endPrep ();
            
        });

        socket.on ('endTurn', () => {

            if ( this.timerIsTicking ) this.stopTimer ();

            this.endTurn ();
            
        });
        
        socket.on('playerHasResign', data => {

            this.endGame (data.winner);

        });

        socket.on ('commenceGame', data => {

            //..create oppo pieces..todo..
            this.createGamePieces ('oppo', false, data.oppoPiece );

            //..
            this.startCommencement ();

        });

        socket.on('showEmoji', data => { 
            
            this.time.delayedCall (500, () => {

                //if ( this.sentEmojisShown ) this.removeSentEmojis();

                this.showSentEmojis ( data.plyr, data.emoji );

            }, [], this);

        });

        socket.on('restartGame', () => {
            this.resetGame ();
        });

        socket.on('opponentLeft', () => {
            
            this.gameOver = true;

            if ( this.timerIsTicking ) this.stopTimer();

            if ( this.isPrompted ) this.removePrompt();

            const btnArr = [ { 'txt' : 'Exit',  'func' : () => this.leaveGame() } ];

            this.showPrompt ('Opponent has left the game.', 40, -20, false, btnArr );

        });

        socket.on('playerMove', data => {
            
            //console.log ( data );

            this.makeTurn ( data.col, data.turn );

        });

        socket.on('playerHasRevealed', data => {

            this.playSound ('warp');

            this.revealPieces ( data.plyr );

            this.playerIndicatorsCont.getByName( data.plyrInd ).showReveal();

            this.showPrompt (data.msg, 28, 0, true );



            this.time.delayedCall ( 1500, () => this.removePrompt(), [], this );

        });

        socket.on('playerOfferedDraw', data => {

            if ( data.withTimer ) this.toggleTimer ();

            if ( data.type == 0 ) {

                this.showPrompt ('Waiting for response..', 34, 0, true );

            }else {

                this.showDrawOfferPrompt();
            }
            

        });
        
        socket.on('playerDeclinesDraw', data => {

            this.showPrompt (data.msg, 30, 0, true );

        });

        socket.on('resumeGame', () => {

            this.removePrompt();

            this.toggleTimer ();

        });

        socket.on('gameIsADraw', () => {
            
            this.endGame ('');

        });
        


    }

    initPlayers ()
    {

        const names = ['Nong', 'Chalo', 'Nasty', 'Caloy'];

        // if ( !this.gameData.game.multiplayer  ) {

        //     oppoUsername = names [ Phaser.Math.Between (0, names.length - 1) ] + ' (CPU)';

        //     oppoAI = true;

        //     oppoChip = this.gameData.players ['self'].chip == 0 ? 1 : 0;

        // }  else {

        //     oppoUsername = this.gameData.players ['oppo'].username;

        //     oppoChip = this.gameData.players ['oppo'].chip;
            
        // }   

        //..
        // this.players ['self'] = new Player ('self', this.gameData.players['self'].username, this.gameData.players['self'].chip );

        // this.players ['oppo'] = new Player ('oppo', oppoUsername, oppoChip, oppoAI );

        // this.turn = this.gameData.turn; 

        this.playersData ['self'] = new Player ( 'self', 'Nong', false );

        this.playersData ['oppo'] = new Player ( 'oppo', 'Chalnicol', true );

        this.turn = 'self';

    }

    startPrep () 
    {

        this.removePrompt ();

        this.createFleet('self'); 

        this.time.delayedCall ( 300, () => {

            this.showControls();

            if ( this.myGame.withTimer ) {

                this.playerIndicatorsCont.getByName ('self').showTimer();

                this.startTimer ();

                if ( !this.myGame.singlePlayer == 1 ) socket.emit ('prepStarted');
                
            } 

        }, [], this );

    }

    endPrep ()
    {
        //..
        //deactive main btns..
        for ( var i = 0; i<2; i++ ) {
            this.controlBtnsCont.getByName ('mainBtn' + i ).setBtnEnabled (false);
        }

        if ( this.controlPanelShown ) this.showControls( false );

        if ( this.myGame.singlePlayer ) {

            for ( var i = 0; i < 6; i++ ) {
                this.fieldCont.getByName ('self_ship' + i ).removeInteractive().select(false);
            }

            if ( this.timerIsTicking ) this.stopTimer ();

            this.createFleet ('oppo', false );

            this.startCommencement ();

        }else {

            //todo..
            if ( !this.players['self'].isReady ) {

                //todo send grid data..
            }
            
        }
        
    }

    startTimer ( phase = 0 ) {

        var time = ( phase == 0 ) ? this.gameData.game.time.prep : this.gameData.game.time.turn;

        var del = 50, totalTick = time*1000/del;

        this.timerIsTicking = true;

        this.timerPaused = false;

        this.timerCount = 0;

        this.gameTimer = setInterval(() => {

            if (!this.timerPaused ) {

                this.timerCount ++;

                if ( this.timerCount < totalTick ){

                    var progress = this.timerCount/totalTick;

                    if ( phase == 0) {

                        for ( var i in this.players) {
        
                            if ( !this.players[i].isReady ) this.playerIndicatorsCont.getByName (i).tick ( progress );
                        }

                    }else {

                        this.playerIndicatorsCont.getByName ( this.turn).tick ( progress );
                    }

                }else {

                    this.stopTimer ();

                    if ( phase == 0 ) {
                        this.endPrep ();
                    }else {
                        this.endTurn ();
                    }

                }
            }
                
        }, del);

    }

    toggleTimer () {
        this.timerPaused = !this.timerPaused;
    }

    stopTimer () {  

        this.timerCount = 0;

        this.timerPaused = true;

        this.timerIsTicking = false;

        clearInterval ( this.gameTimer );

    }

    createPlayerIndicators ()
    {
       
        this.playerIndicators = this.add.container (0, -70);

        var pW = 700, pS = 100;

        var px = (1920 - (2*(pW+pS)-pS))/2 + pW/2,

            py = 80;

        var counter = 0;

        for ( var i in this.playersData ) {

            var cont = new Indicator ( this, px + counter * (pW + pS), py, i, this.playersData[i].username, false );
            
            this.playerIndicators.add ( cont );

            counter ++;

        }

        var vs = this.add.image ( 960, 70, 'vs');

        this.playerIndicators.add ( vs );

        this.add.tween ({
            targets : this.playerIndicators,
            y : 0,
            duration : 400,
            ease : 'Power3'
        });


    }

    createField ()
    {

        this.fieldCont = this.add.container ( 0, 0 );

        this.playersGridData = { self : [], oppo : [] };

        var cz = this.cellSize;

        var pW = 800, pS = 50;

        var cx = (1920 - (2*(pW+pS)-pS))/2 + cz/2;

        for ( let i = 0; i < 2; i++ ) {

            var sx = cx + i * ( pW + pS), sy = 190;

            var plyr = i == 0 ? 'self' : 'oppo';

            for ( let j = 0; j < 100; j++ ) {

                let ix = Math.floor ( j/10), iy = j % 10;

                let xp =sx + iy * cz, yp =  sy + ix * cz;


                var cont = new Cells (this, xp, yp, j, plyr, cz );

                cont.on ('pointerup', function () {

                    this.scene.cellPick ( this.id );

                });
                
                this.fieldCont.add ( cont );
                
                //create players grid..
                this.playersGridData [plyr].push ( 0 );

            }


        }

    }

    createFleet ( plyr, shown = true )
    {

        const rndFleetData = this.getRandomFleetData (plyr);

        for ( var i in rndFleetData ) {

            var fleet = this.fleetData [i], 
               
                rndData = rndFleetData [i];

            var arr = [];

            for ( var j = 0; j < this.fleetData[i].len; j++ ) {

                var post = ( rndData.rotation == 0 ) ? rndData.gridPos + j : rndData.gridPos + (j*10);

                this.playersGridData [plyr] [ post ] = 1;

                arr.push ( post );

            }

            this.playersData [ plyr ].fleet.push ({ 'id': i, 'rot': rndData.rotation, 'hit': 0, 'gridPost': arr });

            
            if ( shown ) {

                var cell = this.fieldCont.getByName ( plyr + '_cell' + rndData.gridPos );

                var ship = new Ship ( this, cell.x, cell.y, plyr, i, rndData.gridPos, rndData.rotation, this.cellSize, fleet.len, fleet.type, fleet.frm, true );

                ship.on ('pointerup', function () {

                    if ( this.lastClickTime == 0 ) {

                        this.lastClickTime = new Date ();

                    }else {

                        var newClick = new Date ();

                        if ( newClick - this.lastClickTime < 300 ) {

                            this.scene.setPlayerGrid ( 'self', this.orgCell, this.len, this.isVertical ? 1 : 0, 0 );

                            var postCheck = this.scene.postCheck ( this.orgCell, this.len, !this.isVertical );

                            if  ( postCheck ) {

                                this.changeOrientation();

                                this.scene.setPlayerGrid ( 'self', this.orgCell, this.len, this.isVertical ? 1 : 0, 1 );

                                //this.scene.checkPlayerGrid ();

                            }else {
                                console.log ('err');
                            }
                            
                        }

                        this.lastClickTime = newClick
                    }

                });

                // ship.setAlpha (0);

                // this.tweens.add ({
                //     targets: ship,
                //     alpha : 1,
                //     duration : 1000,
                //     ease : 'Power3'
                // });

                
                this.fieldCont.add ( ship );

                this.input.setDraggable ( ship );

            }

        }

    }

    createControls ()
    {
        
        //..
        //add burger for controls
        let brgr = this.add.image (1844, 66, 'burger').setInteractive().setDepth (9999);

        brgr.on('pointerover', () => {
            brgr.setFrame(1);
        });
        brgr.on('pointerout', () => {
            brgr.setFrame(0);
        });
        brgr.on('pointerdown', () => {

            this.playSound ('clicka');
            
            brgr.setFrame(2);
        });
        brgr.on('pointerup', () => {
            
            brgr.setFrame(0);

            if ( this.isEmoji ) this.showEmojis (false);

            this.showControls ( !this.controlPanelShown );

        });

        //const cntW = 800, cntH = 380;

        const rct = this.add.image ( 395, 355, 'controlsBg' ).setInteractive ();

        const rcta = this.add.rectangle ( 33, 355, 66, 380 ).setInteractive ();

        rcta.on('pointerup', () => {
            this.playSound ('clicka');
            this.showControls (false);
        });

        this.controlBtnsCont = this.add.container ( 1920, 0,  [rct, rcta]).setDepth (9999);


        //..

        const btnsLeft = 200, btnsTop = 250;

        const btnArr = [

            { 
                name : 'leave', 
                desc : 'Leave Game',
                func : () => {

                    if ( this.gameOver ) {

                        this.leaveGame ();

                    }else {

                        this.showControls ( false );
                        this.showExitPrompt ();

                    }
                   
                }
            },
            { 
                name : 'emoji', 
                desc : 'Send Emoji',
                func : () => {
                    this.showEmojis ();
                    this.showControls ( false );
                }
            },
            { 
                name : 'sound', 
                desc : 'Sound On/Off',
                func : () => {
                    this.soundOff = !this.soundOff;
                }
            },
            { 
                name : 'music', 
                desc : 'Music On/Off',
                func : () => {
                    this.musicOff = !this.musicOff;
                    this.playMusic ( this.musicOff );
                }
            },

        ];

        for ( let i=0; i<btnArr.length; i++ ) {

            let xp = btnsLeft + (i * 150), yp = btnsTop;

            let btnCont = new MyButton ( this, xp, yp, 100, 100, btnArr[i].name, 'conts_sm', 'imgBtns', i ).setName ( btnArr[i].name );

            btnCont.on('pointerup', function () {
                
                this.btnState ('idle');

                if ( i >= 2 ) this.toggle ( i + 2 );

                btnArr [ i ].func ();

            });

            btnCont.on('pointerdown', function () {
                
                this.btnState ('pressed');

                this.scene.playSound ('clicka');
              
            });

            const txt = this.add.text (xp, yp + 70, btnArr[i].desc, { color : '#fff', fontFamily:'Oswald', fontSize: 20 }).setOrigin(0.5);

            this.controlBtnsCont.add ( [btnCont, txt] );

        }


        const mainBtnArr = [
            { 
                name : 'random', 
                desc : 'Random',
                func : () => this.randomFleet()
                
            },
            { 
                name : 'ready', 
                desc : 'Ready',
                func : () => this.endPrep()
                
            },

        ];

        for ( let j=0; j<mainBtnArr.length; j++ ) {

            let xpa = btnsLeft + (j * 150), ypa = btnsTop + 170;

            let btnConta = new MyButton ( this, xpa, ypa, 100, 100, mainBtnArr[j].name, 'conts_sm', 'imgBtns',  j+7 ).setName ( 'mainBtn' + j  );

            btnConta.on('pointerup', function () {
                
                this.btnState ('idle');

                mainBtnArr [ j ].func ();

            });

            btnConta.on('pointerdown', function () {
                
                this.btnState ('pressed');

                this.scene.playSound ('clicka');
              
            });

            const txta = this.add.text (xpa, ypa + 70, mainBtnArr[j].desc, { color : '#fff', fontFamily:'Oswald', fontSize: 20 }).setOrigin(0.5);

            this.controlBtnsCont.add ( [btnConta, txta ] );

        }

    }

    showControls ( show = true) 
    {
        this.controlPanelShown = show;

        this.add.tween ({
            targets : this.controlBtnsCont,
            x : show ? 1120 : 1920,
            duration : 200,
            ease : 'Power2'
        });
    }

    createEmojis () {

        this.emojiContainer = this.add.container ( 0, -1080 ).setDepth (999);

        let rct = this.add.rectangle ( 0, 0, 1920, 1080 ).setOrigin(0).setInteractive ();

        rct.on('pointerdown', () => {
            
            this.playSound ('clicka');

            this.showEmojis (false);
        });

        let bgimg = this.add.image ( 1650, 480, 'emojibg').setInteractive();

        this.emojiContainer.add ( [ rct, bgimg ] );

        const sx = 1595, sy = 260;

        for ( let i=0; i<12; i++) {

            let ix = Math.floor ( i/2 ), iy = i%2;

            let cont = this.add.container ( sx + iy * 110, sy + ix* 95 ).setSize (100, 100).setInteractive();


            let rct = this.add.rectangle ( 0, 0, 90, 90, 0xffffff, 0.6 ).setVisible (false);

            let img = this.add.image (  0, 0, 'emojis', i ).setScale ( 0.9 );

            cont.add ([rct, img]);

            cont.on('pointerover', function () {
                this.first.setVisible ( true );
            });
            cont.on('pointerout', function () {
                this.first.setVisible ( false );
            });
            cont.on('pointerdown', function () {

                this.scene.playSound ('clicka');

            });
            cont.on('pointerup', function () {
                
                this.first.setVisible ( false );

                this.scene.showEmojis ( false );

                this.scene.sendEmoji ( i );                
            
            });

            this.emojiContainer.add ( cont );

        }

    }

    showEmojis ( show = true ) 
    {
        this.isEmoji = show;

        this.add.tween ({
            targets : this.emojiContainer,
            y : show ? 0 : -1080,
            duration : 300,
            easeParams : [ 1.2, 0.8 ],
            ease : 'Elastic' 
        });

    }

    sendEmoji ( emoji ) {

        if ( this.myGame.singlePlayer ) {

            this.time.delayedCall ( 500, () => {

                this.showSentEmojis ('self', emoji );

            }, [], this );


            this.time.delayedCall ( 2000, () => {

                this.showSentEmojis ('oppo', Math.floor ( Math.random() * 12 ));

            }, [], this);


        }else {

            socket.emit ('sendEmoji', { 'emoji' : emoji });
        }

        //...disable emoji btns for 2 secs..
        this.controlBtnsCont.getByName('emoji').removeInteractive();

        this.time.delayedCall ( 4000, () => {
            this.controlBtnsCont.getByName('emoji').setInteractive();
        }, [], this );

    }

    showSentEmojis ( plyr, emoji ) {
        
        this.playSound ('message');

        const xp = plyr == 'self' ? 300 : 1100, yp = 188;

        this.sentEmojisShown = true;

        const emojiContainer = this.add.container ( xp, yp );

        const bgimg = this.add.image ( 0, 0, 'emojibubble' );

        const emojiimg = this.add.image ( -2, 2, 'emojis', emoji ).setScale(0.9);
        
        this.add.tween ({
            targets : emojiimg,
            y : '+=3',
            duration : 100,
            yoyo : true,
            ease : 'Power3',
            repeat : 5
        });

        emojiContainer.add ([bgimg, emojiimg]);

        this.emojiTimer = this.time.delayedCall ( 2000, () => {

           emojiContainer.destroy ();

        }, [], this );

    }
    
    randomFleet ()
    {
        for ( var i = 0; i < 6; i++ ) {
            this.fieldCont.getByName ('self_ship' + i ).destroy();
        }
        for ( var i = 0; i < 100; i++ ) {
            this.playersGridData ['self'] [i] = 0;
        }
        this.createFleet ('self');
    }

    activateDrag ()
    {
        
        this.input.on('dragstart', function (pointer, gameObject) {

            if ( gameObject.isSelected ) {

                this.playSound ('clickc');

                this.fieldCont.bringToTop(gameObject);

                gameObject.origin = { x:gameObject.x, y: gameObject.y };

                this.setPlayerGrid ( 'self', gameObject.orgCell, gameObject.len, gameObject.isVertical ? 1 : 0, 0 );
                    
            }

        }, this);

        this.input.on('dragend', function (pointer, gameObject) {

            if ( gameObject.isSelected ) {

                this.playSound ('clickc');

                var cell = this.getCellHit ( 'self', gameObject );

                var post = {};

                if ( cell != null ) {

                    var postCheck = this.postCheck ( cell.id, gameObject.len, gameObject.isVertical );

                    if (postCheck) {

                        gameObject.orgCell = cell.id;

                        this.setPlayerGrid ( 'self', cell.id, gameObject.len, gameObject.isVertical ? 1 : 0, 1 );

                        //this.checkPlayerGrid ();

                    }else {

                        this.setPlayerGrid ( 'self', gameObject.orgCell, gameObject.len, gameObject.isVertical ? 1 : 0, 1 );

                    }
                    
                    post.x = postCheck ? cell.x : gameObject.origin.x;
                    post.y = postCheck ? cell.y : gameObject.origin.y;
                    
                }else {

                    post.x =  gameObject.origin.x;
                    post.y =  gameObject.origin.y;
                    
                }
                    
                this.tweens.add ({
                    targets: gameObject,
                    x : post.x,
                    y : post.y,
                    duration : 100,
                    ease : 'Power2'
                });

            }

        }, this);

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {

            if ( gameObject.isSelected){

                gameObject.x = dragX;

                gameObject.y = dragY;

            }
            
            
        }, this);

    }

    activateCells ( activated = true )
    {
        for ( var i = 0; i < 100; i++ ) {
            this.fieldCont.getByName ('oppo_cell' + i ).enable ( activated );
        }
    }

    getShipHit ( plyr, post )
    {

        var fleet = this.playersData [plyr].fleet;

        for ( var i in fleet ) {

            if ( fleet[i].gridPost.includes ( post ) ) return i;

        }

        return -1;

    }

    cellPick ( cellid ) {

        if ( this.isGameOn ) {

            var opp = this.turn == 'self' ? 'oppo' : 'self';

            var cell = this.fieldCont.getByName ( opp + '_cell' + cellid );

            cell.clicked().enable ( false );

            var isHit = this.playersGridData [ opp ] [ cell.id ] == 1;

            this.createAnims ( cell.x, cell.y, isHit );
            //..

            this.endTurn ();

            if ( isHit ) {

                var shipHit = this.getShipHit ( opp, cell.id );

                var shipData = this.playersData [ opp ].fleet [ shipHit ];
        
                shipData.hit += 1;

                if ( shipData.hit >= shipData.gridPost.length ) {
                    console.log ( 'wreck' );
                }

                var isWinner = this.checkWin ( this.turn );

                if ( isWinner ) {
                    this.endGame ( this.turn );
                }else {
                    this.startTurn ();
                }

            }else {

                this.switchTurn ();
            }
            
        }


    }

    createAnims ( x, y, isHit )
    {

        var cont = this.add.container ( x, y );

        var rct = this.add.rectangle ( 0, 0, this.cellSize-1, this.cellSize-1, isHit ? 0xffffcc : 0xdedede, 0.6 );

        var crc = this.add.circle ( 0, 0, 10, isHit ? 0xff3333 : 0x6a6a6a, 1 ).setScale (0.5);

        this.add.tween ({
            targets : crc,
            scale : 1,
            duration : 300,
            easeParams : [2, 0.6],
            ease : 'Elastic'
        });

        cont.add ( [ rct, crc ]);

        if ( !isHit ) {

            for ( var i = 0; i < 3; i++ ) {

                let crca = this.add.circle ( x, y, 50 ).setStrokeStyle ( 1, 0x3a3a3a ).setScale (0.2);

                this.add.tween ({
                    targets : crca,
                    scale : 1, 
                    alpha : 0,
                    duration : 1000,
                    ease : 'Power3',
                    delay : i * 150,
                    onComplete : function () {
                        this.targets[0].destroy()
                    }
                });

            }

        }else {

            var max = 15;

            for ( var i = 0; i < max; i++ ) {

                var xp = x + Math.cos ( Phaser.Math.DegToRad( 360/max * i )) * 20,

                    yp = y - Math.sin ( Phaser.Math.DegToRad( 360/max * i )) * 20;

                
                let str = this.add.star ( xp, yp, 5, 5, 10, 0xff3333, 1 );

                var vel = Phaser.Math.Between ( 80, 120 );
                
                this.add.tween ({
                    targets : str,
                    x :  x + Math.cos ( Phaser.Math.DegToRad( 360/max * i )) * vel,
                    y :  y - Math.sin ( Phaser.Math.DegToRad( 360/max * i )) * vel,
                    alpha : 0,
                    duration : 1000,
                    ease : 'Power2',
                    onComplete : function () {
                        this.targets[0].destroy()
                    }
                });

            }


        }

    }

    checkWin ( plyr )
    {

        var fleet = this.playersData [ plyr == 'self' ? 'oppo' : 'self' ].fleet;

        for ( var i in fleet ) {

            if ( fleet[i].hit < fleet [i].gridPost.length ) return false;

        }

        return true;

    }

    startGame ()
    {
        this.isGameOn = true;

        this.startTurn ();

        if ( this.myGame.withTimer ) {
            //todo..
        }

    }

    switchTurn ()
    {
        this.turn = this.turn == 'self' ? 'oppo' : 'self';

        this.startTurn ();
    }

    startTurn ()
    {
        if ( this.playersData [ this.turn ].isAI ) {
            this.time.delayedCall ( 500, this.turnAI, [], this);
        }else {
            if ( this.turn == 'self' ) {
                this.time.delayedCall ( 200, this.activateCells, [], this);
            }
        }
    }

    endTurn ()
    {
        if ( this.turn == 'self') {
            this.activateCells (false);
        }
    }

    turnAI () 
    {
        var sf = this.playersData[ this.turn ].shotsFired;

        var indx =  Math.floor(Math.random() * sf.length);

        var pick = sf [ indx ];

        sf.splice ( indx, 1 );

        this.cellPick ( pick );

    }

    checkPlayerGrid () {

        console.log ('->');

        for ( var i = 0; i < 10; i++ ) {
            console.log ( this.playersGridData['self'].slice ( i * 10, (i + 1) * 10 ));
        }
    }

    setPlayerGrid (plyr, org, len, rot, value ) {

        for ( var j = 0; j < len; j++ ) {

            var post = ( rot == 0 ) ? org + j : org + (j*10);

            this.playersGridData [plyr] [ post ] = value;

            //console.log ( this.playersGridData [plyr] [ post ] )
        }

    } 

    postCheck ( gridPos, len, isVertical ) {

        //console.log ( gridPos, len, isVertical );

        const r = Math.floor ( gridPos / 10 ), c = gridPos % 10;

        let counter = 0;

        for ( let i = 0; i < len; i++) {

            if ( !isVertical ) {

                if ( c + i < 10 ) {
                    if ( !this.checkAdjacents ( gridPos + i, this.playersGridData['self'] ))  counter += 1;
                }

            }else {

                if ( (r + i) < 10 ) {
                    if ( !this.checkAdjacents ( gridPos + (i*10), this.playersGridData['self'] ) ) counter += 1;
                }

            }

        }

        return counter >= len;

    }

    getCellHit ( plyr, ship ) {

        for ( let i = 0; i < 100; i++ ) {

            var cell = this.fieldCont.getByName( plyr + '_cell' + i );

            if ( this.cellHit ( cell, ship ) ) return { x: cell.x, y:cell.y, id : i };

        }

        return null;

    }

    cellHit ( cell, ship ) {

        return ( cell.x - cell.width/2) <= ship.x
            && ( cell.y - cell.height/2) <= ship.y
            && ( cell.x + cell.width/2) > ship.x
            && ( cell.y + cell.height/2) > ship.y
   
    }  

    getRandomFleetData ( plyr ) 
    {
        
        let tmpArr = [];

        let tempGridData = [];

        for ( var i = 0; i < 100; i++ ) {
            tempGridData.push (0);
        }

        for ( var i in this.fleetData ) {

            let gridCheck = false;

            const len = this.fleetData [i].len;

            while ( !gridCheck) 
            {

                let rndGridPos = Math.floor ( Math.random() * 100 );

                const r = Math.floor ( rndGridPos / 10 ), c = rndGridPos % 10;
        
                let countH = 0, countV = 0;


                //check if horizontal or vertical position is good..
                for ( let i = 0; i < len; i++) {

                    //horizontal
                    if ( (c + i) < 10 ) {
                        if ( !this.checkAdjacents ( rndGridPos + i, tempGridData ) ) countH += 1;
                    }

                    //vertical
                    if ( (r + i) < 10 ) {
                        if ( !this.checkAdjacents ( rndGridPos + (i*10), tempGridData ) ) countV += 1;
                    }

                }
    
                //
                //console.log ( rndGridPos, len, countH, countV );

                if ( countH >= len || countV >= len ) {

                    let rot = 0;

                    if ( countH >=len && countV >=len) {
                        rot = Math.floor ( Math.random() * 2 )
                    }else {
                        rot = ( countH >= len ) ? 0 :  1;
                    }

                    for ( let i = 0; i < len; i++ ) {

                        var post = rot == 0 ? rndGridPos + i : rndGridPos + (i*10);

                        tempGridData [ post ] = 1;

                    }

                    tmpArr.push ({ 'gridPos' : rndGridPos, 'rotation' : rot });

                    gridCheck = true;

                }


            }

        }

        return tmpArr;

    }

    checkAdjacents ( gridPos, arr ) {

        const r = Math.floor ( gridPos / 10 ), c = gridPos % 10;

        var tmp = [];

        tmp.push ( arr[gridPos] );

        if ( r - 1 >= 0 ) tmp.push ( arr[ gridPos - 10 ] );

        if ( r + 1 < 10 ) tmp.push ( arr[ gridPos + 10 ] );

        if ( c - 1 >= 0 ) tmp.push ( arr[ gridPos - 1 ] );

        if ( c + 1 < 10 ) tmp.push ( arr[ gridPos + 1 ] );

        return tmp.includes (1);

    }

    getAdjacents ( post) 
    {   
        var arr = [];

        var r = Math.floor ( post / 10 ), c = post % 10;

        arr.push (post);

        if ( r - 1 >= 0 ) arr.push ( (r-1)*10 + c );

        if ( c - 1 >= 0 ) arr.push ( r*10 + (c-1) );

        if ( r + 1 < 10 ) arr.push ( (r+1)*10 + c );
        
        if ( c + 1 < 10 ) arr.push ( r*10 + (c+1) );

        return arr;
    }
    
    startCommencement () {

        if ( this.timerIsTicking ) this.stopTimer ();

        for ( var i in this.players ) {

            var inds = this.playerIndicatorsCont.getByName (i);

            if ( !inds.isReady ) inds.ready ();

        }

        // if ( !this.controlsHidden ) this.showControls (false);

        this.time.delayedCall ( 800, () => this.showCommenceScreen (), [], this);

    }

    showCommenceScreen ()
    {

        //this.commenceElements = [];

        this.commenceCont= this.add.container (960, 540);

        //const rct = this.add.rectangle ( 0, 0, 300, 250 );

        const img0 = this.add.image ( -20, 40, 'commence');

        const img1 = this.add.image ( 60, -40, 'commence').setScale(0.7);

        const img2 = this.add.image ( -20, -60, 'commence').setScale (0.5);

        const commence = this.add.text ( 0, 0, '3', {color:'#333', fontFamily:'Oswald', fontSize: 120 }).setStroke('#ddd', 5 ).setOrigin(0.5);

        this.commenceCont.add ([ img0, img1, img2, commence ]);

        //start commence timer..

        this.tweens.add ({
            targets : [img0, img2 ],
            rotation : '+=1',
            duration : 1000,
            repeat : 3,
            ease : 'Cubic.easeIn'
        });

        this.tweens.add ({
            targets : img1,
            rotation : '-=1',
            duration : 1000,
            repeat : 3,
            ease : 'Cubic.easeIn'
        });

        this.playSound ('beep');
        
        let counter = 0;

        this.time.addEvent ({
            delay : 1000,
            callback : () => {

                counter += 1;

                commence.text = ( 3 - counter );

                this.playSound ( (counter >= 3) ? 'bell' : 'beep' );

                if ( counter >= 3 ) {

                    this.commenceCont.destroy();

                    this.startGame ();

                }

            },
            callbackScope : this,
            repeat : 2
        });


    }

    showPrompt ( myTxt, fs = 40, txtPos = 0, sm = false, btnArr = [] ) {

        if ( this.isPrompted ) this.removePrompt ();

        this.isPrompted = true;

        this.promptCont = this.add.container (0,0);

        let rct = this.add.rectangle ( 960, 540, 1920, 1080, 0x0a0a0a, 0.4 ).setInteractive ();

        rct.on('pointerdown', function () {
            // this.scene.removePrompt();
        });

        this.promptCont.add ( rct );

        let miniCont = this.add.container ( 960, 1350 );

        let img = this.add.image ( 0, 0, sm ? 'prompt_sm' : 'prompt_main' );

        let txt = this.add.text (  0, txtPos, myTxt, { fontSize: fs, fontFamily:'Oswald', color: '#6e6e6e' }).setOrigin(0.5);

        miniCont.add ([ img, txt ]);

        if ( btnArr.length > 0 ) {

            const bw = 190, bh = 80, sp = 15;

            const bx = ((btnArr.length * (bw + sp)) - sp)/-2  + bw/2, 
        
                  by = 80;

            for ( let i = 0; i < btnArr.length; i++ ) {
                
                let btn = new MyButton ( this, bx + i*(bw+sp), by, bw, bh, i, 'promptbtns', '', '',  btnArr [i].txt, 30 );

                btn.on('pointerup', function () {

                    this.btnState('idle');

                    btnArr [i].func();

                });
                btn.on('pointerdown', function () {
                    
                    this.btnState ('pressed');

                    this.scene.playSound ('clicka');

                });

                miniCont.add ( btn );

            }



        }

        this.promptCont.add( miniCont );


        this.add.tween ({
            targets : this.promptCont.last,
            y : 540,
            duration : 400,
            easeParams : [ 1.1, 0.8 ],
            ease : 'Elastic',
            delay : 100
        });


    }

    removePrompt () 
    {
        this.isPrompted = false;

        this.promptCont.destroy();
    }

    showExitPrompt () {


        const btnArr = [
            { 'txt' : 'Proceed', 'func' : () => this.leaveGame () },
            { 'txt' : 'Cancel', 'func' : () => this.removePrompt () }
        ];

        this.showPrompt ( 'Are you sure you want to leave?', 34, -30, false, btnArr );

    }

    endGame ( winner ) {

        this.isGameOn = false;

        console.log ('winner', winner );

        this.activateCells (false);

        //if ( this.timerIsTicking ) this.stopTimer ();

        if ( winner != '' ) {

            this.playersData [ winner ].wins += 1;

            this.playerIndicators.getByName ( winner ).setWins ( this.playersData [ winner ].wins );

        }

        this.time.delayedCall ( 300, () => {
            
            this.playSound ('xyloriff', 0.3);

            this.showEndPrompt ( winner );

        }, [], this );

    }

    resetGame () {

        if ( this.isPrompted ) this.removePrompt ();

        this.showPrompt ('Game is restarting..', 36, 0, true );

        
        for (var j in this.players ){

            this.playerIndicatorsCont.getByName (j).reset ();

            this.players [j].isReady = false;

            for ( var i = 0; i < 100; i++ ) {
                this.playersGridData [j] = 0;
            }

        }

        this.time.delayedCall (1000, function () {
           
            this.removePrompt ();
           
            this.gameOver = false;

            this.startPrep ();
            
        }, [], this);

    }

    showEndPrompt ( winner ) {

       
        let txt = '';

        switch (winner) {
            case 'self':
                txt = 'Congrats, You Win';
                break;
            case 'oppo':
                txt = 'Sorry, You Lose';
                break;
            default:
                txt = 'This game is a draw.';
                break;
        }

        const btnArr = [

            { 
                'txt' : 'Play Again', 
                'func' : () => this.playerRematch ()
            },
            { 
                'txt' : 'Exit', 
                'func' : () => this.leaveGame()
            },

        ];

        this.showPrompt ( txt, 40, -20, false, btnArr );

    }

    leaveGame () {

        socket.emit ('leaveGame');

        socket.removeAllListeners();

        if ( this.timerIsTicking ) this.stopTimer ();

        this.bgmusic.stop();

        this.scene.start ('Intro');
    }

    update ( time, delta ) {
        //console.log ( time, delta  )
    }


}