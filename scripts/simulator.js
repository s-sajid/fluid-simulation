var canvas = document.getElementById("myCanvas");
var c = canvas.getContext("2d");	
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 80;

canvas.focus();

var simHeight = 1.0;	
var cScale = canvas.height / simHeight;
var simWidth = canvas.width / cScale;

var U_FIELD = 0;
var V_FIELD = 1;
var S_FIELD = 2;

var count = 0;

function cX(x) {
    return x * cScale;
}

function cY(y) {
    return canvas.height - y * cScale;
}

// simulator
class Fluid {
    constructor(density, numX, numY, h) {
        this.density = density;
        this.numX = numX + 2; 
        this.numY = numY + 2;
        this.numCells = this.numX * this.numY;
        this.h = h;
        this.u = new Float32Array(this.numCells);
        this.v = new Float32Array(this.numCells);
        this.newU = new Float32Array(this.numCells);
        this.newV = new Float32Array(this.numCells);
        this.p = new Float32Array(this.numCells);
        this.s = new Float32Array(this.numCells);
        this.m = new Float32Array(this.numCells);
        this.newM = new Float32Array(this.numCells);
        this.m.fill(1.0)
        var num = numX * numY;
    }

    integrate(dt, gravity) {
        var n = this.numY;
        for (var i = 1; i < this.numX; i++) {
            for (var j = 1; j < this.numY-1; j++) {
                if (this.s[i * n + j] != 0.0 && this.s[i * n + j - 1] != 0.0)
                    this.v[i * n + j] += gravity * dt;
            }	 
        }
    }

    solveIncompressibility(numIters, dt) {
        var n = this.numY;
        var cp = this.density * this.h / dt;

        for (var iter = 0; iter < numIters; iter++) {
            for (var i = 1; i < this.numX-1; i++) {
                for (var j = 1; j < this.numY-1; j++) {
                    if (this.s[i * n + j] == 0.0)
                        continue;

                    var s = this.s[i * n + j];
                    var sx0 = this.s[(i - 1) * n + j];
                    var sx1 = this.s[(i + 1) * n + j];
                    var sy0 = this.s[i * n + j - 1];
                    var sy1 = this.s[i * n + j + 1];
                    var s = sx0 + sx1 + sy0 + sy1;
                    if (s == 0.0)
                        continue;

                    var div = this.u[(i + 1) * n + j] - this.u[i * n + j] + 
                        this.v[i * n + j + 1] - this.v[i * n + j];

                    var p = -div / s;
                    p *= scene.overRelaxation;
                    this.p[i * n + j] += cp * p;
                    this.u[i * n + j] -= sx0 * p;
                    this.u[(i + 1) * n + j] += sx1 * p;
                    this.v[i * n + j] -= sy0 * p;
                    this.v[i * n + j + 1] += sy1 * p;
                }
            }
        }
    }

    extrapolate() {
        var n = this.numY;
        for (var i = 0; i < this.numX; i++) {
            this.u[i * n + 0] = this.u[i * n + 1];
            this.u[i * n + this.numY - 1] = this.u[i * n + this.numY -2 ]; 
        }
        for (var j = 0; j < this.numY; j++) {
            this.v[0 * n + j] = this.v[1 * n + j];
            this.v[(this.numX - 1) * n + j] = this.v[(this.numX - 2) * n + j] 
        }
    }

    sampleField(x, y, field) {
        var n = this.numY;
        var h = this.h;
        var h1 = 1.0 / h;
        var h2 = 0.5 * h;

        x = Math.max(Math.min(x, this.numX * h), h);
        y = Math.max(Math.min(y, this.numY * h), h);

        var dx = 0.0;
        var dy = 0.0;

        var f;

        switch (field) {
            case U_FIELD: f = this.u; dy = h2; break;
            case V_FIELD: f = this.v; dx = h2; break;
            case S_FIELD: f = this.m; dx = h2; dy = h2; break

        }

        var x0 = Math.min(Math.floor((x-dx)*h1), this.numX - 1);
        var tx = ((x - dx) - x0 * h) * h1;
        var x1 = Math.min(x0 + 1, this.numX - 1);
        
        var y0 = Math.min(Math.floor((y - dy) * h1), this.numY - 1);
        var ty = ((y - dy) - y0 * h) * h1;
        var y1 = Math.min(y0 + 1, this.numY - 1);

        var sx = 1.0 - tx;
        var sy = 1.0 - ty;

        var val = sx * sy * f[x0 * n + y0] +
            tx * sy * f[x1 * n + y0] +
            tx * ty * f[x1 * n + y1] +
            sx * ty * f[x0 * n + y1];
        
        return val;
    }

    avgU(i, j) {
        var n = this.numY;
        var u = (this.u[i * n + j - 1] + this.u[i * n + j] +
            this.u[(i + 1) * n + j - 1] + this.u[(i + 1)  *n + j]) * 0.25;
        return u;
            
    }

    avgV(i, j) {
        var n = this.numY;
        var v = (this.v[(i - 1) * n + j] + this.v[i * n + j] +
            this.v[(i - 1) * n + j + 1] + this.v[i * n + j + 1]) * 0.25;
        return v;
    }

