import { getRandomSubarray } from "../mathHelpers";
import { ACTION_SIZE, Action, QState, STATE_SIZE } from "./envModels";
import * as tf from '@tensorflow/tfjs';

export type Memory = {
    s: QState; a: Action, reward: number; sPrime: QState; terminated: boolean;
};
type InternalMemory = {
    sTensor: tf.Tensor; a: Action, reward: number; sPrimeTensor: tf.Tensor; terminated: boolean;
};
export class ReplayMemory {
    storage: InternalMemory[];
    memSize: number;
    constructor(memSize: number) {
        this.memSize = memSize;
        this.storage = []
    }

    push(el: Memory) {
        if (this.storage.length < this.memSize) {
            this.storage.push({
                sTensor: tf.tensor1d(Object.values(el.s)),
                a: el.a ,
                reward: el.reward ,
                sPrimeTensor: tf.tensor1d(Object.values(el.sPrime)),
                terminated: el.terminated
            })
        } else {
            tf.dispose(this.storage.shift())
            this.push(el)
        }
    }

    sample(batchSize: number): InternalMemory[] {
        return getRandomSubarray(this.storage, batchSize);
    }
}