import { Application } from "pixi.js";
import { GameEnvironment } from "./gameEnvironment";
import { Action } from "./envModels";

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// take manual control of the car, mostly for debugging 
export class ManualControl{
    static runLoop(app: Application<HTMLCanvasElement>, env: GameEnvironment){
        this.addListeners();

        env.reset();

        console.log("fps is " + app.ticker.FPS);
            app.ticker.maxFPS = 20;
            app.ticker.add(() => {

                if (keys.w ) {
                    env.step(Action.ACCELERATE)
                } else if (keys.a) {
                    // Perform action for 'a' key
                } else if (keys.s) {
                    env.step(Action.BREAK)
                } else if (keys.d) {
                    // Perform action for 'd' key
                } else {
                    env.step(undefined as unknown as Action);
                }
            })
    }
    private static addListeners(){
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