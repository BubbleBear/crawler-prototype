import { URL } from 'url';

const defaultPatterns = [
    /(?<=<a.+href\s*=\s*")([^"]*)(?=")/g,
];

export interface URLObject {
    hash?: string;
    host?: string;
    hostname?: string;
    href?: string;
    origin?: string;
    password?: string;
    pathname?: string;
    port?: number | string;
    protocol?: string;
    search?: string;
    username?: string;
    auth?: string;
    path?: string;
    [prop: string]: any;
}

export function extract(document: string, defaultHost?: string, patterns: Array<RegExp> = defaultPatterns): Array<string> {
    const urls =
        patterns
            .map(reg => document.match(reg)!)
            .reduce((acc, cur) => {
                cur && (acc = acc.concat(cur));
                return acc;
            }, [])
            .map(url => {
                let obj = parse(url);

                obj.host || defaultHost && (obj = Object.assign(obj, parse(defaultHost)));

                return url;
            });

    return urls;
}

export function parse(url: string | URL | URLObject): URLObject {
    let object: URLObject;

    if (typeof url === 'string') {
        const matches = analyze(url);

        object = {
            href: matches[0],
            protocol: matches[1],
            hostname: matches[2],
            port: matches[3],
            path: matches[4],
            host: matches[2] && `${matches[2]}${matches[3] && ':' + matches[3] || ''}`,
        };
    } else if (url instanceof URL) {
        object = URL2Object(url);
    } else {
        object = url;
    }

    return Object.keys(object).reduce((acc, key) => {
        object[key] && (acc[key] = object[key]);
        return acc;
    }, {} as URLObject);
}

export function URL2Object(url: URL): URLObject {
    return {
        hash: url.hash || undefined,
        host: url.host || undefined,
        hostname: url.hostname || undefined,
        href: url.href || undefined,
        origin: url.origin || undefined,
        password: url.password || undefined,
        pathname: url.pathname || undefined,
        port: url.port || undefined,
        protocol: url.protocol || undefined,
        search: url.search || undefined,
        username: url.username || undefined,
        auth: url.username && url.password && `${url.username}:${url.password}` || undefined,
        path: url.pathname && url.search && `${url.pathname}?${url.search}` || undefined,
    };
}

function analyze(urllike: string) {
    const matches = urllike.match(/^(https?:)?(?:\/\/)?([^:\/]+)?(?::)?([^\/]+)?(\/.*)?$/);

    if (matches === null) {
        throw new TypeError();
    }

    return matches;
}

if (require.main === module) {
    const a = 'localhost:4000';

    const b = parse(a);

    console.log(b);

    const c = 'https://www.incnjp.com/forum.php';

    const d = parse(c);

    console.log(d);

    const e = '/en/intro/';

    const f = parse(e);

    console.log(f);

    const g = '<a class="btn btn-primary" href="/en/intro/quickstart.html">Get Started</a>';

    const h = defaultPatterns[0][Symbol.match](g);

    console.log(h);
}
