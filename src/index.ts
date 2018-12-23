import Fetcher from './fetcher';
import * as u from './url';
import { URL } from 'url';
import Scheduler, { Task } from './scheduler';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { exec } from 'child_process';

(async () => {
    await exec(`rm ${__dirname}/../data/*`);

    const schd = new Scheduler([
        'http://www.xiaomi.com',
        // 'http://shop.test.9now.net',
    ], {
        depth: 2,
        fetcherTimeout: 3000,
        urlFilter: (url: string): boolean => {
            if (/\.(js)|(css)|(jpg)|(jpeg)|(gif)|(png)|(mp3)|(mp4)|(pdf)|(swf)$/.test(url)) {
                return false;
            }

            return true;
        },
        handler: (document: string, task: Task) => {
            // console.log(task.url)
            // console.log(task.depth)
            // console.log(schd.pendingTasks)
            // console.log(schd.runningTasks)
            // console.log(schd.failedTasks)
            console.log('\n')
            fs.writeFileSync(`./data/${createHash('md5').update(task.url).digest('hex')}`, document);
        }
    });

    schd.dispatch();

    // const f = new Fetcher('http://shop.test.9now.net',);
    // try {
    //     const r = await f.fetch();
    // } catch (e) {
    //     console.log(e)
    // }

    // const a = 'http://shop.test.9now.net/0';
    // const x = u.parse(a);
    // console.log(x)
})()
