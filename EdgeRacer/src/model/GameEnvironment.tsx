import { Application, Container, Graphics, Point } from "pixi.js";
import { Action, QState, EnvState } from "./envModels";
import { Building, Wall } from "../building";
import { Position, calcDist, iPointDataToPosition, intersectionOfSegments } from "../mathHelpers";
import { StartingGoal } from "../startingGoal";
import { FinishGoal } from "../finishGoal";

const carContName = 'carcont123';

const maxEyeDist = 10000;

// objects for finding the eye ends of the car
const centerEnd = new Point(0, 500);
const rightEnd = new Point(-250, 500);
const leftEnd = new Point(250, 500);
// API for the game environment for the DQL to train with
export class GameEnvironment {
    private app: Application<HTMLCanvasElement>;
    private bc: Building
    private sgc: StartingGoal
    private fgc: FinishGoal
    private wallsCords: {
        startPos: Position;
        endPos: Position;
    }[] = []

    // main globals we use to manipulate and record the state of the game
    private currentState!: EnvState;
    private goalPosition!: Position;
    private carCont: Container | undefined;

    constructor(
        app: Application<HTMLCanvasElement>,
        buildingComponent: Building,
        sgoalsComponent: StartingGoal,
        fgoalsComponent: FinishGoal) {
        this.app = app;
        this.bc = buildingComponent;
        this.sgc = sgoalsComponent;
        this.fgc = fgoalsComponent;
    }   

    reset(): QState {
        // clean up cars
        const cars = this.app.stage.children.filter(child => child.name === carContName);
        cars.forEach(car => {
            this.app.stage.removeChild(car);
            car.destroy();
        });

        this.goalPosition = this.fgc.getPosition();
        // get all wall lines to calculate collisions against
        this.wallsCords = this.bc.getAllWallPos();
        let startingPosition = this.sgc.getPosition();

        // create car 
        this.carCont = this.setupNewCar(startingPosition);

        // init current state
        this.currentState = {
            ...this.getWallDeltasToAgent(startingPosition),
            goalDelta: calcDist(startingPosition, this.goalPosition),
            position: startingPosition,
            angle: 0,
            velocity: 0
        }

        this.app.stage.addChild(this.carCont);

        return this.currentState;
    }

    // next step 
    step(action: Action): {
        state: QState,
        reward: number
    } {
        // todo better way to handle this
        if (!this.carCont) {
            throw new Error('Car Container is undefined');
        }

        // get reward
        let reward = this.getReward(this.currentState, action);

        // apply action from state 

        // ----- get new state -----
        // get new position
        // get new angle 
        this.carCont.angle += 1;

        // ----- update to new state
        this.currentState = {
            ...this.currentState,
            ...this.getWallDeltasToAgent(),
            angle: this.carCont.angle,
        }

        // return new state and reward
        return {
            state: this.currentState,
            reward
        };
    }

    getReward(state: QState, action: Action): number {
        return 0;
    }

    private getWallDeltasToAgent(position?: Position) {
        //remove all debugs
        this.app.stage.children.filter(child => child.name === 'debug')
        .forEach(deb => {
            this.app.stage.removeChild(deb);
            deb.destroy();
        });

        if (!this.carCont) {
            throw new Error('Car Container is undefined');
        }
        let eyesEnds = {
            left: iPointDataToPosition(this.carCont.toGlobal(leftEnd)),
            center: iPointDataToPosition(this.carCont.toGlobal(centerEnd)),
            right: iPointDataToPosition(this.carCont.toGlobal(rightEnd)),
        }

        // find the closest walls to our eyes
        let closestFront = maxEyeDist;
        let closestLeft = maxEyeDist;
        let closestRight = maxEyeDist;
        let carPos = position ?? this.currentState.position;
        console.log(this.wallsCords)
        for (let i = 0; i < this.wallsCords.length; i++) {
            let wall = this.wallsCords[i]

            // test front 
            let frontCollisionPoint = intersectionOfSegments(carPos, eyesEnds.center,
                wall.startPos, wall.endPos)
            if (frontCollisionPoint) { // if there is a collision
                this.paintDebug(frontCollisionPoint.x, frontCollisionPoint.y);

                let distToWall = calcDist(carPos, frontCollisionPoint);
                closestFront = Math.min(closestFront, distToWall);
            }

            // test left 
            let leftCollisionPoint = intersectionOfSegments(carPos, eyesEnds.left,
                wall.startPos, wall.endPos)
            if (leftCollisionPoint) { // if there is a collision
                this.paintDebug(leftCollisionPoint.x, leftCollisionPoint.y);

                let distToWall = calcDist(carPos, leftCollisionPoint);
                closestLeft = Math.min(closestLeft, distToWall);
            }

            // test right 
            let rightCollisionPoint = intersectionOfSegments(carPos, eyesEnds.right,
                wall.startPos, wall.endPos)
            if (rightCollisionPoint) { // if there is a collision
                this.paintDebug(rightCollisionPoint.x, rightCollisionPoint.y);

                let distToWall = calcDist(carPos, rightCollisionPoint);
                closestRight = Math.min(closestRight, distToWall);
            }
        }
        return {
            frontDelta: closestFront,
            leftfrontDelta: closestLeft,
            rightfrontDelta: closestRight,
        };
    }

    private setupNewCar(position: Position): Container {
        let carCont = new Container();
        carCont.name = carContName;
        let car = new Graphics();

        // set container position
        carCont.x = position.x;
        carCont.y = position.y;

        // spawn in car graphic
        car.clear()
        car.beginFill('red', 50);
        car.drawEllipse(0, 0, 10, 30);
        carCont.addChild(car);

        // spawn in eye lines
        let midLine = new Graphics();
        midLine.lineStyle(2, 'blue', 0.5)
            .moveTo(0, 0)
            .lineTo(0, 500);
        carCont.addChild(midLine)

        let leftLine = new Graphics();
        midLine.lineStyle(2, 'blue', 0.5)
            .moveTo(0, 0)
            .lineTo(250, 500);
        carCont.addChild(leftLine)

        let rightLine = new Graphics();
        midLine.lineStyle(2, 'blue', 0.5)
            .moveTo(0, 0)
            .lineTo(-250, 500);
        carCont.addChild(rightLine)

        return carCont;
    }
    private paintDebug(x: number, y: number) {
        let debug = new Graphics()
        debug.clear()
        debug.beginFill('red', 100);
        debug.drawEllipse(x, y, 5, 5);
        debug.name = 'debug'

        this.app.stage.addChild(debug);
    }
}