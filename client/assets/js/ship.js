class Ship extends Phaser.GameObjects.Container {

    constructor(scene, x, y, plyr, id, orgCell, rot, csize, len, type, frame, enabled ) {

        //frame, type, len
        super(scene, x, y, [] );
        // ..
        
        this.orgCell = orgCell;

        this.len = len;
        
        this.id = id;
        
        this.type = type;

        this.origin = {};

        this.lastClickTime = 0;

        this.isVertical = false;

        this.isSelected = true;

        //..
        var w = csize * len, h = csize;

        this.setName ( plyr + '_ship' + id );
        
        if ( enabled ) this.setInteractive ( new Phaser.Geom.Rectangle( -csize/2, -csize/2, w, h ), Phaser.Geom.Rectangle.Contains );

        //..
        let rct = scene.add.rectangle ( -csize/2, -csize/2, w, h, 0x99ff99, 0.5 ).setOrigin (0);

        let ship = scene.add.image ( -csize/2, 0, 'fleet', frame ).setOrigin ( 0, 0.5 ).setScale ( csize/80 );

        let txt = scene.add.text ( 20, 0, type, { color:'#6e6e6e', fontSize:20, fontFamily : 'Oswald'}).setOrigin(0.5);

        this.add ([rct, ship, txt]);

        scene.add.existing(this);

        //..
        if ( rot == 1 ) this.changeOrientation ();


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