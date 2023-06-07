import { Text, TextStyle, Application } from 'pixi.js';


const style = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 25,
    fontStyle: 'italic',
    fontWeight: 'bold',
    fill: ['#ffffff', 'red'], // gradient
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

export class FinishGoal {
    private app: Application<HTMLCanvasElement>;
    goalsModes: boolean = false;
    finishGraphic: Text;

    constructor(app : Application<HTMLCanvasElement>) {
        this.app = app;
        this.finishGraphic = new Text('Finish', style);
        this.finishGraphic.name = 'finish'

        app.view.addEventListener('mouseup', this.handleMc.bind(this));
    }

    private handleMc(event: any){
        if (!this.goalsModes) return;
        const { offsetX, offsetY } = event;

        this.finishGraphic.x = offsetX - this.finishGraphic.width / 2;
        this.finishGraphic.y = offsetY - this.finishGraphic.height / 2;

        this.app.stage.addChild(this.finishGraphic);
    }

    setGoalMode(toGoal: boolean) {
        this.goalsModes = toGoal;
    }

    destroyAll() {
        let st = this.app.stage.getChildByName('finish');
        if(st) this.app.stage.removeChild(st);
    }

}