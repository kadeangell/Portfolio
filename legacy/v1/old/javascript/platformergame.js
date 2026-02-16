// import levels from './levels.js';
// import levelParser from './levels.js';


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const inertia = 0.98;
const pi = Math.PI;

// Changing Global Variables
let x = canvas.width / 5;
let y = canvas.height - 75;
let dx = 0;
let dy = 0;
let angle = 0;
let cloudPos = [500 * Math.random() + 50, 10 * Math.random(), 5 * Math.random(), 8 * Math.random(), 500 * Math.random() + 50, 0.5 * Math.random() + 0.4, 0.5 * Math.random() + 0.4];
let keys = {
  left: false,
  right: false,
  up: false
};
let screenX = 0;
let lives = 3;
let dead = false;
let pause = false;
let splash = true;
let level = 1;
let used = [false, false, false, false];
let canJump = true;
let onSticky = false;

function startScreen() {
  ctx.fillStyle = '#444';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#eee';
  ctx.font = '75px Roboto, sans-serif';
  ctx.fillText('Untitled Platformer', canvas.width / 2 - 300, canvas.height / 3);
  ctx.font = '20px Roboto, sans-serif';
  ctx.fillText("Use 'w' or the spacebar to jump, 'd' to go right, and 'a' to go left", canvas.width / 2 - 265, 2 * canvas.height / 3);
  ctx.fillText("Press any key to start", canvas.width / 2 - 80, 2 * canvas.height / 3 + 50);
}

function restart() {
  x = canvas.height / 5;
  y = canvas.height - 75;
  dx = 0;
  dy = 0;
  angle = 0;
  cloudPos = [500 * Math.random() + 50, 10 * Math.random(), 5 * Math.random(), 8 * Math.random(), 500 * Math.random() + 50, 0.5 * Math.random() + 0.4, 0.5 * Math.random() + 0.4];
  keys = {
    left: false,
    right: false,
    up: false
  };
  screenX = 0;
}

// draw background
function drawBack() {
  ctx.fillStyle = '#5df';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  //sun
  ctx.fillStyle = '#ffff00';
  drawCircle(70, 90, 28);
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(70 + 35 * Math.cos(angle + i * pi / 4 - 0.2), 90 + 35 * Math.sin(angle + i * Math.PI / 4 - 0.2));
    ctx.lineTo(70 + 65 * Math.cos(angle + i * pi / 4), 90 + 65 * Math.sin(angle + i * Math.PI / 4));
    ctx.lineTo(70 + 35 * Math.cos(angle + i * pi / 4 + 0.2), 90 + 35 * Math.sin(angle + i * Math.PI / 4 + 0.2));
    ctx.fill();
  }
  //clouds
  drawCloud(cloudPos[0], 80);
  drawCloud(cloudPos[4], 200);

  // hills
  ctx.fillStyle = '#082';
  drawCircle(screenX + 300, 650, 100);
  ctx.beginPath();
  ctx.moveTo(screenX + 150, 650);
  ctx.lineTo(screenX + 229, 580);
  ctx.lineTo(screenX + 372, 580);
  ctx.lineTo(screenX + 450, 650);
  ctx.fill();

  ctx.fillStyle = '#666';
  ctx.fillRect(0, 0, canvas.width, 25);
  ctx.fillStyle = '#eee';
  ctx.font = '20px Roboto, sans-serif';
  ctx.fillText('Lives: ' + lives, canvas.width - 80, 20);
  ctx.fillText('Level: ' + level, canvas.width - 160, 20);
}

function drawLevel() {
  if (level <= 7) {
    levelParser(levels[level - 1]);
  }
	
  // hard-coded for now
  if (level === 8 || level === 9) {
    levelParser(levels[7]);
  }
}

