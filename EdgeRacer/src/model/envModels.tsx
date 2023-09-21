import { Position } from "../mathHelpers";

export enum Action{
    ACCELERATE = 0,
    BREAK = 1,
    LEFT_TURN = 2,
    RIGHT_TURN = 3,
    ACCEL_LEFT = 4,
    ACCEL_RIGHT = 5
};

// the State input fed to the Policy Network
export interface QState {
    frontDelta: number;
    leftfrontDelta: number;
    rightfrontDelta: number;
    goalDelta: number;
    angle: number; // angle of car in degrees 
    velocity: number;
    // may need angle to goal
}

// The overall State of the game, with datapoints not fed to the policy network
export interface EnvState extends QState{
    position : Position;
    acceleration : number; 
}
