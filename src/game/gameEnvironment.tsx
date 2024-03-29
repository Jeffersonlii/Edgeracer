import { Action, QState, EnvState } from "./envModels";
import { Building, Wall, WallCoordinate } from "../building";
import { Position, angleBetween, calcDist, clamp, intersectionOfSegments, positionOfFacing } from "../mathHelpers";
import { StartingGoal } from "../startingGoal";
import { FinishGoal } from "../finishGoal";

// ------- Car Drivability Metrics --------
export const carWidth = 30;
export const carHeight = 10;
const maxEyeDist = 500;
const topVelo = 10;
const topAcceleration = 0.1;
const passiveBreaking = 0.1;
const turnAccel = 0.3; // degrees per frame
const maxTurnRate = 6; // degrees per frame

// This class is an API for the game environment for the DQL to train with
export class GameEnvironment {
    private bc: Building
    private sgc: StartingGoal
    private fgc: FinishGoal
    private wallsCords: WallCoordinate[] = []

    // main globals we use to manipulate and record the state of the game
    private currentState: EnvState | undefined;
    private initialDeltaToGoal: number = 0;

    constructor(
        buildingComponent: Building,
        sgoalsComponent: StartingGoal,
        fgoalsComponent: FinishGoal) {
        this.bc = buildingComponent;
        this.sgc = sgoalsComponent;
        this.fgc = fgoalsComponent;
    }

    // reset the environment, initialize all global variables like the walls and game state
    // create the car assets 
    reset(): QState {


        // get all wall lines to calculate collisions against
        this.wallsCords = this.bc.getAllWallPos();
        let startingPosition = this.sgc.getPosition() ?? {x:0, y:0};
        let finishPosition = this.fgc.getPosition() ?? {x:0, y:0};


        // init current state
        this.initialDeltaToGoal = calcDist(startingPosition, finishPosition);
        this.currentState = {
            ...this.getWallDeltasToAgent(startingPosition, 0, this.wallsCords),
            goalDelta: this.initialDeltaToGoal,
            position: startingPosition,
            angle: 0,
            angleToGoal: angleBetween(startingPosition, finishPosition),
            velocity: 0,
            turningRate: 0,
            goalPosition: finishPosition
        }
        return this.normalizeQState(this.currentState);
    }

    destroy() {
        this.currentState = undefined;
    }

    // next step, should be called once per frame as each frame represents a step in the Q learning process
    step(action: Action): {
        sPrime: QState,
        reward: number,
        terminated: boolean
    } {
        if (!this.currentState) {
            throw new Error('Please Call env.reset() to instantiated game');
        }

        // ------ computing new state -------
        // new velocity and angle of car after the action
        let { velocity, angle, turningRate } = this.computeNewTelemetry(
            action,
            this.currentState.velocity,
            this.currentState.angle,
            this.currentState.turningRate);

        // compute new position from new velocity and angle
        let resultantPos = this.calcPositionAfterMoving(
            this.currentState.position,
            angle,
            velocity);

        // ----- update to new state, s prime -----
        let angleToGoal = angleBetween(resultantPos, this.fgc.getPosition() ?? {x:0, y:0}) - angle;
        angleToGoal = (angleToGoal < 0 ? angleToGoal + 360 : 0) 
        this.currentState = {
            ...this.currentState,
            ...this.getWallDeltasToAgent(resultantPos, angle, this.wallsCords),
            angle,
            angleToGoal: angleToGoal,
            goalDelta: calcDist(resultantPos, this.currentState.goalPosition),
            position: resultantPos,
            velocity: velocity,
            turningRate: turningRate,
        }

        // ----- calculate reward -----
        // note : this.currentState is s prime as we just updated it
        let { reward, isTerminal } = this.reward(this.currentState);

        // return new state and reward
        return {
            sPrime: this.normalizeQState(this.currentState),
            reward,
            terminated: isTerminal
        };
    }

    // ------------ pure functions -----------

