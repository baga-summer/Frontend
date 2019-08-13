/**
 * LinkedListNode - The nodes the linkedList is going to be build on
 */
class LinkedListNode {
    /**
     * constructor - save the data and initiate the next and previous attributes
     *
     * @param {type} data The data the node will save
     */
    constructor(data) {
        this.data = data;
        this.next = null;
        this.previous = null;
    }
}

/**
 * LinkedList - A double Linked list data structure class for calculation logic on the map
 */
export class LinkedList {
    /**
     * constructor - initiate all values for the list.
     * 			   - start, pumpstation, end, flow and ready is for keeping track if a calculation
     * 			   - is possible.
     *
     */
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

    /**
     * find - Step through the list until right node is found or the end is reached.
     *
     * @param {number} index The number of steps from the start (head) the node is placed
     *
     * @returns {type} Returns found node or undefined
     */
    find(index) {
        let current = this.head;
        let i = 0;

        while ((current != null) && (i < index)) {
            current = current.next;
            i++;
        }
        return current !== null ? current : undefined;
    }

    /**
     * check - Everytime a new node is added to the list a check is needed to see if the list have
     * 		 - found a 'start', 'pumpstation' or a 'end'.
     *
     * @param {type} data Contains which type the node is
     *
     */
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

    /**
     * add - A new node is created and placed at the end of the list.
     * 	   - The length and tail is updated
     *
     * @param {type} data The data that will be saved to the node
     *
     */
    add(data) {
        this.check(data);

        const newNode = new LinkedListNode(data);

        if (this.head === null) {
            this.head = newNode;
        } else {
            this.tail.next = newNode;
            newNode.previous = this.tail;
        }

        this.tail = newNode;
        this.length++;
    }

    /**
     * get - Returns if found the node data
     *
     * @param {type} index The number of steps from the start (head) the node is placed
     *
     * @returns {type} data or undefined
     */
    get(index) {
        if (index > -1) {
            let current = this.find(index);

            return current !== null ? current.data : undefined;
        } else {
            return undefined;
        }
    }

    /**
     * set - update the data for a specific node
     *
     * @param {type} index The number of steps from the start (head) the node is placed
     * @param {type} data  the new data that the node will save
     *
     * @returns {undefined} if node is not found a undefined is returned
     */
    set(index, data) {
        if (index > -1) {
            let current = this.find(index);

            current.data = data;
        } else {
            return undefined;
        }
    }

    /**
     * indexOf - Gets the index of node by searching in each node data for a unique id
     *
     * @param {type} id Unique id for a node data
     *
     * @returns {number} The number of steps from the start (head) the node is placed
     */
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

    /**
     * getAll - Places all nodes data into a array and returns this array
     *
     * @returns {Array} All data from the nodes inside the list is returned
     */
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

    /**
     * concat - Merge two lists into one
     *
     * @param {type} other The other list
     */
    concat(other) {
        let all = other.sort();

        for (let i = 0; i < all.length; i++) {
            this.add(all[i]);
        }
    }

    /**
     * includesType - Check if the list contains a node data that have a specific type
     *
     * @param {number} type The type that we are looking for
     *
     * @returns {type} returns the node if found, if it is not found, false is returned
     */
    includesType(type) {
        let current = this.head;
        let i = 0;

        while ((current != null) && (i < this.length)) {
            if (current.data.type == type) { return current; }

            current = current.next;
            i++;
        }
        return false;
    }

    /**
     * sort - sort the data before it is returned
     * 		- The sorting is based on type
     *
     * @returns {Array} Returns the data from all nodes that have been sorted by type
     */
    sort() {
        let all = this.getAll();

        /**
         * compare - compare the two types and return the results
         *
         * @param {type} a The first element
         * @param {type} b The other element
         *
         * @returns {number} the result
         */
        let compare = (a, b) => {
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

    /**
     * remove - Removes a node from the list and new links is made to make the list whole again
     *
     * @param {type} index The number of steps from the start (head) the node is placed
     *
     * @returns {type} returns the removed nodes data when successfull otherwise undefined
     */
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

                let next = this.includesType(0);

                if (next) {
                    this.check(next.data);
                }
            }
            return data;
        }

        let current = this.find(index);
        // if found, remove it
        if (current !== null) {
            current.previous.next = current.next;

            if (current == this.tail) {
                this.tail = current.previous;
            } else {
                current.next.previous = current.previous;
            }

            this.length--;

            if (current.data.id == this.start.id) {
                this.start.status = false;
                this.flow = false;
                this.ready = false;

                let next = this.includesType(0);

                if (next) {
                    this.check(next.data);
                }
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
