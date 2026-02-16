/* -- Level Definitions -- */

export const levels = [
    // level 1
    {
        level: 1,

        floors: {
            parameters: [[0, 700], [950, 500], [2050, 500], [3200, 500]]
        },

        platforms: {
            parameters: [[785, 550, 80], [1485, 550, 80], [1685, 500, 80],
                        [1885, 550, 80], [2585, 550, 80], [2785, 475, 80],
                        [2585, 375, 80], [2785, 300, 80]]
        },

        bouncingPlatforms: {
            parameters: []
        },

        stickyPlatforms: {
            parameters: []
        },

        deadlies: {
            parameters: []
        },

        movingObjects: {
            parameters: []
        },

        winDist: 3600
    },

    // level 2
    {
        level: 2,
        
        floors: {
            parameters: [[0, 700], [1725, 225], [2500, 450], [3300, 500]]
        },

        platforms: {
            parameters: [[800, 550, 80], [1050, 480, 100], [1400, 550, 80],
                        [2050, 550, 80], [2050, 550, 80], [2050, 450, 80],
                        [2050, 350, 80], [2050, 250, 80], [3100, 550, 20]]
        },

        bouncingPlatforms: {
            parameters: []
        },

        stickyPlatforms: {
            parameters: []
        },

        deadlies: {
            parameters: []
        },

        movingObjects: {
            parameters: []
        },

        winDist: 3700
    },

    // level 3
    {
        level: 3,

        floors: {
            parameters: [[-500, 1200], [1700, 600], [3100, 600]]
        },

        platforms: {
            parameters: [[800, 550, 60], [1000, 650, 60], [1250, 650, 60],
                         [1450, 550, 60]]
        },

        bouncingPlatforms: {
            parameters: [[2400, 550, 80], [2700, 550, 80]]
        },

        stickyPlatforms: {
            parameters: []
        },

        deadlies: {
            parameters: []
        },

        movingObjects: {
            parameters: []
        },

        winDist: 3600
    },

    // level 4
    {
        level: 4,

        floors: {
            parameters: [[0, 700], [1700, 600], [3200, 500]]
        },

        platforms: {
            parameters: []
        },

        bouncingPlatforms: {
            parameters: [[2400, 550, 80], [2600, 400, 80], [2800, 250, 80]]
        },

        stickyPlatforms: {
            parameters: []
        },

        deadlies: {
            parameters: []
        },

        movingObjects: {
            parameters: [{
                type: "platform",   
                parameters: [400 * Math.cos(angle + pi / 2), 1150, 0, 550, 100]
            }]
        },

        winDist: 3600
    },

    // level 5
    {
        level: 5,

        floors: {
            parameters: [[0, 700], [1700, 600], [3200, 500]]
        },

        platforms: {
            parameters: []
        },

        bouncingPlatforms: {
            parameters: []
        },

        stickyPlatforms: {
            parameters: []
        },

        deadlies: {
            parameters: []
        },

        movingObjects: {
            parameters: [{
                type: "bouncy",
                parameters: [200 * Math.cos(angle + pi / 2), 925, 0, 550, 75]
            }, {
                type: "bouncy",
                parameters: [-200 * Math.cos(angle + pi / 2), 1375, 0, 550, 75]
            }, {
                type: "bouncy",
                parameters: [50 * Math.cos(angle + pi / 2), 2400, 0, 550, 80]
            }, {
                type: "bouncy",
                parameters: [50 * Math.cos(angle + pi / 2), 2600, 0, 550, 80]
            }, {
                type: "bouncy",
                parameters: [100 * Math.cos(angle + pi / 2), 2800, 0, 550, 80]
            }   
            ]
        },

        winDist: 3600
    },

    // level 6
    {
        level: 6,

        floors: {
            parameters: [[0, 700], [2500, 500], [4200, 500]]
        },

        platforms: {
            parameters: []
        },

        bouncingPlatforms: {
            parameters: [[3100, 550, 100], [3100, 400, 100]]
        },

        stickyPlatforms: {
            parameters: []
        },

        deadlies: {
            parameters: []
        },

        movingObjects: {
            parameters: [{
                type: "platform",
                parameters: [200 * Math.cos(angle + pi / 2), 900, -200 * Math.sin(2 * (angle + pi / 2)), 450, 100]
            }, {
                type: "platform",
                parameters: [-200 * Math.cos(angle + pi / 2), 1450, -200 * Math.sin(2 * (angle + pi / 2)), 450, 100]
            }, {
                type: "platform",
                parameters: [200 * Math.cos(angle + pi / 2), 2000, -200 * Math.sin(2 * (angle + pi / 2)), 450, 100]
            }, {
                type: "platform",
                parameters: [200 * Math.cos(angle + pi / 2), 3600, -200 * Math.abs(Math.sin(2 * (angle + pi / 2))), 450, 100]
            } 
            ]
        },

        winDist: 4600
    },

    // level 7
    {
        level: 7,

        floors: {
            parameters: [[0, 700], [1400, 500], [3000, 500], [4200, 500]]
        },

        platforms: {
            parameters: [[1150, 550, 100]]
        },

        bouncingPlatforms: {
            parameters: []
        },

        stickyPlatforms: {
            parameters: [[850, 550, 100]]
        },

        deadlies: {
            parameters: [[2150, 450, 50], [2400, 450, 50], [2650, 450, 50],
                         [3700, 525, 50]]
        },

        movingObjects: {
            parameters: [{
                type: "platform",
                parameters: [0, 850, -200 * Math.sin(2 * (angle + pi / 2)), 550, 100]
            }, {
                type: "deadly",
                parameters: [0, 1150, -200 * Math.sin(2 * (angle)), 550, 100]
            }, {
                type: "sticky",
                parameters: [0, 2000, -200 * Math.sin(2 * (angle)), 450, 100]
            }, {
                type: "sticky",
                parameters: [0, 2250, -200 * Math.sin(2 * (angle + pi / 2)), 450, 100]
            }, {
                type: "sticky",
                parameters: [0, 2500, -200 * Math.sin(2 * (angle)), 450, 100]
            }, {
                type: "sticky",
                parameters: [0, 2750, -200 * Math.sin(2 * (angle + pi / 2)), 450, 100]
            }, {
                type: "platform",
                parameters: [200 * Math.cos(2 * (angle + pi / 2)), 3700, 0, 550, 75]
            }   
            ]
        },

        winDist: 4600
    },

    // level 8
    {
        level: 8,

        floors: {
            parameters: [[0, 700], [1400, 500], [4200, 500]]
        },

        platforms: {
            parameters: []
        },

        bouncingPlatforms: {
            parameters: [[3100, 550, 100], [3100, 400, 100]]
        },

        stickyPlatforms: {
            parameters: [[850, 550, 100]]
        },

        deadlies: {
            parameters: [[2150, 450, 50], [2400, 450, 50], [2650, 450, 50],
                         [3700, 525, 50]]
        },

        movingObjects: {
            parameters: [{
                type: "platform",
                parameters: [0, 850, -200 * Math.sin(2 * (angle + pi / 2)), 550, 100]
            }, {
                type: "deadly",
                parameters: [0, 1150, -200 * Math.sin(2 * (angle)), 550, 100]
            }, {
                type: "sticky",
                parameters: [0, 2000, -200 * Math.sin(2 * (angle)), 450, 100]
            }, {
                type: "sticky",
                parameters: [0, 2250, -200 * Math.sin(2 * (angle + pi / 2)), 450, 100]
            }, {
                type: "sticky",
                parameters: [0, 2500, -200 * Math.sin(2 * (angle)), 450, 100]
            }, {
                type: "sticky",
                parameters: [0, 2750, -200 * Math.sin(2 * (angle + pi / 2)), 450, 100]
            }, {
                type: "platform",
                parameters: [200 * Math.cos(2 * (angle + pi / 2)), 3700, 0, 550, 75]
            }   
            ]
        },

        winDist: 4600
    }
]