function levelOne() {
  drawFloor(0, 700);
  drawFloor(950, 500);
  drawFloor(2050, 500);

  drawPlatform(785, 550, 80);
  drawPlatform(1485, 550, 80);
  drawPlatform(1685, 500, 80);
  drawPlatform(1885, 550, 80);
  drawPlatform(2585, 550, 80);
  drawPlatform(2785, 475, 80);
  drawPlatform(2585, 375, 80);
  drawPlatform(2785, 300, 80);

  drawFlag(3600);
  drawFloor(3200, 500);
  
  if (x > screenX + 3600) {
    win();
    level = 2;
  }
}

function levelTwo() {
  drawFloor(0, 700);
  drawFloor(1725, 225);
  drawFloor(2500, 450);

  drawPlatform(800, 550, 80);
  drawPlatform(1050, 480, 100);
  drawPlatform(1400, 550, 80);
  drawPlatform(2050, 550, 80);
  drawPlatform(2050, 450, 80);
  drawPlatform(2050, 350, 80);
  drawPlatform(2050, 250, 80);
  drawPlatform(3100, 550, 20);

  drawFlag(3700);
  drawFloor(3300, 500);
  
  if (x > screenX + 3700) {
    win();
    level = 3;
  }
}

function levelThree () {
  drawFloor(-500, 1200);
  drawFloor(1700, 600);
  
  drawLife(-200, canvas.height - 90 + 5 * Math.sin(2 * angle), 0);
  
  drawPlatform(800, 550, 60);
  drawPlatform(1000, 650, 60);
  drawPlatform(1250, 650, 60);
  drawPlatform(1450, 550, 60);
  drawBouncingPlatform(2400, 550, 80);
  drawBouncingPlatform(2700, 550, 80);
  
  drawFlag(3600);
  drawFloor(3100, 600);
  
  if (x >= screenX + 3600) {
  	win();
    level = 4;
  }
}

function levelFour () {
  drawFloor(0, 700);
  drawFloor(1700, 600);
  
  moveObject(drawPlatform, 400 * Math.cos(angle + pi / 2), 1150, 0, 550, 100);
  drawBouncingPlatform(2400, 550, 80);
  drawBouncingPlatform(2600, 400, 80);
  drawBouncingPlatform(2800, 250, 80);
  
  drawFlag(3600);
  drawFloor(3200, 500);
  
  if (x >= screenX + 3600) {
    win();
    level = 5;
  }
}

function levelFive () {
  drawFloor(0, 700);
  drawFloor(1700, 600);
  
  moveObject(drawBouncingPlatform, 200 * Math.cos(2 * (angle + pi / 2)), 925, 0, 550, 75);
  moveObject(drawBouncingPlatform, -200 * Math.cos(2 * (angle + pi / 2)), 1375, 0, 550, 75);
  moveObject(drawBouncingPlatform, 50 * Math.cos(2 * (angle + pi / 2)), 2400, 0, 550, 80);
  moveObject(drawBouncingPlatform, 50 * Math.cos(2 * (angle + pi / 2)), 2600, 0, 550, 80);
  moveObject(drawBouncingPlatform, 100 * Math.cos(4 * (angle + pi / 2)), 2800, 0, 550, 80);
  
  drawFlag(3600);
  drawFloor(3200, 500);
  
  if (x >= screenX + 3600) {
    win();
    level = 6;
  }
}

function levelSix () {
  drawFloor(0, 700);
  drawFloor(2500, 500);
  
  moveObject(drawPlatform, 200 * Math.cos(2 * (angle + pi / 2)), 900, -200 * Math.sin(2 * (angle + pi / 2)), 450, 100);
  moveObject(drawPlatform, -200 * Math.cos(2 * (angle + pi / 2)), 1450, -200 * Math.sin(2 * (angle + pi / 2)), 450, 100);
  moveObject(drawPlatform, 200 * Math.cos(2 * (angle + pi / 2)), 2000, -200 * Math.sin(2 * (angle + pi / 2)), 450, 100);
  
  drawBouncingPlatform(3100, 550, 100);
  drawBouncingPlatform(3100, 400, 100);
  
  moveObject(drawPlatform, 200 * Math.cos(2 * (angle + pi / 2)), 3600, -200 * Math.abs(Math.sin(2 * (angle + pi / 2))), 450, 100);
  
  drawFlag(4600);
  drawFloor(4200, 500);
  
  if (x >= screenX + 4600) {
    win();
    level = 7;
  }
}

