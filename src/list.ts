import { inspect } from 'util';

class Node<T> {
    private _value?: T;

    private _belonging?: List<T>;

    public next?: Node<T>;

    public prev?: Node<T>;

    constructor(list: List<T>) {
        this._belonging = list;
    }

    public delete(): List<T> {
        const belonging: any = this._belonging;

        if (!belonging) {
            throw new Error(`node already deleted`);
        }

        this.prev ? (this.prev.next = this.next) : (belonging._head = belonging._head.next);
        this.next ? (this.next.prev = this.prev) : (belonging._tail = belonging._tail.prev);
        this._value = undefined;
        this.next = undefined;
        this.prev = undefined;
        this._belonging = undefined;
        belonging._length--;

        return belonging;
    }

    public get value(): T {
        return this._value!;
    }

    public set value(value: T) {
        this._value = value;
    }

    public toString(): string {
        const value = this.value || 'undefined';
        return value.toString && value.toString() || JSON.stringify(value);
    }

    [inspect.custom](): string {
        return this.toString();
    }
}

interface List<T> {
    empty(): boolean;

    unshift(_: T): List<T>;

    push(_: T): List<T>;

    readonly length: number;
}

export class LinkedList<T> implements List<T> {
    private _head?: Node<T>;

    private _tail?: Node<T>;

    private _length = 0;

    constructor() {
    }

    public static fromArray<S>(from: Array<S>): LinkedList<S> {
        const linkedList = new LinkedList<S>();
        from.forEach(v => linkedList.push(v));

        return linkedList;
    }

    public empty(): boolean {
        return !this._length;
    }

    public push(value: T): LinkedList<T> {
        const node = new Node<T>(this);
        node.value = value;

        node.prev = this._tail;
        this._tail = this._tail && (this._tail.next = node) || (this._head = node);

        this._length++;

        return this;
    }

    public unshift(value: T): LinkedList<T> {
        const node = new Node<T>(this);
        node.value = value;

        node.next = this._head;
        this._head = this._head && (this._head.prev = node) || (this._tail = node);

        this._length++;

        return this;
    }

    public forEach(callback: (node: Node<T>) => void): LinkedList<T> {
        let cursor = this.head;

        while (cursor) {
            const next = cursor.next;
            callback(cursor);
            cursor = next;
        }

        return this;
    }

    public map<S>(callback: (node: Node<T>) => S): LinkedList<S> {
        const mapping = new LinkedList<S>();
        let cursor = this.head;

        while (cursor) {
            const next = cursor.next;
            mapping.push(callback(cursor));
            cursor = next;
        }

        return mapping;
    }

    public splice(start: number, deleteCount: number): LinkedList<T> {
        const linkedList = new LinkedList<T>();
        let cursor = this.head;

        while (start-- && cursor) {
            cursor = cursor.next;
        }

        while (deleteCount-- && cursor) {
            const next = cursor.next;
            linkedList.push(cursor.value);
            cursor.delete();
            cursor = next;
        }

        return linkedList;
    }
    
    public destroy(): void {
        while (this.head) {
            this.head.delete();
        };
    }

    public get length(): number {
        return this._length;
    }

    public get head(): Node<T> | undefined {
        return this._head;
    }

    public get tail(): Node<T> | undefined {
        return this._tail;
    }

    public toArray(): T[] {
        const array: T[] = [];
        this.forEach(v => v.value && array.push(v.value));

        return array;
    }

    public toString(): string {
        let cursor = this.head;
        let nodes = [];

        while (cursor) {
            nodes.push(cursor);
            cursor = cursor.next;
        }

        return `[ ${nodes.map(node => node.toString()).join(' ')} ]`;
    }

    [inspect.custom](): string {
        return this.toString();
    }
}

if (require.main === module) {
    let linkedList = new LinkedList<number>();
    console.log(linkedList.empty());
    console.log(linkedList.head, linkedList.tail);
    console.log(linkedList.length);
    console.log('#########################################');
    linkedList.push(1);
    console.log(linkedList.empty());
    console.log(linkedList.head, linkedList.head!.next, '*', linkedList.tail);
    console.log(linkedList.length);
    console.log('#########################################');
    linkedList.unshift(2);
    console.log(linkedList.head!, linkedList.head!.next, linkedList.head!.next!.next, '*', linkedList.tail);
    console.log(linkedList.length);
    console.log('#########################################');
    linkedList.push(3);
    // console.log(linkedList.head!, linkedList.head!.next, linkedList.head!.next!.next, linkedList.head!.next!.next!.next, '*', linkedList.tail);
    console.log(linkedList)
    console.log(linkedList.length);
    console.log('#########################################');
    linkedList.head!.next!.next!.delete();
    console.log(linkedList);
    console.log(linkedList.length);
    console.log('#########################################');
    linkedList.destroy();
    console.log(linkedList.head);

    console.log('#########################################');
    linkedList = LinkedList.fromArray<number>([5, 4, 3, 2, 1]);
    console.log(linkedList);
    console.log(linkedList.length);
    console.log('#########################################');
    console.log(linkedList.splice(2, 2));
    console.log(linkedList);
    console.log(linkedList.length);

    console.log('#########################################');
    console.log(linkedList.toArray());
}
