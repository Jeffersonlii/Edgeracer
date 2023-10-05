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
    private finishGraphic: Text;
    private goalPosition: Position | undefined;

    constructor(app : Application<HTMLCanvasElement>) {
        this.app = app;
        this.finishGraphic = new Text('Finish', style);
        this.finishGraphic.name = 'finish';
    }
    htmlFormValue: string = 'addFinishLine';

    private handleMc = (event: any) => {
        const { offsetX, offsetY } = event;
        const pos = {x:offsetX, y:offsetY};
        this.goalPosition = pos;
        this.updateGraphic(pos);
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

    getPosition() : Position | undefined {
        return this.goalPosition;
    }

    getBounds(){
        return {
            x: this.finishGraphic.x,
            y: this.finishGraphic.y,
            width: this.finishGraphic.width,
            height: this.finishGraphic.height,
        }
    }
    private updateGraphic(pos: Position){
        this.finishGraphic.x = pos.x - this.finishGraphic.width / 2;
        this.finishGraphic.y = pos.y - this.finishGraphic.height / 2;
        this.app.stage.addChild(this.finishGraphic);
    }
    setPosition(position: Position){
        this.goalPosition = position;
        this.updateGraphic(position);
    }
}