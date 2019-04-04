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
    newTask?(...args: any[]): Task | Promise<Task>;
    onDone?(result: any, task?: Task): any;
    onError?(error: Error, task?: Task): any;
    [prop: string]: any;
}

export default class Scheduler extends EventEmitter {
    pendingTasks: LinkedList<Task> = new LinkedList();

    runningTasks: LinkedList<Task> = new LinkedList();

    parallelSize!: number;

    constructor(options: SchedulerOptions = {}) {
        super();

        this.destructOptions(options);
    }

    public async dispatch() {
        this.schedule();

        while (!this.runningTasks.empty()) {
            this.runningTasks.forEach(node => node.value.status < TaskStatus.running && this.runTask(node.value));

            await new Promise((resolve) => {
                this.once('dispatch', resolve);
            });
        }
    }

    public push(...args: any[]) {
        const newTask = this.newTask(...args);
        this.pendingTasks.push(newTask);

        return this;
    }

    public async asyncPush(...args: any[]) {
        const newTask = await this.newTask(...args);
        this.pendingTasks.push(newTask);

        return this;
    }

    public destroy() {
        this.pendingTasks.destroy();
        this.schedule = () => {};
    }

    private schedule(offset: number = 0) {
        this.runningTasks.forEach(node => node.value.status > TaskStatus.running && node.delete());

        const todoTasks = this.pendingTasks.splice(offset, this.parallelSize - this.runningTasks.length);

        todoTasks.forEach(node => this.runningTasks.push(node.value));
    }

    private async runTask(task: Task) {
        task.status = TaskStatus.running;

        try {
            const result = await task.do();
            task.status = TaskStatus.done;
            
            await this.onDone(result, task);
        } catch (error) {
            task.error = error;
            task.status = TaskStatus.failed;
            
            await this.onError(error, task);
        }

        this.schedule();
        this.emit('dispatch');
    }

    private newTask(...args: any[]): Task {
        return {
            status: TaskStatus.pending,
            do: () => new Promise(() => {}),
        };
    }

    private onDone(result: any, task: Task) {
        ;
    }

    private onError(error: Error, task: Task) {
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

if (require.main === module) {
    !async function() {
        const schd = new Scheduler({
            parallelSize: 3,
            async newTask(n) {
                return {
                    status: TaskStatus.pending,
                    do: async () => await n,
                };
            },
            async onDone(n, task) {
                console.log(n)
                // console.log('pending length: ', schd.pendingTasks.length)
                // console.log('running length: ', schd.runningTasks.length)
                console.log('pending: ', schd.pendingTasks.map(node => node.value.status.toString()).toArray().join(', '));
                console.log('running: ', schd.runningTasks.map(node => node.value.status.toString()).toArray().join(', '));
                console.log('\n');

                await schd.asyncPush(n + 5);

                await new Promise(r => {
                    setTimeout(() => {
                        r();
                    }, 1000);
                })
            }
        });
    
        await Promise.all(Array(5).fill(0).map(async (_, k) => {
            return await schd.asyncPush(k);
        }));
    
        await schd.dispatch();
    }()
}
