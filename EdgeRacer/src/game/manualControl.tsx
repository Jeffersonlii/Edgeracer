import { Application, Ticker } from "pixi.js";
import { GameEnvironment } from "./gameEnvironment";
import { Action } from "./envModels";

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};
// take manual control of the car, mostly for debugging 
export class ManualControl {
    static t: Ticker;

    static runLoop(env: GameEnvironment) {

        // ---- clean up previous runs -----
        if (this.t) {
            // throws error if t is already destroyed
            try {
                this.t.destroy();
            } catch (error) {}
        }
        this.removeListeners();
        env.reset();



        // ----- set up current run ------
        this.addListeners();
        const carTicker = new Ticker();
        carTicker.maxFPS = 999;
        console.log("fps is " + carTicker.FPS);

        this.t = carTicker.add(() => {
            let s;
            if (keys.w && keys.a) {
                s = env.step(Action.ACCEL_LEFT)
            }
            else if (keys.w && keys.d) {
                s = env.step(Action.ACCEL_RIGHT)
            }
            else if (keys.w) {
                s = env.step(Action.ACCELERATE)
            }
            else if (keys.a) {
                s = env.step(Action.LEFT_TURN)
            }
            else if (keys.s) {
                s = env.step(Action.BREAK)
            }
            else if (keys.d) {
                s = env.step(Action.RIGHT_TURN)
            }
            else {
                s = env.step(undefined as unknown as Action);
            }
            if (s.terminated) {
                this.t.stop();
                this.t.destroy();
            }
        })
        this.t.start();
    }

    static onKD = (e: any) => {
        switch (e.key) {
            case 'w':
                keys.w = true;
                break;
            case 'a':
                keys.a = true;
                break;
            case 's':
                keys.s = true;
                break;
            case 'd':
                keys.d = true;
                break;
        }
    }
    static onKU = (e: any) => {
        switch (e.key) {
            case 'w':
                keys.w = false;
                break;
            case 'a':
                keys.a = false;
                break;
            case 's':
                keys.s = false;
                break;
            case 'd':
                keys.d = false;
                break;
        }
    }
    private static addListeners() {
        document.addEventListener('keydown', this.onKD);
        document.addEventListener('keyup', this.onKU);

    }
    private static removeListeners() {
        document.removeEventListener('keydown', this.onKD);
        document.removeEventListener('keyup', this.onKU);
    }
}