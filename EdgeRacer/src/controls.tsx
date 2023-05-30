import { StartingGoal } from "./StartingGoal";
import { Building } from "./building";
import { Eraser } from "./eraser";
import { FinishGoal } from "./finishGoal";

type Mode = 'buildWall' | 'eraseWall' | 'addStartLine' | 'addFinishLine';
export class Controls {
    controls: NodeListOf<HTMLElement>;
    bc: Building;
    ec: Eraser;
    sgc: StartingGoal;
    fgc: FinishGoal;
    constructor(bc: Building, ec: Eraser, sgc: StartingGoal, fgc: FinishGoal) {
        this.controls = document.getElementsByName('controls');
        this.bc = bc;
        this.ec = ec;
        this.sgc = sgc;
        this.fgc = fgc;

        for (let i = 0; i < this.controls.length; i++) {
            (this.controls[i] as HTMLInputElement).checked = false;
            this.controls[i].addEventListener('change', this.handleControlChange.bind(this));
        }

        document.getElementById('destroyButton')?.addEventListener('click', () => {
            this.bc.destroyAll();
            this.sgc.destroyAll();
            this.fgc.destroyAll();
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
        this.sgc.setGoalMode(false);
        this.fgc.setGoalMode(false);

        switch (selectedControl) {
            case 'buildWall':
                this.bc.setBuildingMode(true);
                break;
            case 'eraseWall':
                this.ec.setEraseMode(true);
                break;
            case 'addStartLine':
                this.sgc.setGoalMode(true);
                break;
            case 'addFinishLine':
                this.fgc.setGoalMode(true);
                break;    
            default:
        }

    }
}