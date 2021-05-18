class Ship extends Phaser.GameObjects.Container {

    constructor(scene, x, y, plyr, idnmbr, orgCell, rot, csize, attr = {}, enabled ) {

        //frame, type, len
        super(scene, x, y, [] );
        // ..
        
        this.orgCell = orgCell;

        this.len = attr.len;
        
        this.id = plyr + '_ship' + idnmbr;
        
        this.type = attr.type;

        this.origin = {};

        this.lastClickTime = 0;

        this.isVertical = false;

        this.isSelected = false;

        //..
        var w = csize * attr.len, h = csize;

        this.setName ( this.id );
        
        if ( enabled ) this.setInteractive ( new Phaser.Geom.Rectangle( -csize/2, -csize/2, w, h ), Phaser.Geom.Rectangle.Contains );

        //..
        let rct = scene.add.rectangle ( -csize/2, -csize/2, w, h, 0xffffff, 0.5 ).setOrigin (0).setVisible (false);

        let ship = scene.add.image ( -csize/2, 0, 'fleet', attr.frm ).setOrigin ( 0, 0.5 ).setScale ( csize/80 );

        let txt = scene.add.text ( 20, 0, attr.type, { color:'#6e6e6e', fontSize:20, fontFamily : 'Oswald'}).setOrigin(0.5);

        this.add ([rct, ship, txt]);

        scene.add.existing(this);

        //..
        if ( rot == 1 ) this.changeOrientation ();


    }


    select ( selected = true )
    {
        this.isSelected = selected;

        if ( this.isSelected ) {

            this.first.setStrokeStyle ( 2, 0xff0000 );

        }else {
            this.first.setStrokeStyle (0);

        }
    }
    changeOrientation ()
    {

        this.isVertical = !this.isVertical;

        this.setRotation ( Phaser.Math.DegToRad ( this.isVertical ? 90 : 0 ));

        return this;
    }

    select ( selected = true ) 
    {
        this.isSelected = selected;

        this.first.setVisible ( selected );

        return this;
    }



}