import * as url from 'url';
import Fetcher from './fetcher';

enum taskStatus {
    pending,
    running,
    done,
    suspended,
}

export interface Task {
    url: string,
    depth: number,
    status: taskStatus,
    fetcher: Fetcher,
}

export default class Scheduler {
    pendingTasks: Task[] = [];

    runningTasks: Task[] = [];

    depth?: number;

    constructor(seeds: string[], depth?: number) {
        this.depth = depth;
    }

    public dispatch(count: number, offset: number = 0) {
        const todoTasks = this.pendingTasks.splice(offset, count);

        todoTasks.forEach(task => {
            this.runTask(task);
            this.runningTasks.push(task);
        })
    }

    runTask(task: Task) {
        task.status = taskStatus.running;
        task.fetcher.fetch();
    }
}
