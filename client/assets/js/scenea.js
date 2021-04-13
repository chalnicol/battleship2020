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
            { len:5, type: 'carrier'},
            { len:4, type: 'battleship'},
            { len:3, type: 'cruiser'},
            { len:3, type: 'submarine'},
            { len:2, type: 'destroyer'},
            { len:2, type: 'destroyer'},
        ];

        this.playersGridData = {};

        this.initGridData ();

        this.createField ();

        this.time.delayedCall ( 1000, () => this.createFleet(), [], this );

    }

    initGridData ()
    {

        this.playersGridData ['self'] = [];

        this.playersGridData ['oppo'] = [];
        
        for ( var i=0; i < 100; i++ ) {

            this.playersGridData ['self'].push (0);

            this.playersGridData ['oppo'].push (0);
        }

    }

    createField ( plyr = 'self' )
    {

        //1920 1080
        this.fieldCont = this.add.container ( 0, 0 );

        const cz = 60; //cellsize

        const  cx = (960 - (cz*10))/2  + cz/2, cy = 100;

        for ( let j = 0; j < 100; j++ ) {

            let ix = Math.floor ( j/10), iy = j % 10;

            let minicont = this.add.container (  cx + iy * cz, cy + ix * cz ).setName ('cell' + j );

            let rct = this.add.rectangle ( 0, 0, cz, cz, 0xcecece, 1 ).setStrokeStyle ( 1, 0x9e9e9e );

            //let txta = this.add.text ( 0, 0, ix +':' + iy, { fontSize: 20, fontFamily:'Arial', color:'#000' });

            let txt = this.add.text ( -cz/2, -cz/2, j, { fontSize: 20, fontFamily:'Arial', color:'#888' });
            
            minicont.add( [rct, txt] );

            this.fieldCont.add ( minicont );

        }

    }

    createFleet ( plyr = 'self' )
    {

        const fleetPos = this.getRandomFleetPos (plyr);

        console.log ( fleetPos );

        for ( var i in fleetPos ) {

            let cell = this.fieldCont.getByName ('cell' + fleetPos [i].gridPos );

            let ship = new Ship ( this, cell.x, cell.y, i, this.fleetData[i].type, 60, this.fleetData[i].len, fleetPos [i].rotation );

            ship.on ('pointerdown', function () {
                this.changeOrientation();
            });


            for ( var j = 0; j < this.fleetData[i].len; j++ ) {

                if ( fleetPos [i].rotation == 0 ) {
                    //..
                    this.playersGridData [plyr] [ fleetPos [i].gridPos + j ] = 1;

                }else {
                    //..
                    this.playersGridData [plyr] [ fleetPos [i].gridPos + ( j * 10 )] = 1;
                    
                }

            }
        }


    }

    getRandomFleetPos ( plyr ) 
    {
        
        //create grid 10 x 10..
        let tmpArr = [];

        //create temp grid..
        let tempGridData = [];

        for ( var i = 0; i < 100; i++ ) {
            tempGridData.push (0);
        }

        //
        let counter = 0;

        for ( var i in this.fleetData ) {

            let gridCheck = false;

            const len = this.fleetData [i].len;

            do {

                let rndGridPos = Math.floor ( Math.random() * 100 );

                const r = Math.floor ( rndGridPos / 10 ), c = rndGridPos % 10;
        
                let countH = 0, countV = 0;


                //check if horizontal or vertical position is good..

                for ( let i = 0; i < len; i++) {

                    //check vertical
                    if ( (r + i) < 10 ) {

                        let gridPosV = ((r + i) * 10) + c;

                        if ( this.checkNearby ( gridPosV, tempGridData ) ) countV += 1;

                    }

                    // check horizontal 
                    if ( (c + i) < 10 ) {

                        let gridPosH = (r * 10) + c + i;

                        if ( this.checkNearby ( gridPosH, tempGridData ) ) countH += 1;

                        //if ( tempGridData [ gridPosH ] == 0 ) countH += 1;
                        
                    }

                }
                

                //
                if ( countH >= len || countV >= len ) {

                    let rot = ( countH >= len ) ? 0 : 1;

                    for ( let i = 0; i < len; i++ ) {

                        if ( rot == 1 ) {

                            //let vrt = ((r + i) * 10) + c;

                            let vrt = rndGridPos + (i * 10);

                            tempGridData [ vrt ] =  1;

                        }else {
                            
                            //let hor = (r * 10) + c + i;

                            let hor = rndGridPos + i;

                            tempGridData [ hor ] =  1;
                        }

                    }

                    tmpArr.push ({ 'gridPos' : rndGridPos, 'rotation' : rot });

                    gridCheck = true;

                }

                console.log ('done here..');



            } while ( !gridCheck );

        
        }

        return tmpArr;

    }


    checkNearby ( gridPos, arr ) {

        const r = Math.floor ( gridPos / 10 ), c = gridPos % 10;

        let center = false;
        if ( arr[gridPos] == 1 ) center = true;

        let top = false;
        if ( r - 1 >= 0 ) {
            if ( arr [ gridPos - 10 ] == 1 ) top = true;
        }

        let bot = false;
        if ( r + 1 < 10 ) {
            if ( arr [ gridPos + 10 ] == 1 ) bot = true;
        }

        let left = false;
        if ( c - 1 >= 0 ) {
            if ( arr [ gridPos - 1 ] == 1 ) left = true;
        }

        let right = false;
        if ( c + 1 < 10 ) {
            if ( arr [ gridPos + 1 ] == 1 ) right = true;
        }

        return !center && !top && !bot && !left && !right;


    }

    update ( time, delta ) {
      
    }


}