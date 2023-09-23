import { State, Ticker } from "pixi.js";
import * as tf from '@tensorflow/tfjs';
import { GameEnvironment } from "./gameEnvironment";
import { ACTION_SIZE, Action, QState, STATE_SIZE } from "./envModels";
// Deep Q Learning

//https://www.analyticsvidhya.com/blog/2019/04/introduction-deep-q-learning-python/
export interface dqlParameters {
    targetSyncFrequency: number;
    numberOfEpisodes: number;
    maxStepCount: number;
    discountRate: number;
    explorationRate: number;
    explorationDecayRate: number;
    minExplorationRate: number;
}
export class DQL {

    private policyNetwork: tf.Sequential;
    private targetNetwork: tf.Sequential;
    private params: dqlParameters;

    constructor(params: dqlParameters, nnOptions: any = {}) {
        // ------- define networks -------
        this.policyNetwork = this.createNN(params);
        this.targetNetwork = this.createNN(params);
        this.params = params;
    }

    async train(env: GameEnvironment) {
        // const gameTicker = new Ticker();
        // gameTicker.maxFPS = 60;
        // console.log("fps : " + gameTicker.FPS);

        for (let episode = 0; episode < this.params.numberOfEpisodes; episode++) {
            const gameTicker = new Ticker();
            // gameTicker.maxFPS = 60;
            console.info("fps : " + gameTicker.FPS);

            // do training
            await new Promise((resolve) => {
                let s = env.reset();
                let rewardCount = 0;
                let step = 0
                let exploreRate = this.params.explorationRate;

                gameTicker.add(() => {
                    step++;

                    // ---- get action -----
                    let action: Action;
                    if (Math.random() < exploreRate) {
                        // explore time ! pick a random action
                        action = Math.floor(Math.random() * ACTION_SIZE);
                    } else {
                        // exploit time ! use NN to find the best action
                        let input: number[] = Object.values(s);
                        let output = this.policyNetwork.predict(tf.tensor2d(input, [1, 6]))
                        console.log(input, output)
                        // action = tf.argMax(output, 0);
                        action = 0
                    }
                    let { sPrime, reward, terminated } = env.step(action);

                    // 
                    // this.policyNetwork.fit
                    // ----- updates ----
                    rewardCount += reward
                    s = sPrime; // update state
                    exploreRate = Math.max(
                        this.params.minExplorationRate,
                        exploreRate - this.params.explorationDecayRate);

                    if (terminated || step > this.params.maxStepCount) {
                        console.info(`Concluded episode ${episode} : reward = ${rewardCount}`)
                        gameTicker.destroy();
                        resolve('resolved');
                    }
                })
                gameTicker.start();
            })
        }
    }


    // ------ pure function -------

    // create a Neural Net used for DQL
    private createNN(params: dqlParameters) {
        let nn = tf.sequential();

        // 3 dense layers
        nn.add(
            tf.layers.dense({
                inputShape: [STATE_SIZE],
                units: 128,
                activation: "relu",
            })
        )
        nn.add(
            tf.layers.dense({
                units: 64,
                activation: "relu",
            })
        )
        nn.add(
            tf.layers.dense({
                units: 128,
                activation: "relu",
            })
        )

        // final output layer
        nn.add(
            tf.layers.dense({
                units: ACTION_SIZE,
                activation: "softmax",
            })
        )
        nn.compile({
            optimizer: tf.train.rmsprop(2e-3),
            loss: this.loss,
            metrics: ['accuracy']
        })
        return nn;
    }

    private loss(yTrue: tf.Tensor, yPred: tf.Tensor): tf.Tensor {

        // todo do this loss function

        this.policyNetwork.predict(tf.tensor1d([]))
        return tf.tensor1d([1]);
    }

    // sync the weights of 2 models of the same archetecture
    private syncModel(m: tf.Sequential, targetM: tf.Sequential) {
        targetM.setWeights(m.getWeights());
    }
}