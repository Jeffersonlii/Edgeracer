import { Application, Assets, Sprite, Graphics } from 'pixi.js';
import { Building } from './src/building';
import { Controls } from './src/controls';
import { Eraser } from './src/eraser';

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
    buildingComponent.setBuildingMode(false);

    // erasing walls
    const eraseComponent = new Eraser(app);
    eraseComponent.setEraseMode(false);

    const controlsComponent = new Controls(buildingComponent, eraseComponent);
}

buildapp();