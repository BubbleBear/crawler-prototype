const defaultPatterns = [
    /"(https?:)?\/\/[\w\$\-\_\.\+\!\*\'\(\)\,\;\/\?\:\@\=\&]+"/g,
];

export function extract(document: string, patterns: Array<RegExp> = []): Array<string> {
    const urls = patterns
                    .concat(defaultPatterns)
                    .map(reg => document.match(reg))
                    .reduce((acc: Array<string>, cur) => {
                        cur && (acc = acc.concat(cur))
                        return acc
                    }, []) as Array<string>;

    return urls;
}
