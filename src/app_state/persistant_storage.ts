import localforage from "localforage";
import { SerializedState } from "../data_types";

const LOCAL_STORAGE_KEY = 'app-state';

export class PersistantStorageManager {
    private queue: SerializedState[] = [];
    private workerStopped = true;

    getState():Promise<SerializedState> {
        return localforage.getItem(LOCAL_STORAGE_KEY);
    }    
    
    saveState(state: SerializedState) {
        this.queue.push(state);
        if (this.workerStopped) {
            this.worker();
        }
    }

    async worker() {
        this.workerStopped = false;
        while (this.queue.length > 0) {
            await localforage.setItem(LOCAL_STORAGE_KEY, this.queue.shift());
        }
        this.workerStopped = true;
    }
}