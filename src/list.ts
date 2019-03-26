import { inspect } from 'util';

class Node<T> {
    public value?: T;

    public next?: Node<T>;

    public prev?: Node<T>;

    private _belonging: List<T>;

    constructor(list: List<T>) {
        this._belonging = list;
    }

    public delete(): List<T> {
        const belonging: any = this._belonging;
        this.prev ? (this.prev.next = this.next) : (belonging._head = belonging._head.next);
        this.next ? (this.next.prev = this.prev) : (belonging._tail = belonging._tail.prev);
        this.value = undefined;

        return this._belonging;
    }

    public toString(): string {
        const value = this.value || 'undefined';
        return value.toString && value.toString() || JSON.stringify(value);
    }

    [inspect.custom]() {
        return this.toString();
    }
}

interface List<T> {
    empty(): boolean;

    prepend(_: T): List<T>;

    append(_: T): List<T>;
}

export class LinkedList<T> implements List<T> {
    private _head?: Node<T>;

    private _tail?: Node<T>;

    constructor() {
    }

    public empty(): boolean {
        return this._head === this._tail;
    }

    public prepend(value: T): LinkedList<T> {
        const node = new Node<T>(this);
        node.value = value;

        node.next = this._head;
        this._head = this._head && (this._head.prev = node) || (this._tail = node);

        return this;
    }

    public append(value: T): LinkedList<T> {
        const node = new Node<T>(this);
        node.value = value;

        node.prev = this._tail;
        this._tail = this._tail && (this._tail.next = node) || (this._head = node);

        return this;
    }
    
    public destroy(): void {
        while (this.head) {
            this.head.delete();
        };
    }

    public get head(): Node<T> | undefined {
        return this._head;
    }

    public get tail(): Node<T> | undefined {
        return this._tail;
    }
}

if (require.main === module) {
    const linkedList = new LinkedList();
    console.log(linkedList.empty());
    console.log(linkedList.head, linkedList.tail);
    console.log('#########################################');
    linkedList.append(1);
    console.log(linkedList.empty());
    console.log(linkedList.head, linkedList.head!.next, '*', linkedList.tail);
    console.log('#########################################');
    linkedList.prepend(2);
    console.log(linkedList.head!, linkedList.head!.next, linkedList.head!.next!.next, '*', linkedList.tail);
    console.log('#########################################');
    linkedList.append(3);
    console.log(linkedList.head!, linkedList.head!.next, linkedList.head!.next!.next, linkedList.head!.next!.next!.next, '*', linkedList.tail);
    console.log('#########################################');
    linkedList.head!.next!.next!.delete();
    console.log(linkedList.head!, linkedList.head!.next, linkedList.head!.next!.next, '*', linkedList.tail);
    console.log('#########################################');
    linkedList.destroy();
    console.log(linkedList.head!)
}