function levelSeven () {
  drawFloor(0, 700);
  drawFloor(1400, 500);
  
  drawStickyPlatform(850, 550, 100);
  moveObject(drawPlatform, 0, 850, -200 * Math.sin(2 * (angle + pi / 2)), 550, 100);
  moveObject(drawDeadly, 0, 1150, -200 * Math.sin(2 * (angle)), 550, 100);
  drawPlatform(1150, 550, 100);
  moveObject(drawStickyPlatform, 0, 2000, -200 * Math.sin(2 * (angle)), 450, 100);
  drawDeadly(2150, 450, 50);
  moveObject(drawStickyPlatform, 0, 2250, -200 * Math.sin(2 * (angle + pi / 2)), 450, 100);
  drawDeadly(2400, 450, 50);
  moveObject(drawStickyPlatform, 0, 2500, -200 * Math.sin(2 * (angle)), 450, 100);
  drawDeadly(2650, 450, 50);
  moveObject(drawStickyPlatform, 0, 2750, -200 * Math.sin(2 * (angle + pi / 2)), 450, 100);
  drawFloor(3000, 500);
  moveObject(drawPlatform, 200 * Math.cos(2 * (angle + pi / 2)), 3700, 0, 550, 75);
  drawDeadly(3700, 525, 50);
  
  drawFlag(4600);
  drawFloor(4200, 500);
  
  if (x >= screenX + 4600) {
    win();
    level = 8;
  }
}

function levelEight () {
  drawFloor(0, 700);
  
  drawStickyPlatform(850, 550, 100);
  drawDeadly(800, 475, 50);
  moveObject(drawPlatform, 0, 975, -200 * Math.sin(2 * (angle)), 400, 100);
  drawDeadly(950, 285, 50);
  drawDeadly(1000, 285, 50);
  drawDeadly(1050, 285, 50);
  drawBouncingPlatform(1200, 600, 100);
  drawDeadly(1325, 550, 50);
  drawDeadly(1325, 500, 50);
  drawDeadly(1325, 450, 50);
  drawStickyPlatform(1400, 475, 100);
  drawFloor(1550, 300);
  drawFloor(2000, 150);
  if (angle <= 3 * pi / 2) {
    drawDeadly(1800, 625, 50);
    drawDeadly(1800, 600, 50);
    drawDeadly(1800, 575, 50);
    drawDeadly(1800, 550, 50);
    drawDeadly(1800, 525, 50);

    drawDeadly(2000, 625, 50);
    drawDeadly(2000, 600, 50);
    drawDeadly(2000, 575, 50);
    drawDeadly(2000, 550, 50);
    drawDeadly(2000, 525, 50);

    drawFloor(1849, 152);
    moveObject(drawBouncingPlatform, 200 * Math.cos(2 * (angle)), 2350, 0, 550, 100);
  } else if (angle > 3 * pi / 2) {
    moveObject(drawStickyPlatform, 200 * Math.cos(2 * (angle)), 2350, 0, 550, 100);
  }
  drawDeadly(2600, 500, 100);
  drawDeadly(2650, 500, 100);
  drawDeadly(2700, 500, 100);
  moveObject(drawStickyPlatform, 0, 2850, -50 * Math.sin(2 * (angle)), 550, 100);
  drawDeadly(3100, 575, 50);
  drawDeadly(3150, 575, 50);
  drawDeadly(3200, 575, 50);
  drawLife(3150, canvas.height - 200 + 5 * Math.sin(2 * angle), 1);
  
  drawFlag(3400);
  drawFloor(3000, 500);
  
  if (x >= screenX + 3400) {
    win();
    level = 8;
  }
}

