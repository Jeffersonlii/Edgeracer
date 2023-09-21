import { State } from "pixi.js";
import * as tf from '@tensorflow/tfjs';
import { GameEnvironment } from "./GameEnvironment";
// Deep Q Learning

//https://www.analyticsvidhya.com/blog/2019/04/introduction-deep-q-learning-python/
export class DQL{
    
    model: tf.Sequential;

    constructor(nnOptions: any = {}){
        this.model = tf.sequential();
        // todo define the policy and target
    }

    train(env : GameEnvironment){

    }
}