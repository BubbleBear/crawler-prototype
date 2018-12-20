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