let moveVert = Math.sin(2 * (angle));
let moveHori = Math.cos(angle);

/* -- Level Definitions -- */

const levels = [
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
              parameters: [400, 1150, 0, 550, 100]
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
              parameters: [200, 925, 0, 550, 75]
          }, {
              type: "bouncy",
              parameters: [-200, 1375, 0, 550, 75]
          }, {
              type: "bouncy",
              parameters: [50, 2400, 0, 550, 80]
          }, {
              type: "bouncy",
              parameters: [50, 2600, 0, 550, 80]
          }, {
              type: "bouncy",
              parameters: [100, 2800, 0, 550, 80]
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
              parameters: [200, 900, -200, 450, 100]
          }, {
              type: "platform",
              parameters: [-200, 1450, -200, 450, 100]
          }, {
              type: "platform",
              parameters: [200, 2000, -200, 450, 100]
          }, {
              type: "platform",
              parameters: [200, 3600, -200, 450, 100]
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
              parameters: [0, 850, -300, 550, 100]
          }, {
              type: "deadly",
              parameters: [0, 1150, -200, 550, 100]
          }, {
              type: "sticky",
              parameters: [0, 2000, -200, 450, 100]
          }, {
              type: "sticky",
              parameters: [0, 2250, 200, 450, 100]
          }, {
              type: "sticky",
              parameters: [0, 2500, -200, 450, 100]
          }, {
              type: "sticky",
              parameters: [0, 2750, 200, 450, 100]
          }, {
              type: "platform",
              parameters: [200, 3700, 0, 550, 75]
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
              parameters: [0, 850, -200, 550, 100]
          }, {
              type: "deadly",
              parameters: [0, 1150, -200, 550, 100]
          }, {
              type: "sticky",
              parameters: [0, 2000, -200, 450, 100]
          }, {
              type: "sticky",
              parameters: [0, 2250, -200, 450, 100]
          }, {
              type: "sticky",
              parameters: [0, 2500, -200, 450, 100]
          }, {
              type: "sticky",
              parameters: [0, 2750, -200, 450, 100]
          }, {
              type: "platform",
              parameters: [200, 3700, 0, 550, 75]
          }   
          ]
      },

      winDist: 4600
  }
]

/* -- Level Parser -- */

function levelParser (levelParams) {
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
      drawDeadly(deadlies[i][0], deadlies[i][1], deadlies[i][2]);
  
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

      moveObject(type, movingObjects[i].parameters[0],
          movingObjects[i].parameters[1], movingObjects[i].parameters[2], 
          movingObjects[i].parameters[3], movingObjects[i].parameters[4]);
  }
      

  if (x > screenX + levelParams.winDist) {
      win();
      level = levelParams.level + 1;
  }
}

// Function to draw a platform
function drawPlatform(xcor, ycor, width) {
  let height = 10;
  xcor += height / 2;
  xcor += screenX;
  ctx.beginPath();
  ctx.fillStyle = '#369';
  ctx.fillRect(xcor, ycor, width, height);
  drawCircle(xcor, ycor + height / 2, height / 2);
  drawCircle(xcor + width, ycor + height / 2, height / 2);
  ctx.closePath();
  if (x >= xcor - 10 && x <= xcor + width + 10 && y <= ycor - 5 && y >= ycor - 20 && dy >= 0) {
    dy = 0;
    y = ycor - 15;
    onSticky = false;
  }
}

