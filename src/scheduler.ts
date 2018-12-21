import * as url from 'url';
import Fetcher from './fetcher';
import { extract } from './url';

enum taskStatus {
    pending,
    running,
    done,
    failed,
}

export interface Task {
    url: string,
    depth: number,
    status: taskStatus,
    fetcher: Fetcher,
    error?: Error,
}

export default class Scheduler {
    pendingTasks: Task[] = [];

    runningTasks: Task[] = [];

    failedTasks: Task[] = [];

    parallelSize: number;

    depth?: number;

    visited: Set<string> = new Set;

    constructor(seeds: string[], depth?: number, parallelSize: number = 5) {
        this.depth = depth;
        this.parallelSize = parallelSize;

        this.pendingTasks = seeds.map(url => this.newTask(url));
    }

    public dispatch(count: number = this.parallelSize, offset: number = 0) {
        this.runningTasks = this.runningTasks.filter(task => task.status === taskStatus.running);

        this.pendingTasks = this.pendingTasks.filter(task => typeof this.depth === 'number' && task.depth < this.depth || true)
        
        const todoTasks = this.pendingTasks.splice(offset, count - this.runningTasks.length);

        todoTasks.forEach(task => {
            this.runningTasks.push(task);
            this.runTask(task);
        })
    }

    runTask(task: Task) {
        task.status = taskStatus.running;

        task.fetcher
        .once('end', async (document: Buffer | Promise<Buffer>) => {
            const docString = (await document).toString();
            task.status = taskStatus.done;

            extract(docString).forEach(url => {
                !this.visited.has(url) && this.visited.add(url) && this.pendingTasks.push(
                    this.newTask(url, task.depth + 1)
                );
            });

            this.handler(docString, task.url);
            this.dispatch();
        })
        .on('error', (err: Error) => {
            task.status = taskStatus.failed;
            task.error = err;
            this.failedTasks.push(task);
            this.dispatch();
        })
        .fetch();
    }

    newTask(url: string, depth: number = 0) {
        return {
            url,
            depth,
            status: taskStatus.pending,
            fetcher: new Fetcher(url),
        };
    }

    handler(document: string, url: string) {
        ;
    }
}
