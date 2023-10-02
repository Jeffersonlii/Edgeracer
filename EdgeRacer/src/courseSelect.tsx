import { Building, WallCoordinate } from './building';

export class CourseSelect {
    selectElement: HTMLInputElement;
    bc: Building;
    constructor(buildingComponent: Building) {
        this.bc = buildingComponent;
        this.selectElement = document.getElementById('courses') as HTMLInputElement;
        this.selectElement.value = 'def';
        this.selectElement.addEventListener('change', this.handleChange);
    }

    handleChange = (e: Event) => {
        const selectedValue = (e.target as HTMLSelectElement).value;
        console.log(`Selected value: ${selectedValue}`);

        const controlsElement = document.getElementById('controls') as HTMLInputElement;
        controlsElement.classList.add('hidden');
        switch (selectedValue) {
            case 'course1':
                this.bc.createMap(map1);
                break;
            case 'course2':
                this.bc.createMap(map2);
                break;
            case 'course3':
                this.bc.createMap(map3);
                break;
            case 'custom':
                controlsElement.classList.remove('hidden');
                break;
            default:
                break;
        }
    }
}
const map1: WallCoordinate[] = [

]
const map2: WallCoordinate[] = [

]
const map3: WallCoordinate[] = [

]