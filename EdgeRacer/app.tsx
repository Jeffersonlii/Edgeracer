import { Application, Assets, Sprite, Graphics } from 'pixi.js';
import { Building } from './src/building';
import { Controls } from './src/controls';
import { Eraser } from './src/eraser';
import { FinishGoal } from './src/finishGoal';
import { Agent } from './src/model/agent';
import { StartingGoal } from './src/startingGoal'; 
import { DQL } from './src/model/DQL';
import { GameEnvironment } from './src/model/GameEnvironment';
import { Action } from './src/model/envModels';

function buildapp() {
    const appContainer = document.getElementById('canvas-space');
    if (!appContainer) return;
    const app = new Application<HTMLCanvasElement>({
        // width: appContainer.clientWidth,
        // height: appContainer.clientHeight,
        resizeTo: appContainer,
    });

    appContainer.appendChild(app.view);

    //load in control components 
    const buildingComponent = new Building(app);
    const sgoalsComponent = new StartingGoal(app);
    const fgoalsComponent = new FinishGoal(app);

    const contrComponents: ControlInterface[]  = [
        buildingComponent,
        new Eraser(app),
        sgoalsComponent,
        fgoalsComponent];
    new Controls(contrComponents);

    // add subs 
    (() => {
        document.getElementById('destroyButton')?.addEventListener('click', () => {
            contrComponents.forEach((c)=>c.destroyAll());
        });

        document.getElementById('trainButton')?.addEventListener('click', () => {
            // add an Agent to begin training

            if(!(sgoalsComponent.exists() && fgoalsComponent.exists())){
                alert('Please Place a Start and Finish Position First!');
                return;
            }

            let env = new GameEnvironment(
                app,
                buildingComponent,
                sgoalsComponent,
                fgoalsComponent);

            env.reset();

            console.log("fps is " + app.ticker.FPS);
            app.ticker.maxFPS = 60;
            app.ticker.add(() => {
                console.log(env.step(Action.ACCELERATE));
            })
        });
    })();
}

buildapp();