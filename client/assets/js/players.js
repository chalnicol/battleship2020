class Player {

    constructor (id, username, isAI )
    {
        this.id = id;

        this.username = username;

        this.isAI = isAI;

        this.fleet = [];

        this.isReady = false;

        this.shotsFired = [];

        for ( var i = 0; i < 100; i++ ) {
            this.shotsFired.push (i);
        }

    }





}