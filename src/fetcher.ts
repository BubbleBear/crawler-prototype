import * as http from 'http';
import * as https from 'https';
import { EventEmitter } from 'events';

import { URLObject, parse } from './url';

export interface FetcherOptions extends https.RequestOptions {

}

export default class Fetcher extends EventEmitter {
    public url: URLObject;

    request!: http.ClientRequest;

    response!: http.IncomingMessage;

    options?: FetcherOptions;

    private buffer: Buffer[] = [];

    constructor(url: string | URL | URLObject, options?: FetcherOptions) {
        super();

        this.url = parse(url);
        this.options = options;

        this.on('request', () => {
            this.request!
                .on('response', (response: http.IncomingMessage) => {
                    this.response = response;
                    this.emit('response');
                })
                .on('error', (error) => {
                    this.request!.abort();
                    this.emit('error', error);
                });
        })

        this.on('response', () => {
            this.response!
                .on('data', (chunk: Buffer) => {
                    this.buffer.push(chunk);
                })
                .on('end', this.onResponseEnd.bind(this))
                .on('error', (error) => {
                    this.emit('error', error);
                });
        });
    }

    public async fetch(): Promise<Buffer> {
        const requestOptions: https.RequestOptions = Object.assign(
            {},
            this.url,
            this.options,
        );

        switch (requestOptions.protocol) {
            case 'https:':
                this.request = https.request(requestOptions);
                break;
            default:
                this.request = http.request(requestOptions);
        }

        this.emit('request');

        this.request.end();

        return new Promise<Buffer>((resolve, reject) => {
            this.on('end', (buffer) => {
                resolve(buffer);
            });

            this.on('error', (error) => {
                reject(error);
                this.request!.abort();
            });
        });
    }

    onResponseEnd() {
        const headers = this.response!.headers;

        if (headers && headers.location) {
            const location = headers.location;

            const url = Object.assign(
                {},
                this.url,
                parse(location),
            );

            return this.emit('end', new Promise(async (resolve, reject) => {
                try {
                    resolve(new Fetcher(url, this.options).fetch());
                } catch (error) {
                    reject(error);
                }
            }))
        }

        this.emit('end', Buffer.concat(this.buffer));
    }
}

if (require.main === module) 
(async () => {
    const fetcher = new Fetcher('http://sports.sina.com.cn/');

    console.log(fetcher.request, fetcher.response);

    const result = fetcher.fetch();

    console.log(fetcher.request.constructor.name, fetcher.response);

    await result;

    console.log(fetcher.request.constructor.name, fetcher.response.constructor.name);
})()

