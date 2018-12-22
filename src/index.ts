import Fetcher from './fetcher';
import { extract } from './url';
import Scheduler, { Task } from './scheduler';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { exec } from 'child_process';

(async () => {
    await exec(`rm ${__dirname}/../data/*`);

    const schd = new Scheduler([
        'http://www.xiaomi.com',
    ], {
        depth: 2,
        fetcherTimeout: 3000,
        urlFilter: (url: string): boolean => {
            if (/\.(js)|(css)|(jpg)|(jpeg)|(gif)|(png)$/.test(url)) {
                return false;
            }

            return true;
        },
        handler: (document: string, task: Task) => {
            console.log(task.url)
            console.log(task.depth)
            // console.log(schd.pendingTasks)
            // console.log(schd.runningTasks)
            // console.log(schd.failedTasks)
            console.log('\n')
            fs.writeFileSync(`./data/${createHash('md5').update(task.url).digest('hex')}`, document);
        }
    });

    schd.dispatch();
})()
