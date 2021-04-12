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

        const cz = 80; //cellsize

        const  cx = (960 - (cz*10))/2  + cz/2, cy = 100;

        for ( let j = 0; j < 100; j++ ) {

            let ix = Math.floor ( j/10), iy = j % 10;

            let rct = this.add.rectangle ( cx + iy * cz, cy + ix * cz, cz, cz, 0xcecece, 1 ).setStrokeStyle ( 1, 0x9e9e9e );

            let txt = this.add.text ( cx + iy * cz, cy + ix * cz, ix +':' + iy, { fontSize: 20, fontFamily:'Arial', color:'#000' });

            let txtb = this.add.text ( cx + (iy * cz) - cz/2 , cy + (ix * cz) - cz/2, j, { fontSize: 20, fontFamily:'Arial', color:'#888' });
            

            this.fieldCont.add( [rct, txtb, txt] );
        }

    }

    createFleet ( plyr = 'self ')
    {

        const fleetPos = this.getRandomFleetPos (plyr);

        console.log ( fleetPos );

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

                        if ( tempGridData [ gridPosV ] == 0 ) countV += 1;

                    }

                    // check horizontal 
                    if ( (c + i) < 10 ) {

                        let gridPosH = (r * 10) + c + i;

                        if ( tempGridData [ gridPosH ] == 0 ) countH += 1;
                        
                    }

                }
                

                //
                if ( countH >= len || countV >= len ) {

                    let rot = ( countH >= len ) ? 0 : 1;

                    for ( let i = 0; i < len; i++ ) {

                        if ( rot == 1 ) {

                            let vertical = ((r + i) * 10) + c;

                            console.log ('v', vertical );

                            tempGridData [ vertical ] =  1;

                        }else {
                            
                            let horizontal = (r * 10) + c + i;

                            console.log ('h', horizontal );

                            tempGridData [ horizontal ] =  1;
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



    update ( time, delta ) {
      
    }


}