class Game {
    constructor() {
      // Initialize variables
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.x = this.canvas.width / 5;
      this.y = this.canvas.height - 75;
      this.dx = 0;
      this.dy = 0;
      this.angle = 0;
      this.cloudPos = [500 * Math.random() + 50, 10 * Math.random(), 5 * Math.random(), 8 * Math.random(), 500 * Math.random() + 50, 0.5 * Math.random() + 0.4, 0.5 * Math.random() + 0.4];
      this.keys = {
        left: false,
        right: false,
        up: false
      };
      this.screenX = 0;
      this.lives = 3;
      this.dead = false;
      this.pause = false;
      this.splash = true;
      this.level = 1;
      this.used = [false, false, false, false];
      this.canJump = true;
      this.onSticky = false;
      this.pi = Math.PI;
    }
  
    // Define methods
    startScreen() {
      this.ctx.fillStyle = '#444';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#eee';
      this.ctx.font = '75px Roboto, sans-serif';
      this.ctx.fillText('Untitled Platformer', this.canvas.width / 2 - 300, this.canvas.height / 3);
      this.ctx.font = '20px Roboto, sans-serif';
      this.ctx.fillText("Use 'w' or the spacebar to jump, 'd' to go right, and 'a' to go left", this.canvas.width / 2 - 265, 2 * this.canvas.height / 3);
      this.ctx.fillText("Press any key to start", this.canvas.width / 2 - 80, 2 * this.canvas.height / 3 + 50);
    }

    drawFlag(xcor) {
        this.ctx.fillStyle = '#ddd';
        this.ctx.fillRect(screenX + xcor, 200, 20, canvas.height);
        this.ctx.fillStyle = '#999';
        drawCircle(screenX + xcor + 10, 195, 12);
        this.ctx.fillStyle = '#d33';
        this.ctx.beginPath();
        this.ctx.moveTo(screenX + xcor, 210);
        this.ctx.lineTo(screenX + xcor - 50, 235);
        this.ctx.lineTo(screenX + xcor, 260);
        this.ctx.fill();
    }

    drawCharacter() {
        this.ctx.fillStyle = '#f90';
        this.drawCircle(this.x, this.y, 15);
    }

    drawCircle(xcor, ycor, radius) {
        this.ctx.beginPath();
        this.ctx.arc(xcor, ycor, radius, 0, this.pi * 2);
        this.ctx.fill();
        this.ctx.closePath();
    }

    drawLevel() {
        this.drawFloor(0, 500);
    }

    drawCloud(xcor, ycor) {
        this.ctx.beginPath();
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(xcor, ycor, 100, 30);
        this.drawCircle(xcor, ycor + 15, 15);
        this.drawCircle(xcor + 100, ycor + 15, 15);
        this.drawCircle(xcor + 20 + this.cloudPos[1], ycor, 25 + this.cloudPos[2]);
        this.drawCircle(xcor + 60 + this.cloudPos[1], ycor - 2, 25 + this.cloudPos[3]);
        this.ctx.closePath();
    }

    drawFloor(xcor, width) {
        let height = 60;
        let ycor = this.canvas.height - 60;
        this.xcor += screenX;
        this.ctx.beginPath();
        this.ctx.fillStyle = '#093';
        this.ctx.fillRect(xcor, ycor, width, height);
        this.ctx.closePath();
        if (this.x >= xcor && this.x <= xcor + width && this.y <= ycor + 8 && this.y >= ycor - 15 && this.dy >= 0) {
            this.dy = 0;
            this.y = ycor - 15;
            this.onSticky = false;
        }
    }
  
    drawBack() {
        this.ctx.fillStyle = '#5df';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        //sun
        this.ctx.fillStyle = '#ffff00';
        this.drawCircle(70, 90, 28);
        for (let i = 0; i < 8; i++) {
        this.ctx.beginPath();
        this.ctx.moveTo(70 + 35 * Math.cos(this.angle + i * this.pi / 4 - 0.2), 90 + 35 * Math.sin(this.angle + i * this.pi / 4 - 0.2));
        this.ctx.lineTo(70 + 65 * Math.cos(this.angle + i * this.pi / 4), 90 + 65 * Math.sin(this.angle + i * this.pi / 4));
        this.ctx.lineTo(70 + 35 * Math.cos(this.angle + i * this.pi / 4 + 0.2), 90 + 35 * Math.sin(this.angle + i * this.pi / 4 + 0.2));
        this.ctx.fill();
        }
        //clouds
        this.drawCloud(this.cloudPos[0], 80);
        this.drawCloud(this.cloudPos[4], 200);
        
        // hills
        this.ctx.fillStyle = '#082';
        this.drawCircle(this.screenX + 300, 650, 100);
        this.ctx.beginPath();
        this.ctx.moveTo(this.screenX + 150, 650);
        this.ctx.lineTo(this.screenX + 229, 580);
        this.ctx.lineTo(this.screenX + 372, 580);
        this.ctx.lineTo(this.screenX + 450, 650);
        this.ctx.fill();

        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(0, 0, this.canvas.width, 25);
        this.ctx.fillStyle = '#eee';
        this.ctx.font = '20px Roboto, sans-serif';
        this.ctx.fillText('Lives: ' + this.lives, 20, 20);
    }

    drawLife(xcor, ycor, i) {
        this.xcor += screenX;
        if (!this.used[i]) {
            this.ctx.beginPath();
            this.ctx.fillStyle = '#3f3';
            this.ctx.fillRect(xcor - 5, ycor - 15, 10, 30);
            this.ctx.fillRect(xcor - 15, ycor - 5, 30, 10);
            this.ctx.closePath();
            
            if (x >= xcor - 10 && x <= xcor + 10 && y >= ycor - 10 && y <= ycor + 20 && !used[i]) {
                lives += 3;
                used[i] = true;
            }
        }
    }

    move() {
        if (this.keys.right && !this.keys.left) {
            this.dx = 1;
            while (this.dx <= 5) {
              this.dx *= (this.inertia + 0.04);
            }
        }
        
        if (this.keys.left && !this.keys.right) {
            this.dx = -1;
            while (this.dx >= -5) {
                this.dx *= (this.inertia + 0.04);
            }
        }
        
        if (this.keys.up && this.canJump) {
            this.dy = -10;
        }
        
        if (this.dy === 0) {
            this.canJump = true;
        } 
        
        if(this.dy !== 0 || this.onSticky) {
            this.canJump = false;
        }
        
        this.x += this.dx;
        this.y += this.dy;
    }
}