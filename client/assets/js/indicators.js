class Indicator extends Phaser.GameObjects.Container {

    constructor(scene, x, y, id, username, withTimer = false ) {

        super( scene, x, y, [] );

        this.setName (id);

        this.username = username;

        this.id = id;

        this.withTimer = withTimer;

        this.timerIsOn = false;

        let img = this.scene.add.image ( 0, 0, 'pind');

        let name = this.scene.add.text (-240, -20, username, { fontSize: 34, fontFamily:'Oswald', color: '#838383' }).setOrigin (0, 0.5);

        let wins = this.scene.add.text (-240, 20, 'Win : 0', { fontSize: 28, fontFamily:'Oswald', color: '#9f9f9f' }).setOrigin (0, 0.5);

        let rev = this.scene.add.image (235, -15, 'inds', 4 ).setVisible (false); //setScale (0.9);

        let state = this.scene.add.image (280, -15, 'inds', 0 );//.setScale (0.9);

        this.add ( [ img, name, wins, rev, state]);


        if ( withTimer ) {

            var graphics = this.scene.add.graphics();

            graphics.fillStyle(0x66ff66, 1);

            graphics.fillCircleShape( new Phaser.Geom.Circle( -202, 0, 32 ));

            this.add ( graphics );

        }

        scene.add.existing(this);

    }

    setWins ( win ) {

        const str = ( win > 1 ) ? 'Wins' : 'Win';

        this.getAt(2).setText ( str + " : " + win );

    }

    showReveal ( show = true ) {
        
        this.getAt ( 3 ).setVisible ( show );

        if ( show ) {
            this.scene.add.tween ({
                targets : this.getAt(3),
                alpha : 0,
                duration : 200,
                yoyo : true,
                ease : 'Power3',
                repeat : 5
            });
        }
    }

    ready () {

        this.getAt(4).setFrame ( 1 );

        if ( this.withTimer ) this.showTimer (false);
        
    }

    setTurn ( on = false ) {

        this.getAt(4).setFrame ( !on ? 2 : 3 );

        if ( this.withTimer) this.showTimer ( on );

    }

    reset () 
    {

        this.getAt ( 3 ).setVisible (false);

        this.getAt ( 4 ).setFrame (0);

    }

    showTimer ( show = true ) {
        
        if ( !show ) {

            this.last.clear ();

        }else {

            this.last.clear ();

            this.last.fillStyle(0x66ff66, 1);

            this.last.fillCircleShape( new Phaser.Geom.Circle( -202, 0, 32 ));

        }
        
    
    }

    tick ( progress ) {

        this.last.clear ();
        
        var clr;

        if ( progress < 0.3 ) {
            clr = 0x66ff66;
        }else if ( progress >= 0.3 && progress < 0.7 ) {
            clr = 0xffff33;
        }else {
            clr = 0xff6666;
        }

        this.last.fillStyle( clr, 1 );

        this.last.slice(-202, 0, 32, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(270 + Math.floor ( 360 * progress ) ), true);

        this.last.fillPath();

        //this.last.closePath();

    }

    
}