import { URL } from 'url';

const defaultPatterns = [
    /(?:")(https?:)?\/\/[\w\$\-\_\.\+\!\*\'\(\)\,\;\/\?\:\@\=\&]+(?=")/g,
];

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

export function URL2Object(url: URL) {
    return {
        hash: url.hash,
        host: url.host,
        hostname: url.hostname,
        href: url.href,
        origin: url.origin,
        password: url.password,
        pathname: url.pathname,
        port: url.port,
        protocol: url.protocol,
        search: url.search,
        username: url.username,
    };
}
