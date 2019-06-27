export let options = {
    marker: (activeIcon) => {
        return {
            draggable: true,
            icon: activeIcon
        };
    },

    house: (color) => {
        return {
            color: color,
            fillColor: color,
            fillOpacity: 0.5,
            weight: 1.5
        };
    },

    pipe: (strokeWeight) => {
        if (strokeWeight == null) {
            strokeWeight = 3;
        }
        return {
            id: "pipe",
            weight: strokeWeight,
            edit_with_drag: true,
            vertices: {
                destroy: true,
                first: false,
                last: false,
                insert: true,
                middle: true,
            }
        };
    },

    stemPipe: (strokeWeight) => {
        if (strokeWeight == null) {
            strokeWeight = 3;
        }
        return {
            id: "stemPipe",
            weight: strokeWeight,
            color: "red",
            edit_with_drag: true,
            vertices: {
                destroy: true,
                first: false,
                last: false,
                insert: true,
                middle: true,
            }
        };
    },
};
