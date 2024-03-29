import { ACTION_SIZE, Action, QState, STATE_SIZE } from "../game/envModels";
import { GameEnvironment } from "../game/gameEnvironment";
import * as tf from '@tensorflow/tfjs';
import { ReplayMemory } from "./replayMemory";

export interface agentParameters {
    replayMemorySize: number;
    initialExplorationRate: number; 
    explorationDecayRatePerStep: number;
    explorationDecayRatePerEpisode: number
    minExplorationRate: number;
}
export class Agent {

    env: GameEnvironment;
    params: agentParameters;
    rewardCount = 0;
    curExploreRate: number;
    s: QState;
    replayMemories: ReplayMemory;
    numEpsTrained : number = 0; // number of episodes trained using this agent
    constructor(env: GameEnvironment, params: agentParameters) {
        this.env = env;
        this.params = params;
        this.curExploreRate = params.initialExplorationRate;
        this.s = env.reset();
        this.replayMemories = new ReplayMemory(this.params.replayMemorySize);
    }

    // totally reset agent  
    totallyReset() {
        this.rewardCount = 0;
        this.curExploreRate = this.params.initialExplorationRate;
        this.s = this.env.reset();
        this.replayMemories.clear()
        this.numEpsTrained = 0; 
    }

    // partially reset agent for training on new episode
    episodeReset() {
        this.numEpsTrained += 1; 
        this.rewardCount = 0;
        this.curExploreRate = 
            this.params.initialExplorationRate - 
            this.numEpsTrained * this.params.explorationDecayRatePerEpisode;
        this.s = this.env.reset();
        console.log(`explore start rate: ${this.curExploreRate}`)
        this.replayMemories.clear()
    }

    playStep(predictiveNetwork: tf.Sequential) {
        // ---- progress game by taking action ------
        // get action 
        let action: Action;
        if (Math.random() < this.curExploreRate) {
            // explore time ! pick a random action
            action = Math.floor(Math.random() * ACTION_SIZE);
        } else {
            // exploit time ! use NN to find the best action
            action = this.predictAction(predictiveNetwork, this.s);
        }
        let { sPrime, reward, terminated } = this.env.step(action);

        // ----- rememeber a new memory -----
        this.replayMemories.push({ s: this.s, a: action, sPrime, reward, terminated })

        // ----- state updates ----
        this.rewardCount += reward;
        this.s = sPrime;
        this.curExploreRate = Math.max(
            this.params.minExplorationRate,
            this.curExploreRate - this.params.explorationDecayRatePerStep);

        if (terminated) {
            console.log(`explore end rate: ${this.curExploreRate}`)
        }
        return { cummReward: this.rewardCount, terminated }
    }

    getMemory() {
        return this.replayMemories;
    }

    getReplayMemorySize() {
        return this.params.replayMemorySize;
    }

    private predictAction(nn: tf.Sequential, state: QState) {
        let input: number[] = Object.values(state);
        let output = tf.tidy(() => nn.predict(tf.tensor2d(input, [1, STATE_SIZE])))
        return tf.argMax((output as tf.Tensor), 1).dataSync()[0];
    }
}