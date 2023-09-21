import { Application, Container, Graphics, Point } from "pixi.js";
import { Action, QState, EnvState } from "./envModels";
import { Building, Wall, WallCoordinate } from "../building";
import { Position, calcDist, calcPositionAfterMoving, calcVelocity, iPointDataToPosition, intersectionOfSegments } from "../mathHelpers";
import { StartingGoal } from "../startingGoal";
import { FinishGoal } from "../finishGoal";

const carContName = 'carcont123';
const maxEyeDist = 10000;
const topVelo = 50;
const topAcceleration = 5;
const accelStep = 0.1;
const breakingStep = 1;

// objects for finding the eye ends of the car
const centerEnd = new Point(500, 0);
const rightEnd = new Point(500, -250);
const leftEnd = new Point(500, 250);
// API for the game environment for the DQL to train with
export class GameEnvironment {
    private app: Application<HTMLCanvasElement>;
    private bc: Building
    private sgc: StartingGoal
    private fgc: FinishGoal
    private wallsCords: WallCoordinate[] = []

    // main globals we use to manipulate and record the state of the game
    private currentState: EnvState | undefined;
    private goalPosition: Position | undefined;
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

    // reset the environment, initialize all global variables like the walls and game state
    // create the car assets 
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
            ...this.getWallDeltasToAgent(this.carCont, this.wallsCords),
            goalDelta: calcDist(startingPosition, this.goalPosition),
            position: startingPosition,
            angle: 0,
            velocity: 0,
            acceleration: 0
        }

        this.app.stage.addChild(this.carCont);

        return this.currentState;
    }

    // next step 
    step(action: Action): {
        state: QState,
        reward: number
    } {
        if (!this.carCont || !this.currentState || !this.goalPosition) {
            throw new Error('Please Call env.reset() to instantiated game');
        }
        // get reward
        let reward = this.getReward(this.currentState, action);

        // apply action from state 
        let newAccel = this.currentState.acceleration;
        let newVelocty = this.currentState.velocity;
        switch (action) {
            case Action.ACCELERATE: {
                console.log("Accelerating...");

                // compute new speed metrics
                newAccel = Math.min(newAccel + accelStep, topAcceleration);
                newVelocty = Math.min(newAccel + newAccel, topVelo);

                // compute new position
                let { x, y } = calcPositionAfterMoving({
                    x: this.carCont.x,
                    y: this.carCont.y
                }, this.carCont.angle, newVelocty);

                //update position
                this.carCont.x = x
                this.carCont.y = y

                break;
            }
            case Action.BREAK: {
                console.log("Breaking...");

                // compute new speed metrics
                newAccel = Math.max(newAccel - breakingStep, -topAcceleration);
                newVelocty = Math.max(newAccel + newAccel, -topVelo);

                // compute new position
                let { x, y } = calcPositionAfterMoving({
                    x: this.carCont.x,
                    y: this.carCont.y
                }, this.carCont.angle, newVelocty);

                //update position
                this.carCont.x = x
                this.carCont.y = y
                break;
            }
            case Action.LEFT_TURN:
                console.log("Turning left...");
                break;
            case Action.RIGHT_TURN:
                console.log("Turning right...");
                break;
            case Action.ACCEL_LEFT:
                console.log("Accelerating and turning left...");
                break;
            case Action.ACCEL_RIGHT:
                console.log("Accelerating and turning right...");
                break;
            default: {
                console.log("No Input");

                // compute new speed metrics
                newAccel = Math.max(newAccel - accelStep, -topAcceleration);
                newVelocty = Math.max(newAccel + newAccel, 0);

                // compute new position
                let { x, y } = calcPositionAfterMoving({
                    x: this.carCont.x,
                    y: this.carCont.y
                }, this.carCont.angle, newVelocty);

                //update position
                this.carCont.x = x
                this.carCont.y = y
                break;
            }


        }

        // ----- get new state -----
        // get new position
        let resultantPos = {
            x: this.carCont.x,
            y: this.carCont.y,
        };

        // ----- update to new state -----
        this.currentState = {
            ...this.getWallDeltasToAgent(this.carCont, this.wallsCords),
            angle: this.carCont.angle,
            goalDelta: calcDist(resultantPos, this.goalPosition),
            position: resultantPos,
            velocity: newVelocty,
            acceleration: newAccel
        }

        // return new state and reward
        return {
            state: this.currentState,
            reward
        };
    }

    // ------------ pure functions -----------

    private getReward(state: QState, action: Action): number {
        return 0;
    }

    private getWallDeltasToAgent(carCont: Container, wallsCords: WallCoordinate[]) {
        //remove all debugs
        this.app.stage.children.filter(child => child.name === 'debug')
            .forEach(deb => {
                this.app.stage.removeChild(deb);
                deb.destroy();
            });


        let eyesEnds = {
            left: iPointDataToPosition(carCont.toGlobal(leftEnd)),
            center: iPointDataToPosition(carCont.toGlobal(centerEnd)),
            right: iPointDataToPosition(carCont.toGlobal(rightEnd)),
        }

        // find the closest walls to our eyes
        let closestFront = maxEyeDist;
        let closestLeft = maxEyeDist;
        let closestRight = maxEyeDist;
        let carPos = { x: carCont.x, y: carCont.y };
        for (let i = 0; i < wallsCords.length; i++) {
            let wall = wallsCords[i]

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
        car.drawEllipse(0, 0, 30, 10);
        carCont.addChild(car);

        // spawn in eye lines
        let midLine = new Graphics();
        midLine.lineStyle(2, 'blue', 0.5)
            .moveTo(0, 0)
            .lineTo(500, 0);
        carCont.addChild(midLine)

        let leftLine = new Graphics();
        midLine.lineStyle(2, 'blue', 0.5)
            .moveTo(0, 0)
            .lineTo(500, 250);
        carCont.addChild(leftLine)

        let rightLine = new Graphics();
        midLine.lineStyle(2, 'blue', 0.5)
            .moveTo(0, 0)
            .lineTo(500, -250);
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