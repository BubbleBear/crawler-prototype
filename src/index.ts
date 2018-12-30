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
        // 'http://www.xiaomi.com',
        // 'http://www.boqii.com/',
        // 'http://shop.test.9now.net',
        'http://sports.sina.com.cn/',
    ], {
        depth: 2,
        requestOptions: {
            timeout: 3000,
            headers: {
            },
        },
        urlFilter: (url: string): boolean => {
            if (/\.(js)|(css)|(jpg)|(jpeg)|(gif)|(png)|(mp3)|(mp4)|(pdf)|(swf)$/.test(url)) {
                return false;
            }

            return true;
        },
        handler: async (document: string, task: Task) => {
            console.log(task.url)
            console.log(task.depth)
            // console.log(schd.pendingTasks)
            // console.log(schd.runningTasks)
            // console.log(schd.failedTasks)
            console.log('\n')
            fs.writeFileSync(`./data/${createHash('md5').update(task.url).digest('hex')}`, document);
            await new Promise((resolve => {
                setTimeout(() => {
                    resolve(true)
                }, 1000);
            }))
        },
        errorHandler: (error: Error, task: Task) => {
            // console.log(task.url, error);
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
