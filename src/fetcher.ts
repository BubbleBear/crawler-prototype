import * as http from 'http';
import * as https from 'https';
import { parse } from 'url';
import { EventEmitter } from 'events';

import { URL2Object } from './url';

export interface Options extends https.RequestOptions {
    
}

export default class Fetcher extends EventEmitter {
    public url: string;

    request: http.ClientRequest;

    response?: http.IncomingMessage;

    options?: Options;

    buffer: Buffer[] = [];

    errorBuffer: Error[] = [];

    constructor(url: string, options?: Options) {
        super();

        this.url = url;
        this.options = options;

        const requestOptions: https.RequestOptions = Object.assign(
            {},
            parse(this.url),
            options
        );

        switch (requestOptions.protocol) {
            case 'https:':
                this.request = https.request(requestOptions);
                break;
            default:
                this.request = http.request(requestOptions);
        }

        this.request
        .once('response', (response: http.IncomingMessage) => {
            this.response = response;
            this.emit('response');
        })
        .on('error', (error) => {
            this.errorBuffer.push(error);
        });

        this.once('response', () => {
            this.response!
            .on('data', (chunk: Buffer) => {
                this.buffer.push(chunk);
            })
            .once('end', this.onResponseEnd.bind(this))
            .on('error', (error) => {
                this.errorBuffer.push(error);
            });
        });
    }

    public async fetch(): Promise<Buffer> {
        this.errorBuffer.forEach(error => {
            this.emit('error', error);
        });

        this.request.end();

        return new Promise<Buffer>((resolve, reject) => {
            this.once('end', (buffer) => {
                resolve(buffer);
            });

            this.on('error', (error) => {
                reject(error);
                this.request.abort();
            });
        });
    }

    onResponseEnd() {
        const headers = this.response!.headers;

        if (headers && headers.location) {
            const location = headers.location;

            const url = '';

            console.log(this.url, location, url)

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
