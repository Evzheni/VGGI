'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

document.getElementById("u").addEventListener("input", updateSurfaceData);
document.getElementById("v").addEventListener("input", updateSurfaceData);
function updateSurfaceData() {
    surface.uPolysNum = document.getElementById("u").value;
    surface.vPolysNum = document.getElementById("v").value;
    surface.createSurfaceData();
    surface.model.bufferData(surface.data.verticesF32, surface.data.indicesU16, surface.data.normalsF32);
    draw();
}

function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    this.iColor = -1;
    this.iModelViewProjectionMatrix = -1;
    this.iLightPos = -1;
    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

let angle = 0;  
let radius = 5; 
let lightHeight = 3; 
let lightPosLocation; 

function updateLightPosition() {
    angle += 0.02;  
    if (angle > 2 * Math.PI) {
        angle -= 2 * Math.PI; 
    }
    let x = radius * Math.cos(angle);  
    let y = lightHeight;  
    let z = radius * Math.sin(angle); 
    return [x, y, z];
}

function draw() { 
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const canvas = document.getElementById("webglcanvas");
    const aspectRatio = canvas.clientWidth / canvas.clientHeight;

    let lightPos = updateLightPosition();
    gl.uniform3fv(shProgram.iLightPos, lightPos);

    let projection = m4.perspective(Math.PI / 8, aspectRatio, 8, 12);
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    let modelViewProjectionMatrix = m4.multiply(projection, matAccum1);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjectionMatrix);
    gl.uniform4fv(shProgram.iColor, [1.0, 1.0, 1.0, 1.0]);

    surface.model.draw(); 
}

function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLightPos = gl.getUniformLocation(prog, "lightPos");

    surface = new Surface();
    surface.createSurfaceData();

    let model = new Model('Surface');
    model.bufferData(surface.data.verticesF32, surface.data.indicesU16, surface.data.normalsF32);
    surface.model = model; 

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
        if (!gl) throw "Browser does not support WebGL";

        initGL(); 
        spaceball = new TrackballRotator(canvas, draw, 0);
        if (!animationId) animate();
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            `<p>Sorry, could not initialize WebGL: ${e}</p>`;
    }
}

let animationId = null;

function animate() {
    draw();
    animationId = requestAnimationFrame(animate);
}
