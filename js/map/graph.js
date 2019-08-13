/**
 * Queue - Simple queue class
 */
export class Queue {
    /**
     * constructor - initiate the array
     */
    constructor() {
        this.items = [];
    }

    /**
     * enqueue - push new element into array
     * @param {type} element the data that will be saved
     */
    enqueue(element) {
        this.items.push(element);
    }

    /**
     * dequeue - shift element if the queue is not empty
     * @returns {element}
     */
    dequeue() {
        if (this.isEmpty()) { return undefined; }
        return this.items.shift();
    }

    /**
     * isEmpty - check if the array is empty or not
     * @returns {boolean} returns boolean value if length is equal to zero
     */
    isEmpty() {
        return this.items.length == 0;
    }
}



/**
 * Graph - Class for creating a graph data structure and manage it
 */
export class Graph {
    /**
     * constructor - initiate the graphs internal structures
     * 			   - This graph is using the Map() structure to keep track of vertices and edges
     *			   - @see {@link https://tinyurl.com/Global-Objects-Map}
     *
     */
    constructor() {
        this.AdjacencyList = new Map();
    }

    /**
     * addVertex - Add a new vertex to structure
     *
     * @param {vertex} v The new vertex
     */
    addVertex(v) {
        this.AdjacencyList.set(v, []);
    }

    /**
     * addEdge - Adds a single way link between two vertices, parent --> child
     *
     * @param {vertex} v The parent vertex
     * @param {vertex} w The child vertex
     */
    addEdge(v, w) {
        this.AdjacencyList.get(v).push(w);
    }

    /**
     * first - Returns the first vertex in the graph structure
     *
     * @returns {vertex} The data that the first vertex is holding
     */
    first() {
        return Array.from(this.AdjacencyList)[0][0];
    }

    /**
     * last - Returns the last vertex, this is NOT the last vertex in the list.
     * 		- The last vertex is the vertex without any children (no next element after this)
     *
     * @returns {vertex} The vertex without children
     */
    last() {
        let keys = this.AdjacencyList.keys();

        for (let key of keys) {
            var value = this.AdjacencyList.get(key);

            if (value.length == 0) {
                return key;
            }
        }
    }

    /**
     * getParents - Get all vertices that have 'v' as child
     *
     * @param {vertex} v The vertex we are looking for as a child
     *
     * @returns {Array} Returns a array of parents found
     */
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

    /**
     * getChildren - Get all children a vertex has
     *
     * @param {type} v The parent vertex
     *
     * @returns {Array} Returns a array of children found
     */
    getChildren(v) {
        return this.AdjacencyList.get(v);
    }

    /**
     * printGraph - Prints the whole graphs structure to the console log with arrows to show
     * 			  - which edge belongs to which vertices
     *
     * @returns {void}
     */
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
