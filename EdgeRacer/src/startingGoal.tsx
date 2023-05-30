import { Text, TextStyle, Application } from 'pixi.js';


const style = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 25,
    fontStyle: 'italic',
    fontWeight: 'bold',
    fill: ['#ffffff', '#00ff99'], // gradient
    stroke: '#4a1850',
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: true,
    wordWrapWidth: 440,
    lineJoin: 'round',
});

export class StartingGoal {
    private app: Application<HTMLCanvasElement>;
    goalsModes: boolean;
    startGraphic: Text;

    constructor(app : Application<HTMLCanvasElement>) {
        this.app = app;
        this.startGraphic = new Text('Start', style);
        this.startGraphic.name = 'start'

        app.view.addEventListener('mouseup', this.handleMc.bind(this));
    }

    private handleMc(event){
        if (!this.goalsModes) return;
        const { offsetX, offsetY } = event;

        this.startGraphic.x = offsetX - this.startGraphic.width / 2;
        this.startGraphic.y = offsetY - this.startGraphic.height / 2;

        this.app.stage.addChild(this.startGraphic);
    }

    setGoalMode(toGoal: boolean) {
        this.goalsModes = toGoal;
    }

    destroyAll() {
        let st = this.app.stage.getChildByName('start');
        if(st) this.app.stage.removeChild(st);
    }

}