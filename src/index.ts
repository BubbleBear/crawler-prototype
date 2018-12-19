import Fetcher from './fetcher';
import { extract } from './url';

(async () => {
    const fetcher = new Fetcher('http://www.xiaomi.com');

    let res: any = await fetcher.fetch();

    res = extract(res.toString());

    console.log(res)
})()
