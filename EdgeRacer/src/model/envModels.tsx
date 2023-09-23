import { Container } from "pixi.js";
import { Position } from "../mathHelpers";

export const ACTION_SIZE = 6; 
export enum Action{
    ACCELERATE = 0,
    BREAK = 1,
    LEFT_TURN = 2,
    RIGHT_TURN = 3,
    ACCEL_LEFT = 4,
    ACCEL_RIGHT = 5,
};

// the State input fed to the Policy Network
export const STATE_SIZE = 6; 
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
    position : Position; // position of car
    turningRate: number; // turning acceleration of car
    carCont: Container; // car container of game
    goalPosition: Position; // position of game goal
}
