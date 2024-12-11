class ShaderProgram {
    constructor( program) {
        this.prog = program;

        gl.useProgram(this.prog);

        this.iAttribVertex = gl.getAttribLocation(this.prog, "vertex");
        this.iModelViewProjectionMatrix = gl.getUniformLocation(this.prog, "ModelViewProjectionMatrix");
        this.iColor = gl.getUniformLocation(this.prog, "color");
    }
}