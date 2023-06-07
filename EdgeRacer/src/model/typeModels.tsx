export type Actions = 'accel' | 'break' | 'leftT' | 'rightT';
export interface State {
    frontDelta: number;
    leftfrontDelta: number;
    rightfrontDelta: number;
    goalDelta: number;
    angle: number; // angle of car in degrees 
    velocity: number;
}
