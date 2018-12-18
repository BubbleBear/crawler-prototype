import Fetcher from './fetcher';

(async () => {
    const fetcher = new Fetcher('https://www.zhihu.com');

    const res = await fetcher.fetch();
    console.log(res.toString());
})()
