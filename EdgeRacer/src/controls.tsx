export class Controls {
    components : ControlInterface[];

    constructor(components : ControlInterface[]) {
        this.components = components;
        let htmlcontrols = document.getElementsByName('controls');

        for (let i = 0; i < htmlcontrols.length; i++) {
            (htmlcontrols[i] as HTMLInputElement).checked = false;
            htmlcontrols[i].addEventListener('change', () => this.handleControlChange(htmlcontrols));
        }
    }

    handleControlChange = (htmlcontrols: NodeListOf<HTMLElement>) => {
        // find what has been checked
        let selectedControl = "";
        for (let i = 0; i < htmlcontrols.length; i++) {
            if ((htmlcontrols[i] as HTMLInputElement).checked) {
                selectedControl = (htmlcontrols[i] as HTMLInputElement).value;
                // Perform actions based on the selected control option
                console.log('Selected Control:', selectedControl);
                break;
            }
        }

        // set the selected control to be active, all others are set negative
        this.components.forEach((c)=>{
            c.setActive(c.htmlFormValue === selectedControl)
        })
    }
}