function drawBouncingPlatform(xcor, ycor, width) {
  let height = 10;
  xcor += height / 2;
  xcor += screenX;
  ctx.beginPath();
  ctx.fillStyle = '#f72';
  ctx.fillRect(xcor, ycor, width, height);
  drawCircle(xcor, ycor + height / 2, height / 2);
  drawCircle(xcor + width, ycor + height / 2, height / 2);
  ctx.closePath();
  if (x >= xcor - 10 && x <= xcor + width + 10 && y <= ycor - 5 && y >= ycor - 20 && dy >= 0) {
    dy = -13;
    y = ycor - 15;
    onSticky = false;
  }
}

function moveObject(type, moveX, xcor, moveY, ycor, width) {
  xcor += moveX * Math.cos(angle + pi / 2);
  ycor += moveY * Math.sin(angle + pi / 2);
  type(xcor, ycor, width);
}

function drawStickyPlatform(xcor, ycor, width) {
  let height = 10;
  xcor += height / 2;
  xcor += screenX;
  ctx.beginPath();
  ctx.fillStyle = '#3d6';
  ctx.fillRect(xcor, ycor, width, height);
  drawCircle(xcor, ycor + height / 2, height / 2);
  drawCircle(xcor + width, ycor + height / 2, height / 2);
  ctx.closePath();
  if (x >= xcor - 10 && x <= xcor + width + 10 && y <= ycor - 5 && y >= ycor - 20 && dy >= 0) {
    dy = 0;
    y = ycor - 15;
  }
  if (x >= xcor - 10 && x <= xcor + width + 10 && y <= ycor - 5 && y >= ycor - 20){
  	onSticky = true;
  }
}

function drawDeadly(xcor, ycor, width) {
  let height = 10;
  xcor += height / 2;
  xcor += screenX;
  xcor += width / 2;
  width /= 4;
  ctx.beginPath();
  ctx.fillStyle = '#f22';
  ctx.moveTo(xcor + width * Math.cos(20 * angle), ycor + width * Math.sin(20 * angle));
  ctx.lineTo(xcor + width * Math.cos(20 * (angle + 2 * Math.PI / 3)), ycor + width * Math.sin(20 * (angle + 2 * Math.PI / 3)));
  ctx.lineTo(xcor + width * Math.cos(20 * (angle + 4 * Math.PI / 3)), ycor + width * Math.sin(20 * (angle + 4 * Math.PI / 3)));
  ctx.fill();
  ctx.closePath();
  if (x >= xcor - 1.5 * width && x <= xcor +  1.5 * width && y <= ycor + 1.5 * width && y >= ycor - 1.5 * width && dy >= 0) {
    lifeLost();
    onSticky = false;
  }
}

function drawFloor(xcor, width) {
  let height = 60;
  let ycor = canvas.height - 60;
  xcor += screenX;
  ctx.beginPath();
  ctx.fillStyle = '#093';
  ctx.fillRect(xcor, ycor, width, height);
  ctx.closePath();
  if (x >= xcor && x <= xcor + width && y <= ycor + 8 && y >= ycor - 15 && dy >= 0) {
    dy = 0;
    y = ycor - 15;
    onSticky = false;
  }
}

function drawFlag(xcor) {
  ctx.fillStyle = '#ddd';
  ctx.fillRect(screenX + xcor, 200, 20, canvas.height);
  ctx.fillStyle = '#999';
  drawCircle(screenX + xcor + 10, 195, 12);
  ctx.fillStyle = '#d33';
  ctx.beginPath();
  ctx.moveTo(screenX + xcor, 210);
  ctx.lineTo(screenX + xcor - 50, 235);
  ctx.lineTo(screenX + xcor, 260);
  ctx.fill();
}

function drawCharacter() {
  ctx.fillStyle = '#f90';
  drawCircle(x, y, 15);
}

function moveCharacter() {
  if (keys.right && !keys.left) {
    dx = 1;
    while (dx <= 5) {
      dx *= (inertia + 0.04);
    }
  }
  if (keys.left && !keys.right) {
    dx = -1;
    while (dx >= -5) {
      dx *= (inertia + 0.04);
    }
  }
  if (keys.up && canJump) {
    dy = -10;
  }
 	if (dy === 0) {
  	canJump = true;
  } 
  if(dy !== 0 || onSticky) {
  	canJump = false;
  }
  
  x += dx;
  y += dy;
}

