class Model {
    constructor() {
        this.vertices = [];
        this.uLines = [];
        this.vLines = [];
    }

    bindBufferData() {
        this.vertices = this.generateVertices();
        this.iVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    }

    draw() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        const uLineSegments = this.uLines.length;
        const vLineSegments = this.vLines.length;
        const pointsInULine = this.uLines[0].length;
        const uVerticesCount = uLineSegments * pointsInULine;

        for (let uIndex = 0; uIndex < uLineSegments; uIndex++) {
            const uOffset = uIndex * pointsInULine;
            gl.drawArrays(gl.LINE_STRIP, uOffset, pointsInULine);
        }

        for (let vIndex = 0; vIndex < vLineSegments; vIndex++) {
            const vOffset = uVerticesCount + vIndex * uLineSegments;
            gl.drawArrays(gl.LINE_STRIP, vOffset, uLineSegments);
        }
    }

    createSurfaceData(R1, R2, phi) {
        const a = R2 - R1;
        let c, b;
        const steps = 30; 
        const thetaStep = Math.PI * 2; 

        if ((phi > 0 && a > 0) || (phi < 0 && a < 0)) {
            c = (2 * Math.PI * a) / Math.tan(phi);
            b = c / 4;
        } else {
            c = -(2 * Math.PI * a) / Math.tan(phi);
            b = 3 * c / 4;
        }

        for (let i = 0; i <= steps; i++) {
            let uLine = [];
            const z = (b / steps) * i;

            for (let j = 0; j <= steps; j++) {
                const theta = (thetaStep / steps) * j;
                const r = a * (1 - Math.cos(2 * Math.PI * z / c)) + R1;
                const x = r * Math.cos(theta);
                const y = r * Math.sin(theta);
                uLine.push([x * 0.1, y * 0.1, z * 0.1]);
            }
            this.uLines.push(uLine);
        }

        this.vLines = this.transpose(this.uLines);
    }

    generateVertices() {
        return this.uLines.flat(2).concat(this.vLines.flat(2));
    }

    transpose(matrix) {
        const [numRows, numCols] = [matrix.length, matrix[0].length];
        return Array.from({ length: numCols }, (_, col) =>
            Array.from({ length: numRows }, (_, row) => matrix[row][col])
        );
    }
}
