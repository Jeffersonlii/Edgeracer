import { Graphics, Container, Application } from 'pixi.js';
import { Position } from './mathHelpers';

export const wallWidth = 10;
// wrapper class for a walls
export class Wall extends Graphics {
    endX!: number;
    endY!: number;
}
export interface WallCoordinate {
    startPos: Position;
    endPos: Position;
}
const wallname = 'wall123';
const borderWallName = 'borderwall123';
export class Building implements ControlInterface {
    private app: Application<HTMLCanvasElement>;

    // startPoint !== null means we have already captured the first click, and are ready for the second
    private startPoint: Position | null;
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
    htmlFormValue: string = 'buildWall';

    private handleMd = (event: any) => {
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
    private handleMu = (event: any) => {
        if (!this.startPoint) return;

        const { offsetX, offsetY } = event;

        let endPoint = { x: offsetX, y: offsetY };

        this.buildWall(this.startPoint, endPoint, wallname);

        this.resetBuildUI();
    }

    private buildWall(startPoint: Position, endPoint: Position, name: string) {
        // Draw the rectangle / wall line
        let wall = new Wall();
        wall.name = name;
        this.app.stage.addChild(wall);

        // create wall definitions
        let wallLength = Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
        wall.beginFill('grey', 50);
        wall.drawRoundedRect(-wallWidth / 2, -wallWidth / 2, wallLength + wallWidth, wallWidth, 5);

        // define container location
        wall.x = startPoint.x;
        wall.y = startPoint.y;
        wall.endX = endPoint.x;
        wall.endY = endPoint.y;

        // find angle for rectangle
        wall.angle = Math.atan2(
            endPoint.y - startPoint.y,
            endPoint.x - startPoint.x) * (180 / Math.PI);
    }

    // create 4 border walls 
    createBorderWalls() {
        const screenWidth = this.app.renderer.width;
        const screenHeight = this.app.renderer.height;
                
        this.buildWall({x:0, y:0}, {x:0, y:screenHeight}, borderWallName);
        this.buildWall({x:0, y:0}, {x:screenWidth, y:0}, borderWallName);
        this.buildWall({x:screenWidth, y:screenHeight}, {x:screenWidth,y:0}, borderWallName);
        this.buildWall({x:screenWidth, y:screenHeight}, {x:0,y:screenHeight}, borderWallName);
    }
    destroyBorderWalls(){
        const walls = this.app.stage.children.filter(child => child.name === borderWallName);

        walls.forEach(wall => {
            this.app.stage.removeChild(wall);
            wall.destroy();
        });
    }

    private resetBuildUI() {
        this.startPoint = null;
        this.editingUICont.visible = false;
    }

    setActive(isActive: boolean) {
        if (isActive) {
            this.app.view.addEventListener('mousedown', this.handleMd);
            this.app.view.addEventListener('mouseup', this.handleMu);
        } else {
            this.app.view.removeEventListener('mousedown', this.handleMd);
            this.app.view.removeEventListener('mouseup', this.handleMu);
        }
    }

    destroyAll() {
        this.resetBuildUI()
        const walls = this.getAllWalls();

        walls.forEach(wall => {
            this.app.stage.removeChild(wall);
            wall.destroy();
        });
    }

    getAllWallPos(): WallCoordinate[] {
        let wallsList = this.getAllWalls() as Wall[]
        return wallsList.map(
            (wall: Wall) => ({
                startPos: {
                    x: wall.x,
                    y: wall.y
                },
                endPos: {
                    x: wall.endX,
                    y: wall.endY
                }
            }))
    }

    // todo : replace with proximity walls, only walls in the sectore of the car 
    getAllWalls(): Graphics[]{
        return this.app.stage.children
            .filter(child => child.name === wallname ||
                child.name === borderWallName ) as Graphics[];
    }

    createMap(map: WallCoordinate[]){
        map.forEach((wall : WallCoordinate)=>{
            this.buildWall(wall.startPos, wall.endPos, wallname)
        })
    }
}

