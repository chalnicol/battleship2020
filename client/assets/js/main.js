
window.onload = function () {
  
    const config = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.FIT,
            parent: 'game_div',
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 1920,
            height: 1080
        },
        backgroundColor: '#f3f3f3',
        scene: [ Preloader, SceneA ]
    };

    new Phaser.Game(config);

} 
