import { Application, Ticker } from 'pixi.js';
import { Building } from './src/building';
import { Controls } from './src/controls';
import { Eraser } from './src/eraser';
import { FinishGoal } from './src/finishGoal';
import { StartingGoal } from './src/startingGoal';
import { GameEnvironment, carHeight, carWidth } from './src/game/gameEnvironment';
import { ManualControl } from './src/game/manualControl';
import { DQL } from './src/model/DQL';
import { Agent } from './src/model/agent';
import { Car } from './src/game/car'
import Chart from 'chart.js/auto'
import { CourseSelect } from './src/courseSelect';
function buildapp() {
    const appContainer = document.getElementById('canvas-space');
    if (!appContainer) return;
    const app = new Application<HTMLCanvasElement>({
        // resizeTo: appContainer,
        width: appContainer.clientWidth,
        height: appContainer.clientHeight,
        sharedTicker : true
    });
    app.ticker.maxFPS = 10
    console.log(`FPS : ${app.ticker.FPS}`)

    appContainer.appendChild(app.view);


    //load in control components 
    const buildingComponent = new Building(app);
    const sgoalsComponent = new StartingGoal(app);
    const fgoalsComponent = new FinishGoal(app);

        // load in courses
    const courseComponent = new CourseSelect(
        buildingComponent,
        sgoalsComponent,
        fgoalsComponent);

    const contrComponents: ControlInterface[] = [
        buildingComponent,
        new Eraser(app, buildingComponent),
        sgoalsComponent,
        fgoalsComponent];
    new Controls(contrComponents);

    // load in Environment
    let env = new GameEnvironment(
        buildingComponent,
        sgoalsComponent,
        fgoalsComponent);

    // create borders
    buildingComponent.createBorderWalls();

    // charting stuff
    let movingAvgChart: Chart<"line", number[], number>;
    let addMAvgToChart: (input: { avg: number; episode: number; }) => any;
    let emptyChart: () => any;

    // add subs 
    (() => {

        document.addEventListener('DOMContentLoaded', function() {        
            movingAvgChart = new Chart(
                document.getElementById('100movingAvg') as HTMLCanvasElement,
                {
                  type: 'line',
                  data: {
                    labels: [],
                    datasets: [
                      {
                        label: '100-episode Moving Average',
                        data: []
                      }
                    ]
                  },
                  options:{
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Episode'
                              }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Reward'
                              }
                        }
                    }
                  }
                }
              );
        
            // Function to add random data point
            addMAvgToChart = (input : {avg:number, episode:number}) => {

                movingAvgChart.data.labels?.push(input.episode);
                movingAvgChart.data.datasets.forEach((dataset: any) => {
                    dataset.data.push(input.avg);
                });
                movingAvgChart.update();
            }

            emptyChart = () =>{
                movingAvgChart.data.labels = [];
                movingAvgChart.data.datasets.forEach((dataset: any) => {
                    dataset.data = [];
                });
                movingAvgChart.update();
            }
        });

        document.getElementById('destroyButton')?.addEventListener('click', () => {
            // uncheck all control radio buttons
            let htmlcontrols = document.getElementsByName('controls');
            for (let i = 0; i < htmlcontrols.length; i++) {
                (htmlcontrols[i] as HTMLInputElement).checked = false;
            }

            // destroy all components
            contrComponents.forEach((c) => c.destroyAll());

            // destroy game environment
            env.destroy();

            // reset chart
            emptyChart();

            // cap fps when not training
            app.ticker.maxFPS = 10

            // rebuild border walls
            buildingComponent.createBorderWalls();
        });

        document.getElementById('trainButton')?.addEventListener('click', async () => {
            
            // add an Agent to begin training

            if (!(sgoalsComponent.exists() && fgoalsComponent.exists())) {
                alert('Please Place a Start and Finish Position First!');
                return;
            }

            let htmlcontrols = document.getElementsByName('controls');
            for (let i = 0; i < htmlcontrols.length; i++) {
                (htmlcontrols[i] as HTMLInputElement).checked = false;
                contrComponents.forEach(c=>c.setActive(false))
            }

            app.ticker.maxFPS = 60

            console.log(buildingComponent.getAllWallPos())
            console.log(sgoalsComponent.getPosition())
            console.log(fgoalsComponent.getPosition())

            // ManualControl.runLoop(env);

            const numberOfEpisodes = 1000;
            const maxStepCount = 1000;
            const initialExplorationRate = 1;
            const explorationDecayRatePerEpisode = 0.5 / numberOfEpisodes
            const explorationDecayRatePerStep = 1 / maxStepCount
            // const explorationDecayRatePerEpisode = 0

            let dql = new DQL({
                replayBatchSize: 16,
                targetSyncFrequency : maxStepCount,
                numberOfEpisodes,
                maxStepCount,
                discountRate: 0.95,
                learningRate: 0.005,
            });
            let agent = new Agent(env, {
                replayMemorySize: 50,
                initialExplorationRate,
                // explorationRate: 0.4,
                explorationDecayRatePerStep,
                explorationDecayRatePerEpisode,
                minExplorationRate: 0.3,
            })

            // add car to scene and set up graphics loop
            let car = new Car(app, {
                pos: { x: 0, y: 0 },
                angle: 0,
                width: carWidth,
                height: carHeight
            }, 1);
            car.addCarToScene();
            const animationTicker = new Ticker();
            animationTicker.add(() => {
                let s = env.getCarState();
                car.updateCarPosition(s.position ?? {x:0,y:0}, s.angle ?? 0)
            })
            animationTicker.start();
            console.log(animationTicker.FPS)

            const rewards = await dql.train(agent, addMAvgToChart);
            // console.log(rewards)
        });
    })();
}

buildapp();