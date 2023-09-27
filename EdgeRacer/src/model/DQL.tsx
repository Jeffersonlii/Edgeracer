import { State, Ticker } from "pixi.js";
import * as tf from '@tensorflow/tfjs';
import { GameEnvironment } from "./gameEnvironment";
import { ACTION_SIZE, Action, QState, STATE_SIZE } from "./envModels";
// Deep Q Learning

//https://www.analyticsvidhya.com/blog/2019/04/introduction-deep-q-learning-python/
export interface dqlParameters {
    replayArraySize: number;
    replayBatchSize: number;
    targetSyncFrequency: number; // in steps
    numberOfEpisodes: number;
    maxStepCount: number;
    discountRate: number;
    learningRate: number;
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

        // not trainable by optimizer, weights are only updated via sync
        this.targetNetwork.trainable = false; 

        this.params = params;
    }

    async train(env: GameEnvironment) {
        let totalSteps = 0;

        for (let episode = 0; episode < this.params.numberOfEpisodes; episode++) {
            const gameTicker = new Ticker();
            gameTicker.maxFPS = 999;
            console.info("fps : " + gameTicker.FPS);

            // do training
            await new Promise((resolve) => {
                let s = env.reset();
                let rewardCount = 0;
                let step = 0
                let exploreRate = this.params.explorationRate;

                // fill up replay memory
                let replayMemory: { sPrime: QState; reward: number; terminated: boolean; s: QState; a: Action; }[] = [];
                for (let i = 0; i < this.params.replayArraySize; i++) {
                    let a = Math.floor(Math.random() * ACTION_SIZE);
                    replayMemory.push({ s, a, ...env.step(a) })
                }

                gameTicker.add(() => {
                    totalSteps++;
                    step++;

                    // ---- train on batch ------ 
                    // todo

                    // ---- progress game by taking action ------
                    // get action 
                    let action: Action;
                    if (Math.random() < exploreRate) {
                        // explore time ! pick a random action
                        action = Math.floor(Math.random() * ACTION_SIZE);
                    } else {
                        // exploit time ! use NN to find the best action
                        action = this.predictAction(this.policyNetwork, s);
                    }
                    let { sPrime, reward, terminated } = env.step(action);
                    // fifo replay memory
                    replayMemory.shift();
                    replayMemory.push({ s, a: action, sPrime, reward, terminated })

                    // ----- updates ----
                    rewardCount += reward
                    s = sPrime; // update state
                    exploreRate = Math.max(
                        this.params.minExplorationRate,
                        exploreRate - this.params.explorationDecayRate);

                    // ----- sync networks ------
                    if (totalSteps % this.params.targetSyncFrequency === 0){
                        this.syncModel(this.policyNetwork, this.targetNetwork);
                    }
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

    private predictAction(nn: tf.Sequential, state: QState) {
        let input: number[] = Object.values(state);
        let output = tf.tidy(() => nn.predict(tf.tensor2d(input, [1, 6])))
        return tf.argMax((output as tf.Tensor), 1).dataSync()[0];
    }

    // create a Neural Net used for DQL
    private createNN(params: dqlParameters) {
        let nn = tf.sequential();

        // 3 dense layers
        nn.add(
            tf.layers.dense({
                inputShape: [STATE_SIZE],
                units: 36,
                activation: "relu",
            })
        )
        nn.add(
            tf.layers.dense({
                units: 24,
                activation: "relu",
            })
        )
        nn.add(
            tf.layers.dense({
                units: 36,
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
            optimizer: tf.train.adam(this.params.learningRate),
            loss: this.loss,
            metrics: ['accuracy']
        })

        console.log(nn.summary())

        

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