import { URL } from 'url';

const defaultPatterns = [
    /(?:")(https?:)?\/\/[\w\$\-\_\.\+\!\*\'\(\)\,\;\/\?\:\@\=\&]+(?=")/g,
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
    [x: string]: any;
}

export function extract(document: string, patterns: Array<RegExp> = defaultPatterns): Array<string> {
    const urls =
        patterns
            .map(reg => document.match(reg))
            .reduce((acc: Array<string>, cur) => {
                cur && (acc = acc.concat(cur))
                return acc
            }, [])
            .map(matches => matches.replace('"', ''))
            .map(url => url.replace(/^(?=\/\/)/, 'http:'));

    return urls;
}

export function parse(url: string | URL | URLObject): URLObject {
    let object: URLObject;

    if (typeof url === 'string') {
        const rough = analyze(url);

        object = {
            href: rough[0],
            protocol: rough[1],
            host: rough[2],
            path: rough[3],
        };
    } else if (url instanceof URL) {
        object = URL2Object(url);
    } else {
        object = url;
    }

    return Object.keys(object).reduce((cur, key) => {
        object[key] && (cur[key] = object[key]);
        return cur;
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
    const matches = urllike.match(/^(https?:)?(?:\/\/)?([^\/]+)?(\/.*)?$/);

    if (matches === null) {
        throw new TypeError();
    }

    return matches;
}
