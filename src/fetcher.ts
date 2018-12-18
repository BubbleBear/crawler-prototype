import * as http from 'http';
import * as https from 'https';
import { parse } from 'url';
import { EventEmitter } from 'events';

export default class Fetcher extends EventEmitter {
    request: http.ClientRequest;

    response?: http.IncomingMessage;

    options?: object;

    buffer: Buffer[] = [];

    constructor(url: string, opt?: object) {
        super();

        this.options = opt;

        const requestOpt: https.RequestOptions = Object.assign({

        }, parse(url), opt);

        switch (requestOpt.protocol) {
            case 'https:':
                this.request = https.request(requestOpt);
                break;
            default:
                this.request = http.request(requestOpt);
        }

        this.request.once('response', (response: http.IncomingMessage) => {
            this.response = response;
            this.emit('response');
        });

        this.once('response', () => {
            this.response!
                .on('data', (chunk: Buffer) => {
                    this.buffer.push(chunk);
                })
                .once('end', this.onResponseEnd.bind(this))
                .on('error', (err) => {
                    this.emit('error', err);
                })
        });
    }

    public async fetch() {
        this.request.end();

        return new Promise((resolve, reject) => {
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

        if (location) {
            this.emit('end', new Promise(async (resolve, reject) => {
                resolve(new Fetcher(location, this.options).fetch());
            }))
        }

        this.emit('end', Buffer.concat(this.buffer));
    }
}
