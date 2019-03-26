import Fetcher, { FetcherOptions } from './fetcher';
import * as u from './url';
import Scheduler, { Task, TaskStatus } from './scheduler';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { exec } from 'child_process';

import heapdump from 'heapdump';

;(async () => {
    await exec(`rm ${__dirname}/../heapdump/*`);
    await exec(`rm ${__dirname}/../data/*`);

    let c = 1;

    setInterval(() => {
        heapdump.writeSnapshot(`${__dirname}/../heapdump/${Date.now()}.heapsnapshot`);
    }, 10000);

    const requestOptions = {
        timeout: 3000,
        headers: {
        },
    };

    const visited = new Set<string>();

    function urlFilter(url: string): boolean {
        if (/\.(js)|(css)|(jpg)|(jpeg)|(gif)|(png)|(mp3)|(mp4)|(pdf)|(swf)$/.test(url)) {
            return false;
        }

        return true;
    }

    const schd = new Scheduler([
        // 'http://www.xiaomi.com',
        // 'http://www.boqii.com/',
        // 'http://shop.test.9now.net',
        'http://sports.sina.com.cn/',
    ], {
        depth: 2,
        newTask(url: string, depth: number = 0) {
            const task = {
                url,
                do: () => task.fetcher.fetch(),
                depth,
                status: TaskStatus.pending,
                fetcher: new Fetcher(url, requestOptions),
                order: c++,
            };

            return task;
        },
        onDone: async (document: Buffer, task: Task) => {
            const docString = (await document).toString();
            u.extract(docString).forEach(url => {
                url && urlFilter(url) && !visited.has(url) && visited.add(url)
                && schd.pendingTasks.push(
                    schd.newTask(url, task.depth + 1)
                );
            });

            console.log(task.url)
            console.log((task.fetcher as Fetcher).request.connection.remoteAddress)
            console.log(task.order)
            console.log(task.depth)
            console.log(schd.pendingTasks.length)
            console.log(schd.runningTasks.length)
            console.log(schd.failedTasks.length)
            console.log('\n')
            // fs.writeFileSync(`./data/${createHash('md5').update(task.url).digest('hex')}`, document);
            // fs.writeFileSync(`./data/${task.order}`, document);
            await Promise.resolve(((resolve: any) => {
                setTimeout(() => {
                    resolve(true)
                }, 1000);
            }))
        },
        onError: async (error: Error, task: Task) => {
            console.log(task.url, error);
            console.log((task.fetcher as Fetcher).request.connection.remoteAddress)
            console.log(task.order)
            console.log(task.depth)
            console.log(schd.pendingTasks.length)
            console.log(schd.runningTasks.length)
            console.log(schd.failedTasks.length)
            console.log('\n')
            await Promise.resolve(((resolve: any) => {
                setTimeout(() => {
                    resolve(true)
                }, 1000);
            }))
        },
    });

    await schd.dispatch();

    console.log('all done')
})()
