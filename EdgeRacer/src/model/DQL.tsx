import { State, Ticker } from "pixi.js";
import * as tf from '@tensorflow/tfjs';
import { GameEnvironment } from "./gameEnvironment";
import { ACTION_SIZE, Action, QState, STATE_SIZE } from "./envModels";
import { getRandomSubarray } from "../mathHelpers";
import { ReplayMemory } from "./replayMemory";
// Deep Q Learning

//https://www.analyticsvidhya.com/blog/2019/04/introduction-deep-q-learning-python/
export interface dqlParameters {
    replayMemorySize: number;
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
                const optimizer = tf.train.adam(this.params.learningRate);

                // fill up replay memory
                const replayMemories = new ReplayMemory(this.params.replayMemorySize);
                for (let i = 0; i < this.params.replayMemorySize; i++) {
                    let a = Math.floor(Math.random() * ACTION_SIZE);
                    let res = env.step(a)
                    replayMemories.push({ s, a, ...res })
                    s = res.sPrime;
                }

                gameTicker.add(() => {
                    totalSteps++;
                    step++;

                    // ---- train on batch ------ 
                    this.optimizeOnReplayBatch(replayMemories, optimizer)

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

                    // rememeber a new memory 
                    replayMemories.push({ s, a: action, sPrime, reward, terminated })

                    // ----- updates ----
                    rewardCount += reward
                    s = sPrime; // update state
                    exploreRate = Math.max(
                        this.params.minExplorationRate,
                        exploreRate - this.params.explorationDecayRate);

                    // ----- sync networks ------
                    if (totalSteps % this.params.targetSyncFrequency === 0) {
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

    private optimizeOnReplayBatch(replayMemories: ReplayMemory, optimizer: tf.Optimizer) {
        // randomly sample a batch to train on
        const batch = replayMemories.sample(this.params.replayBatchSize);
        // compute the loss of the batch 
        // ( (R_t+1 + gamma*max[q`(s`, a`)]) - q(s,a) )^2
        const lossFunc = ()=> tf.tidy(()=>{
            const stateTensor = tf.stack(batch.map((mem)=> mem.sTensor)); 
            const actionTensor = tf.tensor1d(batch.map((mem)=> mem.a), 'int32');

            const allQs = this.policyNetwork.apply(stateTensor, { training: true }) as tf.Tensor
            const oneHotAction = tf.oneHot(actionTensor, ACTION_SIZE);
            const qs = allQs.mul(oneHotAction).sum(1);

            const rewardTensor = tf.tensor1d(batch.map((mem)=> mem.reward), 'int32')
            const gamma = tf.scalar(this.params.discountRate);
            const sPrimeTensor = tf.stack(batch.map((mem)=> mem.sPrimeTensor)); 
            const nextMaxQTensor = (this.targetNetwork.predict(sPrimeTensor) as tf.Tensor).max(1);
            const targetQs = rewardTensor.add(gamma.mul(nextMaxQTensor))

            return tf.losses.meanSquaredError(targetQs, qs) as tf.Scalar;
        }) 
        const grads = tf.variableGrads(lossFunc);
        optimizer.applyGradients(grads.grads)
        tf.dispose(grads);

    }
    // ------ pure function -------

    private predictAction(nn: tf.Sequential, state: QState) {
        let input: number[] = Object.values(state);
        let output = tf.tidy(() => nn.predict(tf.tensor2d(input,[1, STATE_SIZE])))
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
        console.log(nn.summary())
        return nn;
    }

    // sync the weights of 2 models of the same archetecture
    private syncModel(m: tf.Sequential, targetM: tf.Sequential) {
        targetM.setWeights(m.getWeights());
    }
}