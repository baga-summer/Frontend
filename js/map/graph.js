export class Queue {
    constructor() {
        this.items = [];
    }

    enqueue(element) {
        this.items.push(element);
    }

    dequeue() {
        if (this.isEmpty()) { return "Underflow"; }
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length == 0;
    }
}



export class Graph {
    constructor(nrOfVertices) {
        this.nrOfVertices = nrOfVertices;
        this.AdjacencyList = new Map();
    }

    addVertex(v) {
        this.AdjacencyList.set(v, []);
    }

    addEdge(v, w) {
        this.AdjacencyList.get(v).push(w);
    }

    first() {
        return Array.from(this.AdjacencyList)[0][0];
    }

    last() {
        let keys = this.AdjacencyList.keys();

        for (let key of keys) {
            var value = this.AdjacencyList.get(key);

            if (value.length == 0) {
                return key;
            }
        }
    }

    next(v) {
        if (v != null) {
            return this.AdjacencyList.get(v)[0];
        } else { return undefined; }
    }

    getParents(v) {
        let keys = this.AdjacencyList.keys();
        let parents = [];

        for (let key of keys) {
            let value = this.AdjacencyList.get(key);

            if (v == value) {
                parents.push(key);
            }
        }
        return parents;
    }

    getChildren(v) {
        return this.AdjacencyList.get(v);
    }

    bfs(startingNode) {
        let visited = [];

        for (let i = 0; i < this.nrOfVertices; i++) {
            visited[i] = false;
        }

        let q = new Queue();

        visited[startingNode] = true;
        q.enqueue(startingNode);

        while (!q.isEmpty()) {
            let getQueueElement = q.dequeue();

            console.log(getQueueElement);

            let getList = this.AdjacencyList.get(getQueueElement);

            for (let i in getList) {
                let neigh = getList[i];

                if (!visited[neigh]) {
                    visited[neigh] = true;
                    q.enqueue(neigh);
                }
            }
        }
    }

    printGraph() {
        let keys = this.AdjacencyList.keys();

        for (var key of keys) {
            var values = this.AdjacencyList.get(key);
            var conc = "";

            for (var j of values) { conc += j + " "; }

            console.log(key + " -> " + conc);
        }
    }
}