/* -- Level Parser -- */

export function levelParser (levelParams) {
    const floors = levelParams.floors.parameters;
    const platforms = levelParams.platforms.parameters;
    const bouncingPlatforms = levelParams.bouncingPlatforms.parameters;
    const stickyPlatforms = levelParams.stickyPlatforms.parameters;
    const deadlies = levelParams.deadlies.parameters;
    const movingObjects = levelParams.movingObjects.parameters;

    drawFlag(levelParams.winDist);

    for (let i in floors)
        drawFloor(floors[i][0], floors[i][1]);

    for (let i in platforms)
        drawPlatform(platforms[i][0], platforms[i][1], platforms[i][2]);
    
    for (let i in bouncingPlatforms)
        drawBouncingPlatform(bouncingPlatforms[i][0], bouncingPlatforms[i][1], bouncingPlatforms[i][2]);
    
    for (let i in stickyPlatforms)
        drawStickyPlatform(stickyPlatforms[i][0], stickyPlatforms[i][1], stickyPlatforms[i][2]);

    for (let i in deadlies)
        drawPlatform(deadlies[i][0], deadlies[i][1], deadlies[i][2]);
    
    for (let i in movingObjects) {
        let type;
        if (movingObjects[i].type === "platform")
            type = drawPlatform;
        else if (movingObjects[i].type === "bouncy")
            type = drawBouncingPlatform;
        else if (movingObjects[i].type === "sticky")
            type = drawStickyPlatform;
        else if (movingObjects[i].type === "deadly")
            type = drawDeadly;

        moveObject(drawPlatform, movingObjects[i].parameters[0],
            movingObjects[i].parameters[1], movingObjects[i].parameters[2], 
            movingObjects[i].parameters[3], movingObjects[i].parameters[4]);
    }
        

    if (x > screenX + levelParams.winDist) {
        win();
        level = levelParams.level + 1;
    }
}