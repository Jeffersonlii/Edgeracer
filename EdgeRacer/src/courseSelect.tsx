import { Building, WallCoordinate } from './building';
import { FinishGoal } from './finishGoal';
import { Position } from './mathHelpers';
import { StartingGoal } from './startingGoal';

export interface Course {
    walls: WallCoordinate[],
    startPos: Position,
    finishPos: Position,
}

export class CourseSelect {
    selectElement: HTMLInputElement;
    bc: Building;
    sc: StartingGoal;
    fc: FinishGoal;
    constructor(
        buildingComponent: Building,
        startingComponent: StartingGoal,
        finishComponent: FinishGoal) {
        this.bc = buildingComponent;
        this.sc = startingComponent;
        this.fc = finishComponent;
        this.selectElement = document.getElementById('courses') as HTMLInputElement;
        this.selectElement.value = 'def';
        this.selectElement.addEventListener('change', this.handleChange);
    }

    handleChange = (e: Event) => {
        const selectedValue = (e.target as HTMLSelectElement).value;
        console.log(`Selected value: ${selectedValue}`);

        const controlsElement = document.getElementById('controls') as HTMLInputElement;
        controlsElement.classList.add('hidden');

        const trainButton = document.getElementById('destroyButton') as HTMLButtonElement;
        trainButton.click();
        switch (selectedValue) {
            case 'course1':
                this.buildMap(map1)
                break;
            case 'course2':
                this.buildMap(map2)
                break;
            case 'course3':
                this.buildMap(map3)
                break;
            case 'custom':
                controlsElement.classList.remove('hidden');
                break;
            default:
                break;
        }
    }

    buildMap = (c: Course) => {
        this.bc.createMap(c.walls);
        this.sc.setPosition(c.startPos);
        this.fc.setPosition(c.finishPos);
    }
}
const map1: Course = {
    walls: [
        { "startPos": { "x": 0, "y": 0 }, "endPos": { "x": 0, "y": 901 } },
        { "startPos": { "x": 0, "y": 0 }, "endPos": { "x": 1315, "y": 0 } },
        { "startPos": { "x": 1315, "y": 901 }, "endPos": { "x": 1315, "y": 0 } },
        { "startPos": { "x": 1315, "y": 901 }, "endPos": { "x": 0, "y": 901 } },
        { "startPos": { "x": 46, "y": 72 }, "endPos": { "x": 1013, "y": 79 } },
        { "startPos": { "x": 1014, "y": 79 }, "endPos": { "x": 1095, "y": 79 } },
        { "startPos": { "x": 1095, "y": 79 }, "endPos": { "x": 1171, "y": 96 } },
        { "startPos": { "x": 1172, "y": 97 }, "endPos": { "x": 1187, "y": 142 } },
        { "startPos": { "x": 1184, "y": 130 }, "endPos": { "x": 1208, "y": 212 } },
        { "startPos": { "x": 1208, "y": 214 }, "endPos": { "x": 1213, "y": 804 } },
        { "startPos": { "x": 49, "y": 167 }, "endPos": { "x": 171, "y": 166 } },
        { "startPos": { "x": 171, "y": 167 }, "endPos": { "x": 922, "y": 176 } }, 
        { "startPos": { "x": 922, "y": 176 }, "endPos": { "x": 1007, "y": 180 } },
        { "startPos": { "x": 1010, "y": 181 }, "endPos": { "x": 1056, "y": 204 } },
        { "startPos": { "x": 1059, "y": 206 }, "endPos": { "x": 1074, "y": 243 } },
        { "startPos": { "x": 1075, "y": 245 }, "endPos": { "x": 1083, "y": 297 } },
        { "startPos": { "x": 1082, "y": 302 }, "endPos": { "x": 1084, "y": 799 } },
        { "startPos": { "x": 45, "y": 67 }, "endPos": { "x": 45, "y": 160 } },
        { "startPos": { "x": 1085, "y": 802 }, "endPos": { "x": 1209, "y": 810 } }],
    startPos: { x: 102, y: 113 },
    finishPos: { x: 1138, y: 745 }
}
const map2: Course = {
    walls: [],
    startPos: {
        x: 0,
        y: 0
    },
    finishPos: {
        x: 0,
        y: 0
    }
}
const map3: Course = {
    walls: [],
    startPos: {
        x: 0,
        y: 0
    },
    finishPos: {
        x: 0,
        y: 0
    }
}