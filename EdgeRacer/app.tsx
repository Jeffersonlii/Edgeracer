import { Application } from 'pixi.js';
import { Building } from './src/building';
import { Controls } from './src/controls';
import { Eraser } from './src/eraser';
import { FinishGoal } from './src/finishGoal';
import { StartingGoal } from './src/startingGoal'; 
import { GameEnvironment } from './src/game/gameEnvironment';
import { ManualControl } from './src/game/manualControl';
import { DQL } from './src/model/DQL';
import { Agent } from './src/model/agent';

function buildapp() {
    const appContainer = document.getElementById('canvas-space');
    if (!appContainer) return;
    const app = new Application<HTMLCanvasElement>({
        resizeTo: appContainer,
    });

    appContainer.appendChild(app.view);

    //load in control components 
    const buildingComponent = new Building(app);
    const sgoalsComponent = new StartingGoal(app);
    const fgoalsComponent = new FinishGoal(app);

    const contrComponents: ControlInterface[]  = [
        buildingComponent,
        new Eraser(app,buildingComponent),
        sgoalsComponent,
        fgoalsComponent];
    new Controls(contrComponents);

    // load in Environment
    let env = new GameEnvironment(
        app,
        buildingComponent,
        sgoalsComponent,
        fgoalsComponent);
    
    // create borders
    buildingComponent.createBorderWalls();

    // add subs 
    (() => {
        window.addEventListener('resize', (e)=>{
            let a = document.getElementById('canvas-space') 
            app.renderer.resize(a?.clientWidth as number, a?.clientHeight as number);

            // recreate border walls when user resizes 
            buildingComponent.destroyBorderWalls();
            buildingComponent.createBorderWalls();
        });

        document.getElementById('destroyButton')?.addEventListener('click', () => {
            
            // uncheck all control radio buttons
            let htmlcontrols = document.getElementsByName('controls');
            for (let i = 0; i < htmlcontrols.length; i++) {
                (htmlcontrols[i] as HTMLInputElement).checked = false;
            }
            
            // destroy all components
            contrComponents.forEach((c)=>c.destroyAll());

            // destroy game environment
            env.destroy();

            // rebuild border walls
            buildingComponent.createBorderWalls();
        });

        document.getElementById('trainButton')?.addEventListener('click', async () => {
            // add an Agent to begin training

            if(!(sgoalsComponent.exists() && fgoalsComponent.exists())){
                alert('Please Place a Start and Finish Position First!');
                return;
            }            
            // ManualControl.runLoop(env);

            let dql = new DQL({
                replayBatchSize: 10,
                targetSyncFrequency: 100,
                numberOfEpisodes: 1000,
                maxStepCount: 1000,
                discountRate: 0.7,
                learningRate: 0.5,

            });
            let agent = new Agent(env, {
                replayMemorySize: 30,
                explorationRate: 1,
                // explorationRate: 0.1,
                explorationDecayRate: 0.001,
                minExplorationRate: 0.1,
            })
            const rewards = await dql.train(agent);
            console.log(rewards)
        });
    })();
}

buildapp();