class Ship extends Phaser.GameObjects.Container {

    constructor(scene, x, y, id, type, bsize, len ) {

        super(scene, x, y, [] );
        // ...

        this.w = bsize * len;

        this.h = bsize;

        this.id = id;
        
        this.type = type;

        this.isSelected = false;

        this.isVertical = false;
        
        this.setInteractive ( new Phaser.Geom.Rectangle( -bsize/2, -bsize/2, this.w, this.h ), Phaser.Geom.Rectangle.Contains );

        
        let rct = scene.add.rectangle ( -bsize/2, -bsize/2, this.w, this.h, 0xffffff, 1 ).setOrigin (0);

        let ship = scene.add.image ( -bsize/2, -bsize/2, 'fleet', id ).setOrigin ( 0 );

        this.add ([rct, ship]);

        scene.add.existing(this);



    }
    
    changeOrientation ()
    {

        this.isVertical = !this.isVertical;

        const deg = this.isVertical ? 90 : 0;
        

        this.setRotation ( Phaser.Math.DegToRad ( deg ));
        
    }



}