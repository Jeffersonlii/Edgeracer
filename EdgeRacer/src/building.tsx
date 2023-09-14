import { Graphics, Container, Application } from 'pixi.js';

export const wallWidth = 10;
// wrapper class for a walls
export class Wall extends Graphics {
    endX!: number;
    endY!: number;
}

export class Building {
    private app: Application<HTMLCanvasElement>;

    // startPoint !== null means we have already captured the first click, and are ready for the second
    private startPoint: { x: number, y: number } | null;
    private editingUICont: Container;
    private startDot: Graphics;

    constructor(app: Application<HTMLCanvasElement>) {
        this.app = app;
        this.startPoint = null;

        this.editingUICont = new Container();
        this.editingUICont.x = 0;
        this.editingUICont.y = 0;
        this.app.stage.addChild(this.editingUICont);
        this.startDot = new Graphics();
    }

    handleMd = (event: any) => {
        // if (!this.buildingMode) return;

        const { offsetX, offsetY } = event;

        // Store the coordinates of the first click
        this.startPoint = { x: offsetX, y: offsetY };

        // enable editing ui
        this.editingUICont.visible = true;
        this.startDot.clear();
        this.startDot.beginFill('green', 50);
        this.startDot.drawCircle(offsetX, offsetY, 5);

        this.editingUICont.addChild(this.startDot);
    }
    handleMu = (event: any) => {
        if (!this.startPoint) return;

        const { offsetX, offsetY } = event;

        let endPoint = { x: offsetX, y: offsetY };

        // Draw the rectangle / wall line
        let wall = new Wall();
        wall.name = 'wall';
        this.app.stage.addChild(wall);

        // create wall definitions
        let wallLength = Math.sqrt(
            Math.pow(endPoint.x - this.startPoint.x, 2) + Math.pow(endPoint.y - this.startPoint.y, 2));
        wall.beginFill('grey', 50);
        wall.drawRoundedRect(-wallWidth / 2, -wallWidth / 2, wallLength + wallWidth, wallWidth, 5);

        // define container location
        wall.x = this.startPoint.x;
        wall.y = this.startPoint.y;
        wall.endX = endPoint.x;
        wall.endY = endPoint.y;

        // find angle for rectangle
        wall.angle = Math.atan2(
            endPoint.y - this.startPoint.y,
            endPoint.x - this.startPoint.x) * (180 / Math.PI);

        this.resetBuildUI();
    }

    resetBuildUI() {
        this.startPoint = null;
        this.editingUICont.visible = false;
    }

    setBuildingMode(toBuild: boolean) {
        if (toBuild){
            this.app.view.addEventListener('mousedown', this.handleMd);
            this.app.view.addEventListener('mouseup', this.handleMu);
        }else{
            this.app.view.removeEventListener('mousedown', this.handleMd);
            this.app.view.removeEventListener('mouseup', this.handleMu);
        }
    }

    destroyAll() {
        this.resetBuildUI()
        const walls = this.app.stage.children.filter(child => child.name === 'wall');

        walls.forEach(wall => {
            this.app.stage.removeChild(wall);
            wall.destroy();
        });
    }
}

