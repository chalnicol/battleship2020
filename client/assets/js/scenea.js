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

        this.gameData = {
            'singlePlayer' : true,
            'withTimer' : false
        };

        this.cellSize = 80;

        this.selectedShip = '';

        this.fieldCont = this.add.container ( 0, 0 );

        

        this.initGridData ();

        this.createField ('self');

        this.createPlayerIndicators ();

        this.time.delayedCall ( 1000, () => {

            this.createFleet('self', true); 

            this.createControls();
            
            this.startPrep ();

        }, [], this );

    }

    initGridData ()
    {
        this.playersGridData = { self : [], oppo : [] };

        for ( var i=0; i < 100; i++ ) {

            this.playersGridData ['self'].push (0);

            this.playersGridData ['oppo'].push (0);
        }

    }

    createPlayerIndicators ()
    {
        var pW = 800, pH = 150, pS = 160;

        var px = (1920 - (2*(pW+pS)-pS))/2 + pW/2,

            py = 75;

        for ( var i = 0; i < 2; i++) {

            this.add.image ( px + i * ( pW + pS), py, 'pind' );

        }


    }

    createControls ()
    {
        //..
        var _this = this;

        var buts = new MyButton ( this, 480, 1015, 800, 80, 'but0', '', '', 0, 'Ready', 40 );

        buts.on('pointerup', function () {

            this.removeInteractive ();

            _this.add.tween ({
                targets : this,
                y : 1130,
                duration : 200,
                ease : 'Power2',
                onComplete : () => {
                    this.destroy ();
                }
            });

            _this.endPrep ();

        });
    }

    createField ( plyr )
    {

        var cz = this.cellSize;

        const cx = plyr == 'self' ? (960 - (cz*10))/2 + cz/2 : 960 + (960 - (cz*10))/2 + cz/2,
        
              cy = 190;

        for ( var j = 0; j < 100; j++ ) {

            let ix = Math.floor ( j/10), iy = j % 10;

            let minicont = this.add.container (  cx + iy * cz, cy + ix * cz ).setSize(cz, cz).setName ( plyr + '_cell'+ j);

            let rct = this.add.rectangle ( 0, 0, cz, cz, 0xdedede, 1 ).setStrokeStyle ( 2, 0x9e9e9e );

            let txt = this.add.text ( -30, -30, j + 1, { fontSize: 16, fontFamily:'Oswald', color:'#888' });
            
            minicont.add([rct, txt]);

            this.fieldCont.add ( minicont );

        }

       

    }

    createFleet ( plyr, enabled = false )
    {

        const fleetPos = this.getRandomFleetPos (plyr);

        for ( var i in fleetPos ) {

            let cell = this.fieldCont.getByName ( plyr + '_cell' + fleetPos [i].gridPos );

            let ship = new Ship ( this, cell.x, cell.y, plyr, i, fleetPos[i].gridPos, fleetPos [i].rotation, this.cellSize, this.fleetData[i], enabled );

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
            
            for ( var j = 0; j < this.fleetData[i].len; j++ ) {

                var post = ( fleetPos [i].rotation == 0 ) ? fleetPos [i].gridPos + j : fleetPos [i].gridPos + (j*10);

                this.playersGridData ['self'] [ post ] = 1;

            }

            this.fieldCont.add ( ship );

        }

    }

    startPrep ()
    {
        for ( var i = 0; i < 6; i++ ) {

            var ship = this.fieldCont.getByName ('self_ship' + i );

            ship.select (true);

            this.input.setDraggable(ship);

        }

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

    endPrep ()
    {
        //..
        console.log ('this');

        if ( this.gameData.singlePlayer ) {

            for ( var i = 0; i < 6; i++ ) {
                this.fieldCont.getByName ('self_ship' + i ).removeInteractive().select(false);
            }

            this.time.delayedCall ( 200, () => {

                this.createField ('oppo');

                this.createFleet ('oppo');

                this.startCommence ();

            }, [], this );
            
        }else {

        }

        
    }

    startCommence ()
    {
        //.
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

            this.playersGridData [ plyr ] [ post ] = value;

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

    getRandomFleetPos ( plyr ) 
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
      
    }


}