class SceneA extends Phaser.Scene {

    constructor ()
    {
        super('SceneA');
    }

    preload ()
    {

    }

    create ()
    {

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

        this.fieldCont = this.add.container ( 0, 0 );

        this.turn = '';

        this.playersData = {};

        this.gridPostShot = [];

        //..

        this.showPrompt ('Initializing..');

        this.initPlayers ();

        this.createPlayerIndicators ();

        this.createField ();

        this.time.delayedCall ( 1000, this.startPrep, [], this );

    }   

    initPlayers ()
    {

        this.playersData ['self'] = new Player ( 'self', 'Nong', false );

        this.playersData ['oppo'] = new Player ( 'oppo', 'Chalnicol', true );

        this.turn = 'self';

    }

    startPrep () 
    {

        this.removePrompt ();

        this.createFleet('self'); 

        this.activateDrag ();

        this.createControls();

    }

    endPrep ()
    {
        //..
        console.log ('this');

        this.removeControls();

        if ( this.myGame.singlePlayer ) {

            for ( var i = 0; i < 6; i++ ) {
                this.fieldCont.getByName ('self_ship' + i ).removeInteractive().select(false);
            }

            this.createFleet ('oppo', false );

            this.startCommencement ();

        }else {

            //todo..
        }
        
    }

    showPrompt ( txt )
    {
        var rct = this.add.rectangle (960, 540, 350, 100, 0x0a0a0a, 0.5 );

        var txt = this.add.text (960, 540, txt, { color:'#fff', fontFamily:'Oswald', fontSize:30 }).setOrigin(0.5);

        this.promptCont = this.add.container (0, 0, [ rct, txt ]);

    }

    removePrompt ()
    {
        this.promptCont.destroy ();
    }

    createPlayerIndicators ()
    {
        this.playerIndicators = this.add.container (0, -70);

        var pW = 700, pS = 100;

        var px = (1920 - (2*(pW+pS)-pS))/2 + pW/2,

            py = 80;

        var counter = 0;

        for ( var i in this.playersData ) {

            var cont = this.add.container ( px + counter * (pW + pS), py ).setName ( i );

            var img = this.add.image ( 0, 0, 'pind' );

            var ttxt = this.add.text ( -240, -20, this.playersData[i].username, { color:'#646464', fontFamily:'Oswald', fontSize: 34 }).setOrigin (0, 0.5);

            var wins = this.add.text ( -240, 20, 'Wins: 0', { color:'#9e9e9e', fontFamily:'Oswald', fontSize: 28 }).setOrigin (0, 0.5);

            cont.add ( [img, ttxt, wins ]);

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
                
                this.fieldCont.add ( ship );

                this.input.setDraggable ( ship );

            }

        }

    }

    createControls ()
    {
        //..

        // x = 1410, y = 554

        var rct = this.add.rectangle (0, 0, 400, 200, 0xffffff, 0.9 );

        var txt = this.add.text (0, -75, 'Controls', { color:'#6e6e6e', fontFamily:'Oswald', fontSize:22 }).setOrigin(0.5);

        var buts0 = new MyButton ( this, 0, -20, 300, 60, 'but0', '', '', 0, 'Random', 32 );

        buts0.on('pointerup', () => {

            this.randomFleet ();

        });

        var buts1 = new MyButton ( this, 0, 50, 300, 60, 'but1', '', '', 0, 'Ready', 32 );

        buts1.on('pointerup', () => {

            this.endPrep ();
        });

        this.controlsCont = this.add.container (1385, 1180, [ rct, txt, buts0, buts1 ] );

        this.add.tween ({
            targets : this.controlsCont,
            y : 554,
            duration : 200,
            ease : 'Power2'
        });


    }

    removeControls () 
    {

        this.add.tween ({
            targets : this.controlsCont,
            y : 1180,
            duration : 200,
            ease : 'Power2',
            onComplete : () => {
                this.controlsCont.destroy ();
            }
        });
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

                this.fieldCont.bringToTop(gameObject);

                gameObject.origin = { x:gameObject.x, y: gameObject.y };

                this.setPlayerGrid ( 'self', gameObject.orgCell, gameObject.len, gameObject.isVertical ? 1 : 0, 0 );
                    
            }

        }, this);

        this.input.on('dragend', function (pointer, gameObject) {

            if ( gameObject.isSelected ) {

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

    startCommencement ()
    {
        this.showCommenceScreen ();
    }

    showCommenceScreen () 
    {
        var rct = this.add.rectangle (960, 540, 400, 100, 0x0a0a0a, 0.5 );

        var txt = this.add.text (960, 540, 'Game starts in 3..', { color:'#fff', fontFamily:'Oswald', fontSize:30 }).setOrigin(0.5);

            
        var counter = 0;

        var myTimer = setInterval (() => {

            counter++;
            console.log ( counter );

            txt.text = 'Game starts in ' + ( 3 - counter ) + '..';

            if ( counter >= 3 ) {

                clearInterval (myTimer);

                this.endCommencement ();
            }

        }, 1000 )

        this.commenceScreenCont = this.add.container (0, 0, [ rct, txt ]);
    }

    endCommencement ()
    {
        this.commenceScreenCont.destroy ();

        this.startGame ();

    }

    cellPick ( cellid ) {

        if ( this.isGameOn ) {

            var opp = this.turn == 'self' ? 'oppo' : 'self';

            var cell = this.fieldCont.getByName ( opp + '_cell' + cellid );

            cell.clicked().enable ( false );

            var isHit = this.playersGridData [ opp ] [ cell.id ] == 1;

            var cont = this.add.container ( cell.x, cell.y );

            var rct = this.add.rectangle ( 0, 0, this.cellSize-1, this.cellSize-1, 0xdedede, 0.6 );

            var crc = this.add.circle ( 0, 0, 10, isHit ? 0xff3333 : 0x6a6a6a, 1 ).setScale (0.5);

            this.add.tween ({
                targets : crc,
                scale : 1,
                duration : 300,
                easeParams : [2, 0.6],
                ease : 'Elastic'
            });

            cont.add ( [ rct, crc ]);

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

    endGame ( winner )
    {

        console.log ('winner', winner );

        this.activateCells (false);

        this.isGameOn = false;

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
    
    update ( time, delta ) {
        //console.log ( time, delta  )
    }


}