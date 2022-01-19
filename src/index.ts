import {Canvas} from './canvas';
import './web_ui/context-menu';
import './web_ui/app-dialog';
import { appState } from "./app_state/app_state";
import { AppDialog } from './web_ui/app-dialog';

function initCanvas() {
    new Canvas(document.querySelector('canvas'));
}

function firstTimeRun(projectName: string) {
    appState.addProject(projectName);
    appState.setProject(Object.values(appState.allProjects)[0]!.id);
    initCanvas();
}

// Init code.
window.onload = async () => {
    await appState.hydrate();
    if (Object.keys(appState.allProjects).length === 0) {
        const dialog = document.querySelector('app-dialog') as AppDialog;
        dialog.show({
            title: 'Name your first project',
            content: {
                type: 'text-input',
                label: 'Project Name',
                validationFn: (text: string) => text.length > 0,
            },
            callback: firstTimeRun,
            action: 'add'
        });
    } else {
        initCanvas();
    }
}