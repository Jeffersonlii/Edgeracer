import { State, Ticker } from "pixi.js";
import * as tf from '@tensorflow/tfjs';
import { ACTION_SIZE, Action, QState, STATE_SIZE } from "../game/envModels";
import { ReplayMemory } from "./replayMemory";
import { Agent } from "./agent";
import {Data} from '../data/data';

// Deep Q Learning

//https://www.analyticsvidhya.com/blog/2019/04/introduction-deep-q-learning-python/
export interface dqlParameters {
    replayBatchSize: number;
    targetSyncFrequency: number; // in steps
    numberOfEpisodes: number;
    maxStepCount: number;
    discountRate: number;
    learningRate: number;
}
export class DQL {

    private policyNetwork: tf.Sequential;
    private targetNetwork: tf.Sequential;
    private params: dqlParameters;

    constructor(params: dqlParameters) {
        // ------- define networks -------
        this.policyNetwork = this.createNN();
        this.targetNetwork = this.createNN();

        // not trainable by optimizer, weights are only updated via sync
        this.targetNetwork.trainable = false;

        this.params = params;
    }

    async train(agent: Agent, calledWithMovingAverage: (input : {avg:number, episode:number}) => any ) {

        const d = new Data();
        d.reset();

        agent.totallyReset();
        let rewards: number[] = []
        let totalSteps = 0;
        for (let episode = 0; episode < this.params.numberOfEpisodes; episode++) {

            // do training
            await new Promise((resolve) => {
                agent.episodeReset();
                let step = 0

                const optimizer = tf.train.adam(this.params.learningRate);

                const gameTicker = new Ticker();
                gameTicker.maxFPS = 999;
                gameTicker.add(() => {
                    totalSteps++;
                    step++;
                    // ---- progress game by taking action ------
                    // this also stores the experience into replay memory
                    let { cummReward, terminated } = agent.playStep(this.policyNetwork)

                    // ---- train on batch ------ 
                    if(agent.getMemory().storage.length === agent.getReplayMemorySize()){
                        this.optimizeOnReplayBatch(agent.getMemory(), optimizer);
                    }

                    // ----- sync networks ------
                    if (totalSteps % this.params.targetSyncFrequency === 0) {
                        this.syncModel(this.policyNetwork, this.targetNetwork);
                    }
                    if (terminated || step > this.params.maxStepCount) {
                        rewards.push(cummReward);
                        console.info(`Concluded episode ${episode} : reward = ${cummReward}`)
                        gameTicker.destroy();

                        let mavg = d.add(cummReward);
                        console.log(`moving average : ${mavg}`)
                        calledWithMovingAverage({avg: mavg, episode})

                        resolve('resolved');
                    }
                })
                gameTicker.start();
            })
        }
        console.log(d.getAverages());
        return rewards;
    }

    private optimizeOnReplayBatch(replayMemories: ReplayMemory, optimizer: tf.Optimizer) {
        // randomly sample a batch to train on
        const batch = replayMemories.sample(this.params.replayBatchSize);

        // compute the loss of the batch 
        // ( (R_t+1 + gamma*max[q`(s`, a`)]) - q(s,a) )^2
        const lossFunc = () => tf.tidy(() => {

            const stateTensor = tf.stack(batch.map((mem) => mem.sTensor));
            const actionTensor = tf.tensor1d(batch.map((mem) => mem.a), 'int32');
            const allQs = this.policyNetwork.apply(stateTensor, { training: false }) as tf.Tensor
            const oneHotAction = tf.oneHot(actionTensor, ACTION_SIZE);
            const qs = allQs.mul(oneHotAction).sum(1);

            const rewardTensor = tf.tensor1d(batch.map((mem) => mem.reward), 'int32')
            const gamma = tf.scalar(this.params.discountRate);
            const sPrimeTensor = tf.stack(batch.map((mem) => mem.sPrimeTensor));
            const nextMaxQTensor = (this.targetNetwork.predict(sPrimeTensor) as tf.Tensor).max(1);
            const doneMask = tf.scalar(1).sub(batch.map((m) => m.terminated))

            const targetQs = rewardTensor.add(gamma.mul(doneMask).mul(nextMaxQTensor))
            return tf.losses.meanSquaredError(targetQs, qs) as tf.Scalar;
        })

        const grads = tf.variableGrads(lossFunc);

        optimizer.applyGradients(grads.grads)

        tf.dispose(grads);
    }
    // ------ pure function -------

    // create a Neural Net used for DQL
    private createNN() {
        let nn = tf.sequential();

        // 3 dense layers
        nn.add(
            tf.layers.dense({
                inputShape: [STATE_SIZE],
                units: 24,
                activation: "relu",
            })
        )
        nn.add(
            tf.layers.dense({
                units: 24,
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

        return nn;
    }

    // sync the weights of 2 models of the same archetecture
    private syncModel(m: tf.Sequential, targetM: tf.Sequential) {
        targetM.setWeights(m.getWeights());
    }

    private printnn(model: tf.Sequential) {

        model.layers.forEach(layer => {
            if (layer.getWeights().length > 0) {
                const weights = layer.getWeights()[0];
                const biases = layer.getWeights()[1];

                console.log(`Layer: ${layer.name}`);
                console.log(`Weights:`);
                weights.print();
                console.log(`Biases:`);
                biases.print();
            }
        });
    }
}