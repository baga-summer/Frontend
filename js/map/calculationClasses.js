/**
 * startData - This is elements what have flow values (houses or connnected markers)
 * 			   This is kept track by the number 0
 */
export class StartData {
    /**
     * constructor - Saves the id of the selected element and adds the selected type
     * @param {number} id The unique number of selected element
     */
    constructor(id) {
        this.data = {
            id: id,
            type: 0,
        };
    }
}

/**
 * PumpstationData - This is a single element in each list that is a pumpstation
 * 					 This is kept track by the number 2
 */
export class PumpstationData {
    /**
     * constructor - Saves the id of the selected element and adds the selected type
     * @param {number} id The unique number of selected element
     */
    constructor(id) {
        this.data = {
            id: id,
            type: 2,
        };
    }
}

/**
 * BranchConnData - This is a branch connection element
 * 					This is kept track by the number 1
 */
export class BranchConnData {
    /**
     * constructor - Saves the id of the selected element and adds the selected type
     * @param {number} id The unique number of selected element
     */
    constructor(id) {
        this.data = {
            id: id,
            type: 1,
        };
    }
}

/**
 * DefaultData - This is all the other products that is not a pumpstation or a branch connection
 * 				 including endpoints
 * 				 This is kept track by the number 3
 */
export class DefaultData {
    /**
     * constructor - Saves the id of the selected element and adds the selected type
     * @param {number} id The unique number of selected element
     */
    constructor(id) {
        this.data = {
            id: id,
            type: 3,
        };
    }
}
