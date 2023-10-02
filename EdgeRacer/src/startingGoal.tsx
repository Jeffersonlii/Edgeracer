import { Text, TextStyle, Application } from 'pixi.js';
import { Position } from './mathHelpers';


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

let name = 'start';

export class StartingGoal implements ControlInterface {
    private app: Application<HTMLCanvasElement>;
    private startGraphic: Text;
    private startPosition: Position | undefined;

    constructor(app: Application<HTMLCanvasElement>) {
        this.app = app;
        this.startGraphic = new Text('Start', style);
        this.startGraphic.name = name

    }
    htmlFormValue: string = 'addStartLine';

    private handleMc = (event: { offsetX: any; offsetY: any; }) => {
        const { offsetX, offsetY } = event;
        const pos = { x: offsetX, y: offsetY };
        this.startPosition = pos;
        this.updateGraphic(pos);
    }

    setActive(isActive: boolean) {
        if (isActive) {
            this.app.view.addEventListener('mouseup', this.handleMc);
        } else {
            this.app.view.removeEventListener('mouseup', this.handleMc);
        }
    }

    destroyAll() {
        let st = this.app.stage.getChildByName(name);
        if (st) this.app.stage.removeChild(st);
    }

    exists() {
        return !!this.app.stage.getChildByName(name);
    }

    getPosition() {
        return this.startPosition;

    }

    private updateGraphic(pos: Position) {
        this.startGraphic.x = pos.x - this.startGraphic.width / 2;
        this.startGraphic.y = pos.y - this.startGraphic.height / 2;
        this.app.stage.addChild(this.startGraphic);
    }

    setPosition(position: Position) {
        this.startPosition = position;
        this.updateGraphic(position)
    }
}