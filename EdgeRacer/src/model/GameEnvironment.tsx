import { Application, Container, Graphics, Point } from "pixi.js";
import { Action, QState, EnvState } from "./envModels";
import { Building, Wall, WallCoordinate } from "../building";
import { Position, calcDist, calcVelocity, clamp, iPointDataToPosition, intersectionOfSegments } from "../mathHelpers";
import { StartingGoal } from "../startingGoal";
import { FinishGoal } from "../finishGoal";

// ------- Car Drivability Metrics --------
const carContName = 'carcont123';
const maxEyeDist = 10000;
const topVelo = 10;
const topAcceleration = 0.1;
const accelUnderBreaking = 0.5;
const passiveBreaking = 0.1;
const turnAccel = 0.3; // degrees per frame
const maxTurnRate = 6; // degrees per frame

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
            turningRate: 0,
        }

        this.app.stage.addChild(this.carCont);

        return this.currentState;
    }

    destroy(){
        if(this.carCont){
            this.app.stage.removeChild(this.carCont)
        }
        this.carCont = undefined;
        this.currentState = undefined;
        this.goalPosition = undefined;
    }

    // next step, should be called once per frame as each frame represents a step in the Q learning process
    step(action: Action): {
        state: QState,
        reward: number
    } {
        if (!this.carCont || !this.currentState || !this.goalPosition) {
            throw new Error('Please Call env.reset() to instantiated game');
        }
        // get reward
        let reward = this.getReward(this.currentState, action);

        // ------ computing new state -------
        // new velocity and angle of car after the action
        let newTelemetry = this.computeNewTelemetry(
            action,
            this.currentState.velocity,
            this.currentState.angle,
            this.currentState.turningRate);
        console.log(newTelemetry)

        // compute new position from new velocity and angle
        let resultantPos = this.calcPositionAfterMoving(
            this.currentState.position,
            newTelemetry.angle,
            newTelemetry.velocity);

        // ----- update to new state -----
        this.currentState = {
            ...this.getWallDeltasToAgent(this.carCont, this.wallsCords),
            angle: newTelemetry.angle,
            goalDelta: calcDist(resultantPos, this.goalPosition),
            position: resultantPos,
            velocity: newTelemetry.velocity,
            turningRate: newTelemetry.turningRate
        }

        //------ sync graphic ------
        this.syncCarContainer(this.currentState.position, this.currentState.angle);

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
    private computeNewTelemetry(action: Action,
        velocity: number,
        angle: number,
        turningRate: number) {
        let accel = 0;

        // 'return to zero' on no action
        if (action !== Action.ACCEL_LEFT && action !== Action.ACCEL_RIGHT) {
            if (action !== Action.ACCELERATE && action !== Action.BREAK) {
                if (velocity > passiveBreaking) {
                    accel = -passiveBreaking;
                } else {
                    accel = 0
                    velocity = 0
                }
            }
            if (action !== Action.LEFT_TURN && action !== Action.RIGHT_TURN) {
                // leave a gap for imprecision (0.1 + 0.2 = 0.30...01)
                if (turningRate > turnAccel) {
                    turningRate -= turnAccel;
                } else if (turningRate < -turnAccel) {
                    turningRate += turnAccel;
                } else {
                    turningRate = 0
                }
            }
        }

        // handle actiopns
        switch (action) {
            case Action.ACCELERATE: {
                console.log("Accelerating...");
                accel = topAcceleration;
            }
                break;
            case Action.BREAK: {
                console.log("Breaking...");
                accel = -accelUnderBreaking;
            }
                break;
            case Action.LEFT_TURN:
                console.log("Turning left...");
                turningRate = clamp(turningRate - turnAccel, -maxTurnRate, maxTurnRate);
                break;
            case Action.RIGHT_TURN:
                console.log("Turning right...");
                turningRate = clamp(turningRate + turnAccel, -maxTurnRate, maxTurnRate);
                break;
            case Action.ACCEL_LEFT:
                console.log("Accelerating and turning left...");
                accel = topAcceleration;
                turningRate = clamp(turningRate - turnAccel, -maxTurnRate, maxTurnRate);
                break;
            case Action.ACCEL_RIGHT:
                console.log("Accelerating and turning right...");
                accel = topAcceleration;
                turningRate = clamp(turningRate + turnAccel, -maxTurnRate, maxTurnRate);
                break;
            default: {
                console.log("No Input");
            }
        }
        return {
            velocity: clamp(velocity + accel, 0, topVelo),
            angle: angle + turningRate,
            turningRate
        }

    }
    // Sync the game state with the car container graphic on screen
    private syncCarContainer(pos: Position, angle: number) {
        if (!this.carCont) {
            throw new Error('carContainer is not instantiated');
        }

        this.carCont.x = pos.x;
        this.carCont.y = pos.y;
        this.carCont.angle = angle;
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
    private calcPositionAfterMoving(
        initialPosition: Position,
        angle: number, // in degrees
        velocity: number): Position {

        let rad = angle * (Math.PI / 180)

        const deltaX = velocity * Math.cos(rad);
        const deltaY = velocity * Math.sin(rad);

        return {
            x: initialPosition.x + deltaX,
            y: initialPosition.y + deltaY
        }
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