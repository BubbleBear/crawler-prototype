import Fetcher from './fetcher';
import { extract } from './url';
import Scheduler from './scheduler';
import * as fs from 'fs';
import { createHash } from 'crypto';

(async () => {
    const schd = new Scheduler([
        'http://www.xiaomi.com',
    ], 2);

    schd.handler = async (document: string, url: string) => {
        console.log(url)
        fs.writeFileSync(`./data/${createHash('md5').update(url).digest('hex')}`, document);
    };

    schd.dispatch();
})()
