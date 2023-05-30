import { Graphics, Container, Application } from 'pixi.js';

export const wallWidth = 10;
export class Building {
    private app: Application<HTMLCanvasElement>;

    // startPoint !== null means we have already captured the first click, and are ready for the second
    private startPoint: { x: number, y: number } | null;
    buildingMode: boolean;
    private editingUICont: Container;
    private startDot: Graphics;

    constructor(app : Application<HTMLCanvasElement>) {
        this.app = app;
        this.startPoint = null;
        this.buildingMode = false;

        this.editingUICont = new Container();
        this.editingUICont.x = 0;
        this.editingUICont.y = 0;
        this.app.stage.addChild(this.editingUICont);
        this.startDot = new Graphics();

        app.view.addEventListener('mousedown', this.handleMd.bind(this));
        app.view.addEventListener('mouseup', this.handleMu.bind(this));

    }

    private handleMd(event){
        if (!this.buildingMode) return;

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
    private handleMu(event){
        if (!this.buildingMode || !this.startPoint) return;


        const { offsetX, offsetY } = event;

        let endPoint = { x: offsetX, y: offsetY };

        // Draw the rectangle
        let cont = new Container();
        cont.name = 'wall'
        let wall = new Graphics();
        cont.addChild(wall);
        this.app.stage.addChild(cont);

        // create wall definitions
        let wallLength = Math.sqrt(
            Math.pow(endPoint.x - this.startPoint.x, 2) + Math.pow(endPoint.y - this.startPoint.y, 2));
        wall.beginFill('grey', 50);
        wall.drawRoundedRect(-wallWidth/2, -wallWidth/2, wallLength + wallWidth, wallWidth, 5);

        // define container location
        cont.x = this.startPoint.x;
        cont.y = this.startPoint.y;

        // find angle for rectangle
        wall.angle = Math.atan2(
            endPoint.y - this.startPoint.y,
            endPoint.x - this.startPoint.x) * (180 / Math.PI);

        this.resetBuild();
    }

    resetBuild() {
        this.startPoint = null;
        this.editingUICont.visible = false;
    }

    draw() {
        // if(startPoint)
    }

    setBuildingMode(toBuild: boolean) {
        this.buildingMode = toBuild;
    }

    destroyAll() {
        this.resetBuild()
        const walls = this.app.stage.children.filter(child => child.name === 'wall');

        walls.forEach(wall => {
            this.app.stage.removeChild(wall);
            wall.destroy();
        });
    }
}