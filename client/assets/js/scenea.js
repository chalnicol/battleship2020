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

        
        this.gridData = {};

        this.createGrid ();

        this.createField ()


        var _this = this;

        this.input.on ('pointerup', function () {
           //_this.startDrag = false;
            this.getRandomFleetPos ();

        }, this);
        this.input.on ('pointermove', function ( pointer ) {
            //
            if ( _this.startDrag ) {

                _this.dragged.x = pointer.x + _this.gap.x;
                _this.dragged.y = pointer.y + _this.gap.y;
                
            }
        });

        this.fleetData = [
            { len:5, type: 'carrier'},
            { len:4, type: 'battleship'},
            { len:3, type: 'cruiser'},
            { len:3, type: 'submarine'},
            { len:2, type: 'destroyer'},
            { len:2, type: 'destroyer'},
        ];


    }

    createGrid ( plyr = 'self' ) // self or oppo 
    {

        this.gridData [ plyr ] = [];

        for ( var i = 0; i < 100; i++ ) {

            const xp = Math.floor ( i/10 ), yp = i % 10;
            
            this.gridData [plyr].push (0);
        
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

    getRandomFleetPos ( plyr = 'self') 
    {
     
        let myArr = [];

        let counter = 0;

        for ( var i in this.fleetData ) {

            let gridCheck = false;

            do {

                let randGridPos = Math.floor ( Math.random() * 100 );

                let gridPostData = this.checkGridPos ( plyr, randGridPos, this.fleetData [i].len )

                if ( gridPostData.v || gridPostData.h ) {

                    myArr.push ({
                        gridPos : randGridPos,
                        rotation : ( gridPostData.v ) ? 0 : 1
                    });

                    gridCheck = true;
                }

                counter += 1;

            } while ( !gridCheck );

        
        }

        return myArr;

    }

    checkGridPos ( plyr, gridNumbr, len )
    {

        const r = Math.floor ( gridNumbr / 10 ), c = gridNumbr % 10;
        
        let countH = 0, countV = 0;

        for ( let i = 0; i < len; i++) {

            //check horizontal
            if ( (r + i) < 10 ) {

                let gridPosH = ((r + i) * 10) + c;

                if ( this.gridData [plyr][gridPosH] == 0 ) countH += 1;

            }

            //checkVertical 
            if ( (c + i) < 10 ) {

                let gridPosV = (r * 10) + c + i;

                if ( this.gridData [plyr][gridPosV] == 0 ) countV += 1;
                
            }

        }

        return { h : countH == len , v : countV == len };


    }


   

    update ( time, delta ) {
      
    }


}