function keydown(e) {
  // 65 is the code for a
  if (e.keyCode === 65) {
    keys.left = true;
  }
  // 68 is the code for d
  if (e.keyCode === 68) {
    keys.right = true;
  }
  // 87 is the code for w and 32 is the code for the spacebar
  if (e.keyCode === 87 || e.keyCode === 32) {
    keys.up = true;
  }

  if (e.keyCode === 13) {
    restart();
    splash = true;
  }
  if (e.keyCode === 13 && dead === true) {
    dead = false;
    lives = 3;
  }

  if (e.keyCode) {
    pause = false;
    splash = false;
  }
}

function keyup(e) {
  if (e.keyCode === 65) {
    keys.left = false;
  }
  if (e.keyCode === 68) {
    keys.right = false;
  }
  if (e.keyCode === 87 || e.keyCode === 32) {
    keys.up = false;
  }
}

// make a circle
function drawCircle(xcor, ycor, radius) {
  ctx.beginPath();
  ctx.arc(xcor, ycor, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
}

// make a cloud
function drawCloud(xcor, ycor) {
  ctx.beginPath();
  ctx.fillStyle = '#fff';
  ctx.fillRect(xcor, ycor, 100, 30);
  drawCircle(xcor, ycor + 15, 15);
  drawCircle(xcor + 100, ycor + 15, 15);
  drawCircle(xcor + 20 + cloudPos[1], ycor, 25 + cloudPos[2]);
  drawCircle(xcor + 60 + cloudPos[1], ycor - 2, 25 + cloudPos[3]);
  ctx.closePath();
}

function drawLife(xcor, ycor, i) {
  xcor += screenX;
  if (!used[i]) {
  	ctx.beginPath();
  	ctx.fillStyle = '#3f3';
  	ctx.fillRect(xcor - 5, ycor - 15, 10, 30);
 		ctx.fillRect(xcor - 15, ycor - 5, 30, 10);
		ctx.closePath();
  	
  	if (x >= xcor - 10 && x <= xcor + 10 && y >= ycor - 10 && y <= ycor + 20 && !used[i]) {
  	  lives += 3;
      used[i] = true;
  	}
  }
}

function drawHouse(xcor) {
  ctx.fillStyle = '#fec'
  ctx.fillRect(screenX + xcor, canvas.height - 210, 200, 150);
  ctx.fillStyle = '#655';
  ctx.beginPath();
  ctx.moveTo(screenX + xcor - 25, canvas.height - 210);
  ctx.lineTo(screenX + xcor + 100, canvas.height - 280);
  ctx.lineTo(screenX + xcor + 225, canvas.height - 210);
  ctx.fill();
  ctx.fillStyle = '#222'
  ctx.fillRect(screenX + xcor + 60, canvas.height - 160, 80, 100);
}

function lifeLost() {
  restart();
  lives--;
  ctx.fillStyle = '#eee';
  ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 125, 400, 250);
  ctx.fillRect(canvas.width / 2 - 225, canvas.height / 2 - 100, 450, 200);
  drawCircle(canvas.width / 2 - 200, canvas.height / 2 - 100, 25);
  drawCircle(canvas.width / 2 - 200, canvas.height / 2 + 100, 25);
  drawCircle(canvas.width / 2 + 200, canvas.height / 2 - 100, 25);
  drawCircle(canvas.width / 2 + 200, canvas.height / 2 + 100, 25);
  ctx.fillStyle = '#333';
  ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 100, 400, 200);
  ctx.font = '50px Roboto, sans-serif';
  ctx.fillStyle = '#eee';
  ctx.fillText('You Died!', canvas.width / 2 - 110, canvas.height / 2 + 20);
  ctx.font = '20px Roboto, sans-serif';
  ctx.fillText('Press Any Key to Continue', canvas.width / 2 - 110, canvas.height / 2 + 60);
  pause = true;
  setTimeout(document.addEventListener("keydown", keydown), 500);
}

