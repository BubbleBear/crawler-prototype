import Fetcher, { FetcherOptions } from './fetcher';
import { extract } from './url';

export enum TaskStatus {
    pending,
    running,
    done,
    failed,
}

export interface Task {
    status: TaskStatus;
    handle(task: Task): Promise<any>;
    error?: Error;
    [prop: string]: any;
}

export interface SchedulerOptions {
    depth?: number;
    parallelSize?: number;
    requestOptions?: FetcherOptions;
    newTask?(...args: any[]): Task;
    handler?(document: string, task?: Task): any;
    errorHandler?(error: Error, task?: Task): any;
    [prop: string]: any;
}

export default class Scheduler {
    pendingTasks: Task[] = [];

    runningTasks: Task[] = [];

    failedTasks: Task[] = [];

    parallelSize!: number;

    depth?: number;

    requestOptions?: FetcherOptions;

    visited: Set<string> = new Set;

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
        }))
    }

    async runTask(task: Task) {
        task.status = TaskStatus.running;

        return new Promise((resolve, reject) => {
            task.handle(task)
            .then(async (document: Buffer) => {
                const docString = (await document).toString();
                task.status = TaskStatus.done;

                extract(docString).forEach(url => {
                    this.urlFilter(url) && !this.visited.has(url) && this.visited.add(url)
                    && this.pendingTasks.push(
                        this.newTask(url, task.depth + 1)
                    );
                });

                await this.handler(docString, task);
                resolve(this.dispatch());
            })
            .catch(async (error: Error) => {
                task.status = TaskStatus.failed;
                task.error = error;

                await this.errorHandler(error, task);
                resolve(this.dispatch());
            });
        });
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
            handle: (task: Task) => new Promise(() => {}),
        };
    }

    handler(document: string, task: Task) {
        ;
    }

    errorHandler(error: Error, task: Task) {
        ;
    }

    urlFilter(url: string): boolean {
        return true;
    }

    private destructOptions(options: SchedulerOptions) {
        ({
            depth: this.depth,
            parallelSize: this.parallelSize = 5,
            requestOptions: this.requestOptions,
            urlFilter: this.urlFilter,
            handler: this.handler = this.handler,
            errorHandler: this.errorHandler = this.errorHandler,
            newTask: this.newTask = this.newTask,
        } = options as any);
    }
}
