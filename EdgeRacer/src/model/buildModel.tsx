import { State } from "pixi.js";
import * as tf from '@tensorflow/tfjs';

export class NN{
    
    model: tf.Sequential;

    constructor(nnOptions: any){
        this.model = tf.sequential();
        // todo define the model 
    }

    private transformInput(input : State){
        // normalize and transform input state
    } 
    predict (input: State){
        const modelInput = this.transformInput(input);

        
    }
}