import { Graphics, Container, DisplayObject, Application } from 'pixi.js';
import { wallWidth } from './building';

export class Eraser {
    private app: Application<HTMLCanvasElement>;
    eraseMode: boolean = false;

    constructor(app : Application<HTMLCanvasElement>) {
        this.app = app;
    }

    setEraseMode(toErase: boolean) {
        this.eraseMode = toErase;

        if (toErase) {
            const walls = this.getWalls();

            walls.forEach(this.attachListenersToWall.bind(this));
        } else {
            const walls = this.getWalls();
            walls.forEach(wall => {
                wall.eventMode = 'none';
                wall.removeAllListeners();
            });
        }
    }

    getWalls(): Graphics[] {
        return this.app.stage.children
            .filter(child => child.name === 'wall') as Graphics[];
    }

    attachListenersToWall(wall: Graphics) {
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