class Cells extends Phaser.GameObjects.Container {

    constructor(scene, x, y, id, plyr, cz ) {

        //frame, type, len
        super(scene, x, y, [] );

        this.setSize ( cz, cz ).setName ( plyr + '_cell' + id );

        this.id = id;

        this.isClicked = false;

        var img = scene.add.image ( 0, 0, 'cell');

        this.add (img)

        
        this.on('pointerover', function () {
            img.setTint(0xffff99);
        });
        this.on('pointerout', function () {
            img.clearTint();
        });
        this.on('pointerdown', function () {
            img.setTint(0xffffff);
        });
        this.on('pointerup', function () {
            //..
        });


        scene.add.existing(this);

    }

    enable ( active = true ) 
    {
        if ( active ) {
           if ( !this.isClicked ) this.setInteractive ();
        }else {
            this.disableInteractive ();
        }

        return this;
    }

    clicked () 
    {
        
        this.first.clearTint ();

        this.isClicked = true;

        return this;

    }
}
        
        