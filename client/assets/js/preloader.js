
class Preloader extends Phaser.Scene {

    constructor ()
    {
        super('Preloader');
    }
    preload ()
    {

        this.gw = this.game.config.width;
        
        this.gh = this.game.config.height;

        this.add.text ( this.gw/2, this.gh/2, '', { fontSize: 36, fontFamily:'Oswald', color:'#fff'}).setOrigin(0.5);

        let txt = this.add.text (this.gw/2, 500, 'Loading : 0%', { color:'#333', fontFamily:'Oswald', fontSize:34 }).setOrigin(0.5);

        //..

        let brct = this.add.rectangle ( (this.gw - 350 )/2, 560, 350, 40 ).setStrokeStyle (3, 0x0a0a0a).setOrigin(0, 0.5);
        //..
        let rW = 340, rH = 30;

        let rct = this.add.rectangle ( (this.gw - rW)/2, 560, 5, rH, 0x6a6a6a, 1 ).setOrigin(0, 0.5);

        this.load.on ('complete', function () {
            this.scene.start('SceneA');
        }, this);

        this.load.on ('progress', function (progress) {

            txt.setText ( 'Loading : ' + Math.ceil( progress * 100 ) + '%' );

            if ( (rW * progress) > 5) rct.setSize ( rW * progress, rH );

        });

        this.load.image('pind', 'client/assets/images/playerindicator.png');
        
        this.load.spritesheet('fleet', 'client/assets/images/fleet.png', { frameWidth: 400, frameHeight: 90 });

        // this.load.audioSprite('sfx', 'client/assets/sfx/fx_mixdown.json', [
        //     'client/assets/sfx/sfx.ogg',
        //     'client/assets/sfx/sfx.mp3'
        // ]);

        // this.load.audio ('bgsound', ['client/assets/sfx/puzzlebg.ogg', 'client/assets/sfx/puzzlebg.mp3'] );

        // this.load.audio ('bgsound2', ['client/assets/sfx/puzzlebg2.ogg', 'client/assets/sfx/puzzlebg2.mp3'] );


    }
    

}