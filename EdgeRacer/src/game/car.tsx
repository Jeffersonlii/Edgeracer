import { Application, Container, DisplayObject, Graphics, Point } from "pixi.js";
import { Position } from "../mathHelpers";

const carContName = 'carcont';
const carName = 'car123';

export interface InitialState {
    pos: Position
    angle: number,
        width: number,
        height: number
}
export class Car {
    private app: Application<HTMLCanvasElement>;
    private initialState: InitialState;
    private carCont: Container<DisplayObject> | undefined;
    private name: string;

    constructor(app: Application<HTMLCanvasElement>,
        initialState: InitialState,
        id:number) {
        this.app = app;
        this.initialState = initialState;
        this.name = `${carContName}${id}`;
    }

    addCarToScene() {
        this.carCont = this.setupNewCar(this.initialState);

        this.app.stage.addChild(this.carCont);
    }
    removeCarFromScene() {
        const cars = this.app.stage.children.filter(child => child.name === this.name);
        cars.forEach(car => {
            this.app.stage.removeChild(car);
            car.destroy();
        });
    }
    updateCarPosition(pos: Position, angle: number) {
        if (!this.carCont) {
            throw new Error('carContainer is not instantiated');
        }

        this.carCont.x = pos.x;
        this.carCont.y = pos.y;
        this.carCont.angle = angle;
    }

    private setupNewCar(s : InitialState): Container {
        let carCont = new Container();
        carCont.name = this.name;
        let car = new Graphics();

        // set container position
        carCont.x = s.pos.x;
        carCont.y = s.pos.y;
        carCont.angle = s.angle;
        // spawn in car graphic
        car.clear()
        car.beginFill('red', 50);
        car.drawEllipse(0, 0, s.width, s.height);
        car.name = carName;

        carCont.addChild(car);

        return carCont;
    }
}