    advectVel(dt) {

        this.newU.set(this.u);
        this.newV.set(this.v);

        var n = this.numY;
        var h = this.h;
        var h2 = 0.5 * h;

        for (var i = 1; i < this.numX; i++) {
            for (var j = 1; j < this.numY; j++) {

                count++;

                // u velocity component
                if (this.s[i * n + j] != 0.0 && this.s[(i-1) * n + j] != 0.0 && j < this.numY - 1) {
                    var x = i * h;
                    var y = j * h + h2;
                    var u = this.u[i * n + j];
                    var v = this.avgV(i, j);
                    x = x - dt * u;
                    y = y - dt * v;
                    u = this.sampleField(x,y, U_FIELD);
                    this.newU[i * n + j] = u;
                }
                // v velocity component
                if (this.s[i * n + j] != 0.0 && this.s[i * n + j - 1] != 0.0 && i < this.numX - 1) {
                    var x = i * h + h2;
                    var y = j * h;
                    var u = this.avgU(i, j);
                    var v = this.v[i * n + j];
                    x = x - dt * u;
                    y = y - dt * v;
                    v = this.sampleField(x,y, V_FIELD);
                    this.newV[i * n + j] = v;
                }
            }	 
        }

        this.u.set(this.newU);
        this.v.set(this.newV);
    }

    advectSmoke(dt) {

        this.newM.set(this.m);

        var n = this.numY;
        var h = this.h;
        var h2 = 0.5 * h;

        for (var i = 1; i < this.numX-1; i++) {
            for (var j = 1; j < this.numY-1; j++) {

                if (this.s[i * n + j] != 0.0) {
                    var u = (this.u[i * n + j] + this.u[(i + 1) * n + j]) * 0.5;
                    var v = (this.v[i * n + j] + this.v[i * n + j + 1]) * 0.5;
                    var x = i * h + h2 - dt * u;
                    var y = j * h + h2 - dt * v;

                    this.newM[i * n + j] = this.sampleField(x,y, S_FIELD);
                 }
            }	 
        }
        this.m.set(this.newM);
    }

    simulate(dt, gravity, numIters) {

        this.integrate(dt, gravity);

        this.p.fill(0.0);
        this.solveIncompressibility(numIters, dt);

        this.extrapolate();
        this.advectVel(dt);
        this.advectSmoke(dt);
    }
}

var scene = {
    gravity : -9.81,
    dt : 1.0 / 120.0,
    numIters : 100,
    frameNr : 0,
    overRelaxation : 1.9,
    obstacleX : 0.0,
    obstacleY : 0.0,
    obstacleRadius: 0.15,
    paused: false,
    sceneNr: 0,
    showObstacle: false,
    showStreamlines: false,
    showVelocities: false,	
    showColor: true,
    showSmoke: true,
    fluid: null
};

function setupScene(sceneNr = 1) {
    scene.sceneNr = sceneNr;
    scene.obstacleRadius = 0.15;
    scene.overRelaxation = 1.9;

    scene.dt = 1.0 / 60.0;
    scene.numIters = 40;

    var res = 100;

    var domainHeight = 1.0;
    var domainWidth = domainHeight / simHeight * simWidth;
    var h = domainHeight / res;

    var numX = Math.floor(domainWidth / h);
    var numY = Math.floor(domainHeight / h);

    var density = 1000.0;

    f = scene.fluid = new Fluid(density, numX, numY, h);

    var n = f.numY;

    if (sceneNr == 1) {
        var inVel = 2.0;
        for (var i = 0; i < f.numX; i++) {
            for (var j = 0; j < f.numY; j++) {
                var s = 1.0;
                if (i == 0 || j == 0 || j == f.numY-1)
                    s = 0.0;
                f.s[i * n + j] = s

                if (i == 1) {
                    f.u[i * n + j] = inVel;
                }
            }
        }

        var pipeH = 0.1 * f.numY;
        var minJ = Math.floor(0.5 * f.numY - 0.5 * pipeH);
        var maxJ = Math.floor(0.5 * f.numY + 0.5 * pipeH);


        for (var j = minJ; j < maxJ; j++)
            f.m[j] = 0.0;

        setObstacle(0.4, 0.5, true)

        scene.gravity = 0.0;
        scene.showColor = true;
        scene.showSmoke = true;
        scene.showStreamlines = false;
        scene.showVelocities = false;
    }

    document.getElementById("streamButton").checked = scene.showStreamlines;
    document.getElementById("velocityButton").checked = scene.showVelocities;
    document.getElementById("colorButton").checked = scene.showColor;
    document.getElementById("convergenceRate").textContent = scene.overRelaxation.toFixed(1);
    document.getElementById("convergenceSlider").value = scene.overRelaxation.toString();		
}

function updateConvergenceRate(value) {
    document.getElementById("convergenceRate").textContent = parseFloat(value).toFixed(1);
    scene.overRelaxation = parseFloat(value);
}

// interaction
var interactionScript = document.createElement('script');
interactionScript.src = 'scripts/interaction.js';
document.head.appendChild(interactionScript);

// draw
var drawScript = document.createElement('script');
drawScript.src = 'scripts/draw.js';
document.head.appendChild(drawScript);

// main
var mainScript = document.createElement('script');
mainScript.src = 'scripts/main.js';
document.head.appendChild(mainScript);
