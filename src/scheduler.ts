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

            console.log('running before dispatch', this.runningTasks.length)

            await new Promise((resolve) => {
                this.once('dispatch', resolve);
            });

            console.log(4)

            console.log('running after dispatch', this.runningTasks.length)
        }
    }

    private schedule(offset: number = 0) {
        console.log(1)
        this.runningTasks.forEach(node => (node.value.status === TaskStatus.running) || node.delete());

        console.log('pending before schedule', this.pendingTasks.length)
        // console.log(this.runningTasks.length)

        const todoTasks = this.pendingTasks.splice(offset, this.parallelSize - this.runningTasks.length);

        console.log('todo', todoTasks.length)
        console.log('pending after schedule', this.pendingTasks.length)

        todoTasks.forEach(node => this.runningTasks.push(node.value));
    }

    private async runTask(task: Task) {
        console.log(2)
        task.status = TaskStatus.running;

        try {
            const result = await task.do();
            task.status = TaskStatus.done;
            console.log(3)

            await this.onDone(result, task);
        } catch (error) {
            task.error = error;
            task.status = TaskStatus.failed;

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

if (require.main === module) {
    !async function() {
        const schd = new Scheduler({
            parallelSize: 10,
            newTask(n) {
                return {
                    status: TaskStatus.pending,
                    do: async () => await n,
                };
            },
            async onDone(n, task) {
                // console.log('pending length: ', schd.pendingTasks.length)
                // console.log('running length: ', schd.runningTasks.length)
                // console.log('failed length: ', schd.failedTasks.length)

                schd.pendingTasks.push(schd.newTask(n + 10));

                await new Promise(r => {
                    setTimeout(() => {
                        r();
                    }, 1000);
                })
            }
        });
    
        Array(20).fill(0).forEach((_, k) => {
            schd.pendingTasks.push(schd.newTask(k));
        });
    
        await schd.dispatch();
    }()
}
