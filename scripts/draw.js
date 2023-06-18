function setColor(r,g,b) {
    c.fillStyle = `rgb(
        ${Math.floor(255*r)},
        ${Math.floor(255*g)},
        ${Math.floor(255*b)})`
    c.strokeStyle = `rgb(
        ${Math.floor(255*r)},
        ${Math.floor(255*g)},
        ${Math.floor(255*b)})`
}

function getSciColor(val, minVal, maxVal) {
    val = Math.min(Math.max(val, minVal), maxVal- 0.0001);
    var d = maxVal - minVal;
    val = d == 0.0 ? 0.5 : (val - minVal) / d;
    var m = 0.25;
    var num = Math.floor(val / m);
    var s = (val - num * m) / m;
    var r, g, b;

    switch (num) {
        case 0 : r = 0.0; g = s; b = 1.0; break;
        case 1 : r = 0.0; g = 1.0; b = 1.0-s; break;
        case 2 : r = s; g = 1.0; b = 0.0; break;
        case 3 : r = 1.0; g = 1.0 - s; b = 0.0; break;
    }

    return[255*r,255*g,255*b, 255]
}

function draw() 
{
    c.clearRect(0, 0, canvas.width, canvas.height);

    c.fillStyle = "#FF0000";
    f = scene.fluid;
    n = f.numY;

    var cellScale = 1.1;

    var h = f.h;

    minP = f.p[0];
    maxP = f.p[0];

    for (var i = 0; i < f.numCells; i++) {
        minP = Math.min(minP, f.p[i]);
        maxP = Math.max(maxP, f.p[i]);
    }

    id = c.getImageData(0,0, canvas.width, canvas.height)

    var color = [255, 255, 255, 255]

    for (var i = 0; i < f.numX; i++) {
        for (var j = 0; j < f.numY; j++) {

            if (scene.showColor) {
                var p = f.p[i*n + j];
                var s = f.m[i*n + j];
                color = getSciColor(p, minP, maxP);
                if (scene.showSmoke) {
                    color[0] = Math.max(0.0, color[0] - 255*s);
                    color[1] = Math.max(0.0, color[1] - 255*s);
                    color[2] = Math.max(0.0, color[2] - 255*s);
                }
            }
            else if (scene.showSmoke) {
                var s = f.m[i*n + j];
                color[0] = 255*s;
                color[1] = 255*s;
                color[2] = 255*s;
                if (scene.sceneNr == 2)
                    color = getSciColor(s, 0.0, 1.0);
            }
            else if (f.s[i*n + j] == 0.0) {
                color[0] = 0;
                color[1] = 0;
                color[2] = 0;
            }

            var x = Math.floor(cX(i * h));
            var y = Math.floor(cY((j+1) * h));
            var cx = Math.floor(cScale * cellScale * h) + 1;
            var cy = Math.floor(cScale * cellScale * h) + 1;

            r = color[0];
            g = color[1];
            b = color[2];

            for (var yi = y; yi < y + cy; yi++) {
                var p = 4 * (yi * canvas.width + x)

                for (var xi = 0; xi < cx; xi++) {
                    id.data[p++] = r;
                    id.data[p++] = g;
                    id.data[p++] = b;
                    id.data[p++] = 255;
                }
            }
        }
    }

    c.putImageData(id, 0, 0);

    if (scene.showVelocities) {

        c.strokeStyle = "#000000";	
        scale = 0.02;	

        for (var i = 0; i < f.numX; i++) {
            for (var j = 0; j < f.numY; j++) {

                var u = f.u[i*n + j];
                var v = f.v[i*n + j];

                c.beginPath();

                x0 = cX(i * h);
                x1 = cX(i * h + u * scale);
                y = cY((j + 0.5) * h );

                c.moveTo(x0, y);
                c.lineTo(x1, y);
                c.stroke();

                x = cX((i + 0.5) * h);
                y0 = cY(j * h );
                y1 = cY(j * h + v * scale)

                c.beginPath();
                c.moveTo(x, y0);
                c.lineTo(x, y1);
                c.stroke();

            }
        }
    }

    if (scene.showStreamlines) {
        var numSegs = 15;

        c.strokeStyle = "#000000";

        for (var i = 1; i < f.numX - 1; i += 5) {
            for (var j = 1; j < f.numY - 1; j += 5) {

                var x = (i + 0.5) * f.h;
                var y = (j + 0.5) * f.h;

                c.beginPath();
                c.moveTo(cX(x), cY(y));

                for (var n = 0; n < numSegs; n++) {
                    var u = f.sampleField(x, y, U_FIELD);
                    var v = f.sampleField(x, y, V_FIELD);
                    l = Math.sqrt(u*u + v*v);
                    x += u * 0.01;
                    y += v * 0.01;
                    if (x > f.numX * f.h)
                        break;

                    c.lineTo(cX(x), cY(y));
                }
                c.stroke();
            }
        }
    }

    if (scene.showObstacle) {

        c.strokeW
        r = scene.obstacleRadius + f.h;
        if (scene.showColor)
            c.fillStyle = "#ffffff";
        else
            c.fillStyle = "#ffffff";
        c.beginPath();	
        c.arc(
            cX(scene.obstacleX), cY(scene.obstacleY), cScale * r, 0.0, 2.0 * Math.PI); 
        c.closePath();
        c.fill();

        c.lineWidth = 3.0;
        c.strokeStyle = "#000000";
        c.beginPath();	
        c.arc(
            cX(scene.obstacleX), cY(scene.obstacleY), cScale * r, 0.0, 2.0 * Math.PI); 
        c.closePath();
        c.stroke();
        c.lineWidth = 1.0;
    }
}

function setObstacle(x, y, reset) {
    var vx = 0.0;
    var vy = 0.0;

    if (reset) {
        scene.paused = true;
        simulate();
        scene.paused = false;
    } else {
        vx = (x - scene.obstacleX) / scene.dt;
        vy = (y - scene.obstacleY) / scene.dt;
    }
    
    scene.obstacleX = x;
    scene.obstacleY = y;
    var r = scene.obstacleRadius;
    var f = scene.fluid;
    var n = f.numY;
    var cd = Math.sqrt(2) * f.h;

    for (var i = 1; i < f.numX-2; i++) {
        for (var j = 1; j < f.numY-2; j++) {

            f.s[i*n + j] = 1.0;

            dx = (i + 0.5) * f.h - x;
            dy = (j + 0.5) * f.h - y;

            if (dx * dx + dy * dy < r * r) {
                f.s[i*n + j] = 0.0;
                if (scene.sceneNr == 2) 
                    f.m[i*n + j] = 0.5 + 0.5 * Math.sin(0.1 * scene.frameNr)
                else 
                    f.m[i*n + j] = 1.0;
                f.u[i*n + j] = vx;
                f.u[(i+1)*n + j] = vx;
                f.v[i*n + j] = vy;
                f.v[i*n + j+1] = vy;
            }
        }
    }
    
    scene.showObstacle = true;
}