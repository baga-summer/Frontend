class LinkedListNode {
    constructor(data) {
        this.data = data;
        this.next = null;
        this.previous = null;
    }
}

export class LinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.length = 0;
        this.start = { status: false };
        this.pumpstation = { status: false };
        this.end = { status: false };
        this.ready = false;
        this.flow = false;
    }

    find(index) {
        let current = this.head;
        let i = 0;

        while ((current != null) && (i < index)) {
            current = current.next;
            i++;
        }
        return current !== null ? current : undefined;
    }

    check(data) {
        switch (data.type) {
            case 0:
                if (!this.start.status) {
                    this.start.status = true;
                    this.flow = true;
                    this.start.id = data.id;
                    console.log("start");
                }
                break;
            case 2:
                if (!this.pumpstation.status) {
                    this.pumpstation.status = true;
                    this.pumpstation.id = data.id;
                    console.log("pumpstation");
                } else if (this.pumpstation.status && !this.end.status) {
                    this.end.status = true;
                    this.end.id = data.id;
                    data.type = 3;
                    console.log("end");
                }
                break;
            case 3:
                if (!this.end.status && this.pumpstation.status) {
                    this.end.status = true;
                    this.end.id = data.id;
                    console.log("end");
                }
                break;
        }

        if (this.start.status && this.pumpstation.status && this.end.status && this.flow) {
            this.ready = true;
            console.log("ready");
        }
    }

    add(data) {
        this.check(data);

        const newNode = new LinkedListNode(data);

        if (this.head === null) {
            this.head = newNode;
            this.tail = this.head;
        } else {
            this.tail.next = newNode;
            newNode.previous = this.tail;
        }

        this.tail = newNode;
        this.length++;
    }

    get(index) {
        if (index > -1) {
            let current = this.find(index);

            return current !== null ? current.data : undefined;
        } else {
            return undefined;
        }
    }

    set(index, data) {
        if (index > -1) {
            let current = this.find(index);

            current.data = data;
        } else {
            return undefined;
        }
    }

    indexOf(id) {
        let current = this.head;
        let i = 0;

        while ((current != null) && (i < this.length)) {
            if (current.data.id == id) {
                return i;
            }
            current = current.next;
            i++;
        }
        return -1;
    }

    getAll() {
        let temp = [];
        let current = this.head;
        let i = 0;

        while ((current != null) && (i < this.length)) {
            temp.push(current.data);

            current = current.next;
            i++;
        }
        return temp;
    }

    concat(other) {
        let all = other.getAll();

        for (let i = 0; i < all.length; i++) {
            this.add(all[i]);
        }
    }

    includesType(type) {
        let current = this.head;
        let i = 0;

        while ((current != null) && (i < this.length)) {
            if (current.data.type == type) { return true; }

            current = current.next;
            i++;
        }
        return false;
    }

    sort() {
        let all = this.getAll();

        function compare(a, b) {
            if (a.type < b.type) {
                return -1;
            }
            if (a.type > b.type) {
                return 1;
            }
            return 0;
        }
        return all.sort(compare);
    }

    remove(index) {
        // empty list or invalid index
        if ((this.head === null) || (index < 0)) {
            return undefined;
        }

        // remove old head and set a new head
        if (index === 0) {
            const data = this.head.data;

            this.head = this.head.next;

            if (this.head === null) {
                this.tail = null;
            } else {
                this.head.previous = null;
            }

            this.length--;
            if (data.id == this.start.id) {
                this.start.status = false;
                this.flow = false;
                this.ready = false;
            }
            return data;
        }

        let current = this.find(index);

        // if found, remove it
        if (current !== null) {
            if (current == this.tail) {
                this.tail = current.previous;
            } else {
                current.next.previous = current.previous;
            }

            current.previous.next = current.next;
            this.length--;

            if (current.data.id == this.start.id) {
                this.start.status = false;
                this.flow = false;
                this.ready = false;
            } else if (current.data.id == this.pumpstation.id) {
                this.pumpstation.status = false;
                this.ready = false;
            } else if (current.data.id == this.end.id) {
                this.end.status = false;
                this.ready = false;
            }

            return current.data;
        }

        // if node wasn't found
        return undefined;
    }
}
