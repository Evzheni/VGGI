'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let sphere;

let startPoint = [0,0]
let center = [0, 0, 0];
let rotationAngle = 0.0;
let sphereRadius = 0.08; 
let latitudeBands = 30; 
let longitudeBands = 30;

document.getElementById("angleSlider").addEventListener("input", function(event) {
    let degrees = parseFloat(event.target.value);
    rotationAngle = degrees * Math.PI / 180; 
    draw();  
});

function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    this.iAttribTextureCoord = -1;
    this.iModelViewProjectionMatrix = -1;
    this.iModelViewMatrix  = -1;
    this.iColor = -1;
    this.iLightPos = -1;
    this.iViewPos = -1;
    this.istartPoint = -1;
    this.iTextureScale = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

function draw() { 
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let centerVert = surfacePE(startPoint[0], startPoint[1]);
    center = [centerVert.p[0], centerVert.p[1], centerVert.p[2]];
    const lightPos = [5, 20, 5];
    const canvas = document.getElementById("webglcanvas");
    const aspectRatio = canvas.clientWidth / canvas.clientHeight;
    let projection = m4.perspective(Math.PI/8, aspectRatio, 8, 12); 
    let modelView = spaceball.getViewMatrix();
    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,-10);
    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);
    let modelViewProjectionMatrix = m4.multiply(projection, matAccum1);
    gl.uniform3fv(shProgram.iLightPos, lightPos);
    gl.uniform4fv(shProgram.iColor, [1.0, 0.0, 0.0, 1.0]);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjectionMatrix);
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum1);
    gl.uniform3fv(shProgram.iViewPos, [0.0, 0.0, 1.0]);
    gl.uniform1i(shProgram.hasTexture, true);
    surface.draw();
    gl.uniform1i(shProgram.hasTexture, false);
    sphere.DisplayPoint();
    gl.uniform1f(shProgram.iRotationAngle, rotationAngle);  

}

function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();
    shProgram.iAttribVertex              = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal              = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTextureCoord        = gl.getAttribLocation(prog, "texCoord");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iModelViewMatrix           = gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iColor                     = gl.getUniformLocation(prog, "color");
    shProgram.iLightPos                  = gl.getUniformLocation(prog, "lightPos");
    shProgram.iViewPos                   = gl.getUniformLocation(prog, "viewPos");
    shProgram.istartPoint           = gl.getUniformLocation(prog, "startPoint")
    shProgram.iTextureScale              = gl.getUniformLocation(prog, "textureScale")
    shProgram.hasTexture              = gl.getUniformLocation(prog, "hasTexture")
    shProgram.iRotationCenter = gl.getUniformLocation(prog, "rotationCenter");
    shProgram.iRotationAngle = gl.getUniformLocation(prog, "rotationAngle");

    let data = {};
    createSurfaceData(data)
    surface = new Model('Surface');
    surface.BufferData(data.verticesF32, data.indicesU16, data.normalsF32, data.textCoordF32);

    surface.iTextureDiffuse  = LoadTexture('textures/Diffuse.png');
    surface.iTextureSpecular = LoadTexture('textures/Specular.png');
    surface.iTextureNormal = LoadTexture('textures/Normal.png');

    sphere = new Model('Sphere');
    let sphereVertices = createSphere(center, sphereRadius, latitudeBands, longitudeBands);
    sphere.PointBufferData(sphereVertices);

    gl.enable(gl.DEPTH_TEST);
}

function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
     }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL(); 
        spaceball = new TrackballRotator(canvas, draw, 0);
        if (!animationId) {
            animate();
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }
    
}

let animationId = null;

function animate() {
    let sphereVertices = createSphere(center, sphereRadius, latitudeBands, longitudeBands);
    sphere.PointBufferData(sphereVertices);
    draw();
    requestAnimationFrame(animate);
}

document.getElementById("u").addEventListener("input", updateSurfaceData);
document.getElementById("v").addEventListener("input", updateSurfaceData);
function updateSurfaceData() {
    surface.uPolylines = document.getElementById("u").value;
    surface.vPolylines = document.getElementById("v").value;
    surface.createSurfaceData();
    surface.model.bufferData(surface.data.verticesF32, surface.data.indicesU16, surface.data.normalsF32);
    draw();
}

document.addEventListener("keydown", (event) => {
    const step = 0.01;
    let uMax = (uPolylines - 1) * stepU;
    let vMax = (vPolylines - 1) * stepV;

    switch (event.key) {
        case "s":
            startPoint[1] += step;
            if (startPoint[1] > vMax) {
                startPoint[1] = vMax;
            }
            break;
        case "w":
            startPoint[1] -= step;
            if (startPoint[1] < 0) {
                startPoint[1] = 0;
            }
            break;
        case "d":
            startPoint[0] -= step;
            if (startPoint[0] < 0) {
                startPoint[0] = 0;
            }
            break;
        case "a":
            startPoint[0] += step;
            if (startPoint[0] > uMax) {
                startPoint[0] = uMax;
            }
            break;
    }

    let normalizedStartPoint = [
        startPoint[0] / uMax,
        startPoint[1] / vMax,
    ];

    document.getElementById("rotationPoint").innerHTML =
        `[${normalizedStartPoint[0].toFixed(2)}, ${normalizedStartPoint[1].toFixed(2)}]`;

    gl.uniform2fv(shProgram.iRotationCenter, normalizedStartPoint);
    draw();
});
