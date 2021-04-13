class Ship extends Phaser.GameObjects.Container {

    constructor(scene, x, y, id, type, csize, len, rot ) {

        super(scene, x, y, [] );
        // ...

        this.w = csize * len;

        this.h = csize;

        this.id = id;
        
        this.type = type;

        this.isSelected = false;

        this.isVertical = false;

        
        this.setInteractive ( new Phaser.Geom.Rectangle( -csize/2, -csize/2, this.w, this.h ), Phaser.Geom.Rectangle.Contains );

        
        let rct = scene.add.rectangle ( -csize/2, -csize/2, this.w, this.h, 0xffffff, 0 ).setOrigin (0);

        let ship = scene.add.image ( -csize/2, -csize/2, 'fleet', id ).setOrigin ( 0 ).setScale ( csize/80 );

        this.add ([rct, ship]);

        scene.add.existing(this);


        if ( rot == 1 ) this.changeOrientation ();


    }
    
    changeOrientation ()
    {

        this.isVertical = !this.isVertical;
        
        this.setRotation ( Phaser.Math.DegToRad ( this.isVertical ? 90 : 0 ));
        
    }



}