function died() {
  ctx.fillStyle = '#eee';
  ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 125, 400, 250);
  ctx.fillRect(canvas.width / 2 - 225, canvas.height / 2 - 100, 450, 200);
  drawCircle(canvas.width / 2 - 200, canvas.height / 2 - 100, 25);
  drawCircle(canvas.width / 2 - 200, canvas.height / 2 + 100, 25);
  drawCircle(canvas.width / 2 + 200, canvas.height / 2 - 100, 25);
  drawCircle(canvas.width / 2 + 200, canvas.height / 2 + 100, 25);
  ctx.fillStyle = '#333';
  ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 100, 400, 200);
  ctx.font = '50px Roboto, sans-serif';
  ctx.fillStyle = '#eee';
  ctx.fillText('Game Over!', canvas.width / 2 - 130, canvas.height / 2 + 20);
  ctx.font = '20px Roboto, sans-serif';
  ctx.fillText('Press Enter to Restart', canvas.width / 2 - 100, canvas.height / 2 + 60);
  dead = true;
  level = 1;
  used = [false, false, false, false];
  setTimeout(document.addEventListener("keydown", keydown), 1000);
}

function win() {
  drawBack();
  ctx.fillStyle = '#eee';
  ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 125, 400, 250);
  ctx.fillRect(canvas.width / 2 - 225, canvas.height / 2 - 100, 450, 200);
  drawCircle(canvas.width / 2 - 200, canvas.height / 2 - 100, 25);
  drawCircle(canvas.width / 2 - 200, canvas.height / 2 + 100, 25);
  drawCircle(canvas.width / 2 + 200, canvas.height / 2 - 100, 25);
  drawCircle(canvas.width / 2 + 200, canvas.height / 2 + 100, 25);
  ctx.fillStyle = '#333';
  ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 100, 400, 200);
  ctx.font = '50px Roboto, sans-serif';
  ctx.fillStyle = '#eee';
  ctx.fillText('You Won!', canvas.width / 2 - 110, canvas.height / 2 + 20);
  ctx.font = '20px Roboto, sans-serif';
  ctx.fillText('Press Any Key to Continue', canvas.width / 2 - 105, canvas.height / 2 + 60);
  pause = true;
  setTimeout(document.addEventListener("keydown", keydown), 1000);
  restart();
}

// Main draw function
function draw() {
  if (!dead && !pause && !splash) {
    angle += 0.01;
    if (angle >= Math.PI * 2) {
      angle = 0;
    }
    cloudPos[0] -= cloudPos[5];
    cloudPos[4] -= cloudPos[6];
    if (cloudPos[0] < -150) {
      cloudPos[0] = canvas.width + 90;
    }

    if (cloudPos[4] < -150) {
      cloudPos[4] = canvas.width + 90;
    }
    drawBack();
    drawLevel();
    drawCharacter();
    moveCharacter();
    dx *= (inertia - 0.15);
    dy *= (inertia);
    dy += 0.3;

    if (x >= 500) {
      x = 500;
      screenX -= dx;
    }

    if (x <= 100) {
      x = 100;
      screenX -= dx;
    }

    if (screenX >= 0 && level !== 3) {
      screenX = 0;
    }
    if (screenX >= 500) {
      screenX = 500;
    }

    if (y >= canvas.height + 15) {
      lifeLost();
    }
  }
  if (lives <= 0) {
    died();
  }
  if (splash) {
    startScreen();
  }

  document.addEventListener("keydown", keydown);
  document.addEventListener("keyup", keyup);
}

setInterval(draw, 1000 / 60);
