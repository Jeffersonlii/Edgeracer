import { Graphics, Container, DisplayObject, Application } from 'pixi.js';
import { Building, wallWidth } from './building';

export class Eraser implements ControlInterface{
    private app: Application<HTMLCanvasElement>;
    private bc : Building;
    constructor(
        app : Application<HTMLCanvasElement>,
        buildingComponent: Building) {
        this.app = app;
        this.bc = buildingComponent;
    }
    htmlFormValue: string = 'eraseWall';

    setActive(isActive: boolean) {
        const walls = this.bc.getAllWalls();
        if (isActive) {
            walls.forEach(this.attachListenersToWall);
        } else {
            walls.forEach(wall => {
                wall.eventMode = 'none';
                wall.removeAllListeners();
            });
        }
    }
    destroyAll: () => void = ()=>{};

    attachListenersToWall = (wall: Graphics) => {
        wall.eventMode = 'static';
        const border = new Graphics();
        wall.addChild(border);

        wall.on('mouseover', () => {
            border.lineStyle(1, 0xff0000);
            const margin = 4
            border.pivot.x = wallWidth / 2
            border.pivot.y = wallWidth / 2
            border.drawRoundedRect(-(margin / 2), -(margin / 2), wall.width + margin, wall.height + margin, 5);
        });

        wall.on('mouseout', () => {
            border.clear();
        });

        wall.on('click', () => {
            this.erase(wall);
        });
    }

    erase(wall: Graphics) {
        this.app.stage.removeChild(wall);
        wall.destroy();
    }

}