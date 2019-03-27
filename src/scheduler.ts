import { EventEmitter } from 'events';

import { LinkedList } from './list';

export enum TaskStatus {
    pending,
    running,
    done,
    failed,
}

export interface Task {
    status: TaskStatus;
    do(): Promise<any>;
    error?: Error;
    [prop: string]: any;
}

export interface SchedulerOptions {
    parallelSize?: number;
    newTask?(...args: any[]): Task;
    onDone?(result: any, task?: Task): any;
    onError?(error: Error, task?: Task): any;
    [prop: string]: any;
}

export default class Scheduler extends EventEmitter {
    pendingTasks: LinkedList<Task> = new LinkedList();

    runningTasks: LinkedList<Task> = new LinkedList();

    failedTasks: LinkedList<Task> = new LinkedList();

    parallelSize!: number;

    constructor(options: SchedulerOptions = {}) {
        super();

        this.destructOptions(options);
    }

    public async dispatch() {
        this.schedule();

        while (!this.runningTasks.empty()) {
            this.runningTasks.forEach(node => node.value.status !== TaskStatus.running && this.runTask(node.value));

            await new Promise((resolve) => {
                this.once('dispatch', resolve);
            });
        }
    }

    private schedule(offset: number = 0) {
        this.runningTasks.forEach(node => (node.value.status === TaskStatus.running) || node.delete());

        const todoTasks = this.pendingTasks.splice(offset, this.parallelSize - this.runningTasks.length);

        todoTasks.forEach(node => this.runningTasks.push(node.value));
    }

    private async runTask(task: Task) {
        task.status = TaskStatus.running;

        try {
            task.status = TaskStatus.done;
            const result = await task.do();

            await this.onDone(result, task);
        } catch (error) {
            task.status = TaskStatus.failed;
            task.error = error;

            await this.onError(error, task);
        }

        this.schedule();

        this.emit('dispatch');

        return;
    }

    destroy() {
        this.pendingTasks.destroy();
        this.dispatch = (...args: any[]) => {
            return new Promise((resolve) => {
                resolve(true as any);
            });
        };
    }

    newTask(...args: any[]): Task {
        return {
            status: TaskStatus.pending,
            do: () => new Promise(() => {}),
        };
    }

    onDone(result: any, task: Task) {
        ;
    }

    onError(error: Error, task: Task) {
        ;
    }

    private destructOptions(options: SchedulerOptions) {
        ;({
            parallelSize: this.parallelSize = 5,
            onDone: this.onDone = this.onDone,
            onError: this.onError = this.onError,
            newTask: this.newTask = this.newTask,
        } = options as any);
    }
}