    // return the reward of (s,a)
    // where the parameter statePrime is s prime (the resultant state of (s,a))
    //
    // we take s prime instead of s as we must know the resultant state before 
    // we understand the consequences of (s,a), only then can we decide on the reward
    // also return isTerminal, denoting if the reward indicates the termination of the game
    //  (ex. car reached goal...)
    private reward(statePrime: EnvState): {
        reward: number, isTerminal: boolean
    } {
        if (!this.currentState) {
            throw new Error('Please Call env.reset() to instantiated game');
        }

        // // ------- terminals -------
        // // todo : plenty of room for optimization! 
        // // walls can be preprossed to be sorted into hashtables based of collision sectors
        // // check for collision
        // let collided = this.isCollidingWithWall(this.bc.getAllWallPos(), statePrime.position)
        // if (collided) {
        //     console.info("collided!!", this.currentState)

        //     return { reward: -1000, isTerminal: true }
        // }

        // // if goal has been reached, reward 100000! 
        // if (this.positionIsWithinCar(statePrime.goalPosition, statePrime.position)) {
        //     console.info("goal Reached!", this.currentState)

        //     return { reward: 1000, isTerminal: true }
        // }

        // // let reward = -5;
        // // reward += statePrime.velocity*5;
        // // reward += reward * (Math.min(this.initialDeltaToGoal - statePrime.goalDelta),1)

        // return { reward : 1, isTerminal: false };

        let reward = 0;
        let isTerminal = false;
    
        // Completing the race
        if (statePrime.goalDelta < 10) {
            reward += 500;
            isTerminal = true;
        }
    
        // Avoiding collisions
        if (statePrime.frontDelta < 30 || statePrime.leftfrontDelta < 30 || statePrime.rightfrontDelta < 30) {
            reward -= 500;
            isTerminal = true;
        }else{
            reward -= 1;
        }
    
        // Efficient driving
        reward += statePrime.velocity;
    
        return { reward, isTerminal };
    }
    // return the new velocity, angle and turning rate of the car 
    // after the action has been applied on the parameters
    private computeNewTelemetry(action: Action,
        velocity: number,
        angle: number,
        turningRate: number): {
            velocity: number,
            angle: number,
            turningRate: number
        } {
        let accel = 0;

        // 'return to zero' on no action
        if (action !== Action.ACCEL_LEFT && action !== Action.ACCEL_RIGHT) {
            if (action !== Action.ACCELERATE) {
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
            case Action.ACCELERATE: 
                accel = topAcceleration;
                break;
            case Action.LEFT_TURN:
                turningRate = clamp(turningRate - turnAccel, -maxTurnRate, maxTurnRate);
                break;
            case Action.RIGHT_TURN:
                turningRate = clamp(turningRate + turnAccel, -maxTurnRate, maxTurnRate);
                break;
            case Action.ACCEL_LEFT:
                accel = topAcceleration;
                turningRate = clamp(turningRate - turnAccel, -maxTurnRate, maxTurnRate);
                break;
            case Action.ACCEL_RIGHT:
                accel = topAcceleration;
                turningRate = clamp(turningRate + turnAccel, -maxTurnRate, maxTurnRate);
                break;
        }
        let newAngle = (angle + turningRate) % 360;
        if (newAngle < 0) {
            newAngle += 360
        }

        return {
            velocity: clamp(velocity + accel, 0, topVelo),
            angle: newAngle,
            turningRate
        }

    }

    private getWallDeltasToAgent(agentPosition: Position, agentAngle: number, wallsCords: WallCoordinate[]) {
        let eyesEnds = {
            left: positionOfFacing(agentPosition, agentAngle - 45, maxEyeDist),
            center: positionOfFacing(agentPosition, agentAngle, maxEyeDist),
            right: positionOfFacing(agentPosition, agentAngle + 45, maxEyeDist),
        }

        // find the closest walls to our eyes
        let closestFront = maxEyeDist;
        let closestLeft = maxEyeDist;
        let closestRight = maxEyeDist;
        for (let i = 0; i < wallsCords.length; i++) {
            let wall = wallsCords[i]

            // test front 
            let frontCollisionPoint = intersectionOfSegments(agentPosition, eyesEnds.center,
                wall.startPos, wall.endPos)
            if (frontCollisionPoint) { // if there is a collision
                let distToWall = calcDist(agentPosition, frontCollisionPoint);
                closestFront = Math.min(closestFront, distToWall);
            }

            // test left 
            let leftCollisionPoint = intersectionOfSegments(agentPosition, eyesEnds.left,
                wall.startPos, wall.endPos)
            if (leftCollisionPoint) { // if there is a collision
                let distToWall = calcDist(agentPosition, leftCollisionPoint);
                closestLeft = Math.min(closestLeft, distToWall);
            }

            // test right 
            let rightCollisionPoint = intersectionOfSegments(agentPosition, eyesEnds.right,
                wall.startPos, wall.endPos)
            if (rightCollisionPoint) { // if there is a collision
                let distToWall = calcDist(agentPosition, rightCollisionPoint);
                closestRight = Math.min(closestRight, distToWall);
            }
        }
        return {
            frontDelta: closestFront,
            leftfrontDelta: closestLeft,
            rightfrontDelta: closestRight,
        };
    }
    // return the new position after moving at velocity and angle after 1 frame
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
    private normalizeQState(s: EnvState): QState {
        return {
            frontDelta: s.frontDelta / maxEyeDist,
            leftfrontDelta: s.leftfrontDelta / maxEyeDist,
            rightfrontDelta: s.rightfrontDelta / maxEyeDist,
            goalDelta: s.goalDelta / this.initialDeltaToGoal,
            angleToGoal: s.angleToGoal / 360,
            velocity: s.velocity / topVelo,
        }
    }

    getCarState(){
        return {
            position: this.currentState?.position,
            angle: this.currentState?.angle
        }
    }
}