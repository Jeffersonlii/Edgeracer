import { Text, TextStyle, Application } from 'pixi.js';
import { Position } from './mathHelpers';


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

export class FinishGoal implements ControlInterface{
    private app: Application<HTMLCanvasElement>;
    finishGraphic: Text;

    constructor(app : Application<HTMLCanvasElement>) {
        this.app = app;
        this.finishGraphic = new Text('Finish', style);
        this.finishGraphic.name = 'finish';
    }
    htmlFormValue: string = 'addFinishLine';

    private handleMc = (event: any) => {
        const { offsetX, offsetY } = event;

        this.finishGraphic.x = offsetX - this.finishGraphic.width / 2;
        this.finishGraphic.y = offsetY - this.finishGraphic.height / 2;

        this.app.stage.addChild(this.finishGraphic);
    }

    setActive(isActive: boolean) {
        if(isActive){
            this.app.view.addEventListener('mouseup', this.handleMc);
        }else{
            this.app.view.removeEventListener('mouseup', this.handleMc);
        }
    }

    destroyAll() {
        let st = this.app.stage.getChildByName('finish');
        if(st) this.app.stage.removeChild(st);
    }

    exists(){
        return !! this.app.stage.getChildByName('finish');
    }

    getPosition() : Position{
        return {
            x: this.finishGraphic.x + this.finishGraphic.width / 2,
            y: this.finishGraphic.y + this.finishGraphic.height / 2};
    }
}