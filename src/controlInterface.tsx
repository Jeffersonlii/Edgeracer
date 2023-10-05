// this interface defines the minimum requirements a 'control component'
// control components are the logical handlers for the 'action' that the user selects 
// such as 'build', 'erase' ... 

interface ControlInterface {
    // this is the html form value of the component
    htmlFormValue : string; 

    // Component is set active or inactive. handles loading and unloading logic (subscriptions, event listeners ...)
    setActive : (isActive: boolean) => void; 

    // Destroy all makings of the component (ex. walls for building component ...)
    destroyAll : () => void;
}