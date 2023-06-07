export type Actions = 'accel' | 'break' | 'leftT' | 'rightT';
export interface State {
    frontDelta: number;
    leftfrontDelta: number;
    rightfrontDelta: number;
    leftDelta: number;
    rightDelta: number;
    goalDelta: number;
    velocity: number;
    acceleration: number;
}
