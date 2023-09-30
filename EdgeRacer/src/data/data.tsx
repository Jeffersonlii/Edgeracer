export class Data{
    data:number[] = [];
    averages:number[] = []
    sum:number = 0;
    movingAverageSize: number;
    constructor(movingAverageSize: number = 100){
        this.movingAverageSize = movingAverageSize;
    }

    reset(){
        this.data = [];
        this.sum = 0;
        this.averages = [];
    }

    add(n: number){
        if(this.data.length > this.movingAverageSize){
            let out = this.data.shift() ?? 0;
            this.sum -= out;
        }
        this.data.push(n);
        this.sum += n
        const av = this.sum / this.data.length;
        this.averages.push(av);
        return av;
    }

    getAverages(){
        return this.averages;
    }
}