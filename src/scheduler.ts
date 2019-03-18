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
    depth?: number;
    parallelSize?: number;
    newTask?(...args: any[]): Task;
    onDone?(result: any, task?: Task): any;
    onError?(error: Error, task?: Task): any;
    [prop: string]: any;
}

export default class Scheduler {
    pendingTasks: Task[] = [];

    runningTasks: Task[] = [];

    failedTasks: Task[] = [];

    parallelSize!: number;

    depth?: number;

    constructor(seeds: string[], options: SchedulerOptions = {}) {
        this.destructOptions(options);
        this.pendingTasks = seeds.map(url => this.newTask(url));
    }

    public async dispatch(count: number = this.parallelSize, offset: number = 0) {
        this.runningTasks = this.runningTasks.filter(task => task.status === TaskStatus.running);

        this.pendingTasks = this.pendingTasks.filter(task => typeof this.depth === 'number' && task.depth < this.depth || true)
        
        const todoTasks = this.pendingTasks.splice(offset, count - this.runningTasks.length);

        return Promise.all(todoTasks.map(task => {
            this.runningTasks.push(task);
            return this.runTask(task);
        }));
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

        await this.dispatch();

        return;
    }

    destroy() {
        this.pendingTasks = [];
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
            depth: this.depth,
            parallelSize: this.parallelSize = 5,
            onDone: this.onDone = this.onDone,
            onError: this.onError = this.onError,
            newTask: this.newTask = this.newTask,
        } = options as any);
    }
}
