import { Application, Assets, Sprite, Graphics } from 'pixi.js';
import { Building } from './src/building';
import { Controls } from './src/controls';
import { Eraser } from './src/eraser';
import { FinishGoal } from './src/finishGoal';
import { StartingGoal } from './src/startingGoal'; 
import { DQL } from './src/model/DQL';
import { GameEnvironment } from './src/model/gameEnvironment';
import { Action } from './src/model/envModels';
import { ManualControl } from './src/model/manualControl';

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
        document.getElementById('destroyButton')?.addEventListener('click', () => {
            let htmlcontrols = document.getElementsByName('controls');
            for (let i = 0; i < htmlcontrols.length; i++) {
                (htmlcontrols[i] as HTMLInputElement).checked = false;
            }
            
            contrComponents.forEach((c)=>c.destroyAll());
            env.destroy();
            buildingComponent.createBorderWalls();
        });

        document.getElementById('trainButton')?.addEventListener('click', () => {
            // add an Agent to begin training

            if(!(sgoalsComponent.exists() && fgoalsComponent.exists())){
                alert('Please Place a Start and Finish Position First!');
                return;
            }

            env.reset();
            ManualControl.runLoop(app,env);
            
        });
    })();
}

buildapp();