import { Application, Assets, Sprite, Graphics } from 'pixi.js';
import { Building } from './src/building';
import { Controls } from './src/controls';
import { Eraser } from './src/eraser';
import { FinishGoal } from './src/finishGoal';
import { Agent } from './src/model/agent';
import { StartingGoal } from './src/startingGoal'; 
import { DQL } from './src/model/DQL';

function buildapp() {
    const appContainer = document.getElementById('canvas-space');
    if (!appContainer) return;
    const app = new Application<HTMLCanvasElement>({
        // width: appContainer.clientWidth,
        // height: appContainer.clientHeight,
        resizeTo: appContainer,
    });

    appContainer.appendChild(app.view);

    //load in assets

    // building walls
    const buildingComponent = new Building(app);

    // erasing walls
    const eraseComponent = new Eraser(app);

    // adding goals
    const sgoalsComponent = new StartingGoal(app);
    const fgoalsComponent = new FinishGoal(app);

    new Controls(
        buildingComponent,
        eraseComponent,
        sgoalsComponent,
        fgoalsComponent);

    // add subs 
    (() => {
        document.getElementById('destroyButton')?.addEventListener('click', () => {
            buildingComponent.destroyAll();
            sgoalsComponent.destroyAll();
            fgoalsComponent.destroyAll();
        });

        document.getElementById('trainButton')?.addEventListener('click', () => {
            // add an Agent to begin training

            if(!(sgoalsComponent.exists() && fgoalsComponent.exists())){
                alert('Please Place a Start and Finish Position First!');
                return;
            }

            let player = new Agent(app, {
                startPosition: sgoalsComponent.getPosition(),
                goalPosition: fgoalsComponent.getPosition(),
             }, new DQL()); 
            
            player.spawnAndTrain();
        });
    })();
}

buildapp();