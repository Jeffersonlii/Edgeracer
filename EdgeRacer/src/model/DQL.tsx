import { State } from "pixi.js";
import * as tf from '@tensorflow/tfjs';
// Deep Q Learning

//https://www.analyticsvidhya.com/blog/2019/04/introduction-deep-q-learning-python/
export class DQL{
    
    model: tf.Sequential;

    constructor(nnOptions: any = {}){
        this.model = tf.sequential();
        // todo define the main and  
    }

    private transformInput(input : State){
        // normalize and transform input state
    } 
    predict (input: State){
        const modelInput = this.transformInput(input);

        
    }
}