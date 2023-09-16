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

export class StartingGoal implements ControlInterface{
    private app: Application<HTMLCanvasElement>;
    startGraphic: Text;

    constructor(app : Application<HTMLCanvasElement>) {
        this.app = app;
        this.startGraphic = new Text('Start', style);
        this.startGraphic.name = 'start'

    }
    htmlFormValue: string = 'addStartLine';

    private handleMc = (event: { offsetX: any; offsetY: any; }) => {
        const { offsetX, offsetY } = event;

        this.startGraphic.x = offsetX - this.startGraphic.width / 2;
        this.startGraphic.y = offsetY - this.startGraphic.height / 2;

        this.app.stage.addChild(this.startGraphic);
    }

    setActive(isActive: boolean) {
        if(isActive){
            this.app.view.addEventListener('mouseup', this.handleMc);
        }else{
            this.app.view.removeEventListener('mouseup', this.handleMc);
        }
    }

    destroyAll() {
        let st = this.app.stage.getChildByName('start');
        if(st) this.app.stage.removeChild(st);
    }

    exists(){
        return !! this.app.stage.getChildByName('start');
    }

    getPosition(){
        return {
            x: this.startGraphic.x + this.startGraphic.width / 2,
            y: this.startGraphic.y + this.startGraphic.height / 2};
    }
}