import { Application, Graphics } from "pixi.js";
import { State } from "./typeModels";
import { Position } from "../mathHelpers";


export class Agent {

    // cur time alive
    private currentState: State;
    private carGraphic: Graphics;
    private app: Application<HTMLCanvasElement>;

    private position: Position;

    constructor(app: Application<HTMLCanvasElement>, position: Position, lastNN: any) {
        this.app = app;
        this.position = position;
        //init current state

        // todo use a container instead
        // attach infinite 'rays' to the graphic 
        // collision test rays to walls, treating the walls as lines 
        this.carGraphic = new Graphics();
        this.app.stage.addChild(this.carGraphic);
    }

    spawnAndTrain() {
        console.log(this.position)

        // spawn in car graphic
        this.carGraphic.clear()
        this.carGraphic.beginFill('red', 50);
        this.carGraphic.drawEllipse(this.position.x, this.position.y, 10, 30);

        // train in loop 
        this.app.ticker.add(() => {



            // get current state 

            // get action from NN 

            // perform action => get new state AND REWARD

            // update NN with reward 
        });
    }

    // pure functions
    private getCurState(app : Application<HTMLCanvasElement>): State{
        let wallList = app.stage.children.filter(child => child.name === 'wall')

        let 

        intersectPoint 

        return null as any;
    }
    // get cur state

    // get action

    // perform action => get new state

    // report new state to NN 

    // endAgent function 
}