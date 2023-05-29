import { Building } from "./building";
import { Eraser } from "./eraser";

type Mode = 'buildWall' | 'eraseWall' | 'addStartLine' | 'addFinishLine';
export class Controls {
    controls: NodeListOf<HTMLElement>;
    bc: Building;
    ec: Eraser;
    constructor(bc: Building, ec: Eraser) {
        this.controls = document.getElementsByName('controls');
        this.bc = bc;
        this.ec = ec;

        for (let i = 0; i < this.controls.length; i++) {
            (this.controls[i] as HTMLInputElement).checked = false;
            this.controls[i].addEventListener('change', this.handleControlChange.bind(this));
        }

        document.getElementById('destroyButton')?.addEventListener('click', () => {
            this.bc.destroyAll();
        });
    }

    handleControlChange() {

        // find what has been checked
        let selectedControl = "";
        for (let i = 0; i < this.controls.length; i++) {
            if ((this.controls[i] as HTMLInputElement).checked) {
                selectedControl = (this.controls[i] as HTMLInputElement).value;
                // Perform actions based on the selected control option
                console.log('Selected Control:', selectedControl);
                break;
            }
        }

        // enable only the selected mode
        this.enableMode(selectedControl as Mode);

    }

    disableAllModes() {
    }

    enableMode(selectedControl: Mode) {
        this.bc.setBuildingMode(false)
        this.ec.setEraseMode(false);


        switch (selectedControl) {
            case 'buildWall':
                this.bc.setBuildingMode(true);
                break;
            case 'eraseWall':
                this.ec.setEraseMode(true);
                break;
            default:
            // code block
        }

    }
}