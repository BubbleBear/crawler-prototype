import * as http from 'http';
import * as https from 'https';
import { parse } from 'url';
import { EventEmitter } from 'events';

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

        const requestOpt: https.RequestOptions = Object.assign({

        }, parse(url), options);

        switch (requestOpt.protocol) {
            case 'https:':
                this.request = https.request(requestOpt);
                break;
            default:
                this.request = http.request(requestOpt);
        }

        this.request
        .once('response', (response: http.IncomingMessage) => {
            this.response = response;
            this.emit('response');
        })
        .on('error', (err) => {
            this.errorBuffer.push(err);
        });

        this.once('response', () => {
            this.response!
            .on('data', (chunk: Buffer) => {
                this.buffer.push(chunk);
            })
            .once('end', this.onResponseEnd.bind(this))
            .on('error', (err) => {
                this.errorBuffer.push(err);
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

            this.on('error', (err) => {
                reject(err);
                this.request.abort();
            });
        });
    }

    onResponseEnd() {
        const location = this.response!.headers.location;

        // console.log(this.response!.headers)

        if (location) {
            return this.emit('end', new Promise(async (resolve, reject) => {
                resolve(new Fetcher(location, this.options).fetch());
            }))
        }

        this.emit('end', Buffer.concat(this.buffer));
    }
}
