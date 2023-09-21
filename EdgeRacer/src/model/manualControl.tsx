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
    static runLoop(app: Application<HTMLCanvasElement>, env: GameEnvironment) {
        this.addListeners();

        env.reset();

        app.ticker.maxFPS = 60;
        console.log("fps is " + app.ticker.FPS);
        app.ticker.add(() => {
            if (keys.w && keys.a) {
                env.step(Action.ACCEL_LEFT)
            }
            else if (keys.w && keys.d) {
                env.step(Action.ACCEL_RIGHT)
            }
            else if (keys.w) {
                env.step(Action.ACCELERATE)
            }
            else if (keys.a) {
                env.step(Action.LEFT_TURN)
            }
            else if (keys.s) {
                env.step(Action.BREAK)
            }
            else if (keys.d) {
                env.step(Action.RIGHT_TURN)
            }
            else {
                env.step(undefined as unknown as Action);
            }
        }
        )
    }
    private static addListeners() {
        document.addEventListener('keydown', (e) => {
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
        });

        document.addEventListener('keyup', (e) => {
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
        });

    }
}