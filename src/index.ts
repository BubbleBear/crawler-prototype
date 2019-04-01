import { exec } from 'child_process';
import * as fs from 'fs';

// import heapdump from 'heapdump';

import Fetcher, { FetcherOptions } from './fetcher';
import * as u from './url';
import Scheduler, { Task, TaskStatus } from './scheduler';
import { LinkedList } from './list';
import { URLObject, parse } from './url';

!async function() {
    await exec(`rm ${__dirname}/../heapdump/*`);
    await exec(`rm ${__dirname}/../data/*`);

    const seed = '0.0.0.0:4000';

    const host = parse(seed).hostname;

    let c = 1;

    // setInterval(() => {
    //     heapdump.writeSnapshot(`${__dirname}/../heapdump/${Date.now()}.heapsnapshot`);
    // }, 10000);

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

        const u = parse(url);

        const h = u.hostname;

        if (h !== host) {
            return false;
        }

        return true;
    }

    const schd = new Scheduler({
        newTask(url: string, depth: number = 0) {
            const task = {
                url,
                do: () => task.fetcher.fetch(),
                status: TaskStatus.pending,
                fetcher: new Fetcher(url, requestOptions),
                depth,
                id: c++,
            };

            return task;
        },
        onDone: async (document: Buffer, task: Task) => {
            const docString = (await document).toString();
            u.extract(docString).forEach(url => {
                console.log(url)
                url && urlFilter(url) && !visited.has(url) && visited.add(url)
                && schd.push(url, task.depth + 1);
            });

            console.log('url: ', task.url)
            console.log('ip: ', (task.fetcher as Fetcher).request.connection.remoteAddress)
            console.log('id: ', task.id)
            console.log('depth: ', task.depth)
            console.log('pending length: ', schd.pendingTasks.length)
            console.log('running length: ', schd.runningTasks.length)
            console.log('\n')
            // fs.writeFileSync(`./data/${createHash('md5').update(task.url).digest('hex')}`, document);
            fs.writeFileSync(`./data/${task.id}`, document);
            await new Promise((resolve: any) => {
                setTimeout(() => {
                    resolve(true)
                }, 1000);
            });
        },
        onError: async (error: Error, task: Task) => {
            console.log('url: ', task.url, error)
            console.log('ip: ', (task.fetcher as Fetcher).request.connection.remoteAddress)
            console.log('id: ', task.id)
            console.log('depth: ', task.depth)
            console.log('pending length: ', schd.pendingTasks.length)
            console.log('running length: ', schd.runningTasks.length)
            console.log('\n')
            await new Promise((resolve: any) => {
                setTimeout(() => {
                    resolve(true)
                }, 1000);
            });
        },
    });

    schd.push(seed);

    await schd.dispatch();

    console.log('all done');

    return;
}()
