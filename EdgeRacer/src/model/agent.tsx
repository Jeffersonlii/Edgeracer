import { Application, Container, Graphics, IPointData, Point } from "pixi.js";
import { State } from "./typeModels";
import { Position, calcDist, calcVelocity, intersectionOfSegments } from "../mathHelpers";
import { Wall } from "../building";

interface CarTelemetry {
    position: Position;
    prePosition: Position;
    angle: number;
    eyesEnds: {
        left: Position,
        center: Position,
        right: Position
    }
}

const maxEyeDist = 10000;

export class Agent {

    // cur time alive
    private currentState: State;
    private carCont: Container;
    private car: Graphics;
    private app: Application<HTMLCanvasElement>;

    // position of agent at last frame (for accel / velocity calculations)
    private prePosition: Position;

    // current agent position
    private position: Position;

    // goal position
    private goalPosition: Position;

    constructor(app: Application<HTMLCanvasElement>, gameRules: {
        startPosition: Position;
        goalPosition: Position;
    }, lastNN: any) {
        this.app = app;
        this.prePosition = gameRules.startPosition;
        this.position = gameRules.startPosition;
        this.goalPosition = gameRules.goalPosition;
        //init current state

        // todo use a container instead
        // attach infinite 'rays' to the graphic 
        // collision test rays to walls, treating the walls as lines 
        this.carCont = new Container();
        this.car = new Graphics();
        this.app.stage.addChild(this.carCont);
    }

    spawnAndTrain() {
        console.log(this.position)

        this.setupCar();
        let centerEnd = new Point(0, 500);
        let rightEnd = new Point(-250, 500);
        let leftEnd = new Point(250, 500);

        console.log("fps is " + this.app.ticker.FPS);
        // train in loop 

        // this.app.ticker.maxFPS = 1;
        this.app.ticker.add(() => {

            //remove all debugs
            this.app.stage.children.filter(child => child.name === 'debug')
                .forEach(deb => {
                    this.app.stage.removeChild(deb);
                    deb.destroy();
                });


            this.carCont.angle += 1;

            // save the starting position of the car
            let startingPosition: Position = { ...this.position }

            // get current NN state 
            let beforeState = this.getCurNNState(this.app, {
                position: this.position,
                prePosition: this.prePosition,
                angle: this.carCont.angle,
                eyesEnds: {
                    left: this.iPointDataToPosition(this.carCont.toGlobal(leftEnd)),
                    center: this.iPointDataToPosition(this.carCont.toGlobal(centerEnd)),
                    right: this.iPointDataToPosition(this.carCont.toGlobal(rightEnd)),
                }
            }, this.goalPosition);

            console.log(beforeState);
            // get action from NN 

            // perform action => get new state AND REWARD

            // update NN with reward 

            // update Agent telemetry

        });
    }

    private iPointDataToPosition(d: IPointData): Position {
        return {
            x: d.x,
            y: d.y
        }
    }

    private setupCar() {
        // set container position
        this.carCont.x = this.position.x;
        this.carCont.y = this.position.y;

        // spawn in car graphic
        this.car.clear()
        this.car.beginFill('red', 50);
        this.car.drawEllipse(0, 0, 10, 30);
        this.carCont.addChild(this.car);

        // spawn in eye lines
        let midLine = new Graphics();
        midLine.lineStyle(2, 'blue', 0.5)
            .moveTo(0, 0)
            .lineTo(0, 500);
        this.carCont.addChild(midLine)

        let leftLine = new Graphics();
        midLine.lineStyle(2, 'blue', 0.5)
            .moveTo(0, 0)
            .lineTo(250, 500);
        this.carCont.addChild(leftLine)

        let rightLine = new Graphics();
        midLine.lineStyle(2, 'blue', 0.5)
            .moveTo(0, 0)
            .lineTo(-250, 500);
        this.carCont.addChild(rightLine)
    }

    private paintDebug(x: number, y: number) {
        let debug = new Graphics()
        debug.clear()
        debug.beginFill('pink', 100);
        debug.drawEllipse(x, y, 5, 5);
        debug.name = 'debug'

        this.app.stage.addChild(debug);
    }

    // --- pure functions ---

    private getCurNNState(
        app: Application<HTMLCanvasElement>,
        carTelemetry: CarTelemetry,
        goalPosition: Position): State {
        let wallsList = app.stage.children.filter(child => child.name === 'wall') as Wall[]

        // get all wall lines to calculate collisions against
        let wallsCords: {
            startPos: Position,
            endPos: Position
        }[] = wallsList.map(
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


        // find the closest walls to our eyes
        let closestFront = maxEyeDist;
        let closestLeft = maxEyeDist;
        let closestRight = maxEyeDist;
        let carPos = carTelemetry.position;
        for (let i = 0; i < wallsCords.length; i++) {
            let wall = wallsCords[i]

            // test front 
            let frontCollisionPoint = intersectionOfSegments(carPos, carTelemetry.eyesEnds.center,
                wall.startPos, wall.endPos)
            if (frontCollisionPoint) { // if there is a collision
                this.paintDebug(frontCollisionPoint.x, frontCollisionPoint.y);

                let distToWall = calcDist(carPos, frontCollisionPoint);
                closestFront = Math.min(closestFront, distToWall);
            }

            // test left 
            let leftCollisionPoint = intersectionOfSegments(carPos, carTelemetry.eyesEnds.left,
                wall.startPos, wall.endPos)
            if (leftCollisionPoint) { // if there is a collision
                this.paintDebug(leftCollisionPoint.x, leftCollisionPoint.y);

                let distToWall = calcDist(carPos, leftCollisionPoint);
                closestLeft = Math.min(closestLeft, distToWall);
            }

            // test right 
            let rightCollisionPoint = intersectionOfSegments(carPos, carTelemetry.eyesEnds.right,
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
            goalDelta: calcDist(carTelemetry.position, goalPosition),
            angle: carTelemetry.angle, // angle of car in degrees 
            velocity: calcVelocity(carTelemetry.prePosition, carTelemetry.position),
        } as State;
    }

    // get action

    // perform action => get new state

    // report new state to NN 

    // endAgent function 
}