class Model {
    constructor(name) {
        this.name = name;
        this.iVertexBuffer = gl.createBuffer();
        this.iIndexBuffer = gl.createBuffer();
        this.iNormalBuffer = gl.createBuffer();
        this.count = 0;
    }

    bufferData(vertices, indices, normals) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        this.count = indices.length;
    }

    draw() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(
            shProgram.iAttribVertex,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(
            shProgram.iAttribNormal,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}

class Vertex {
    constructor(p) {
        this.p = p;
        this.normal = [];
        this.triangles = [];
    }
}

class Triangle {
    constructor(v0, v1, v2) {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
        this.normal = [];
        this.tangent = [];
    }
}

class Surface {
    constructor() {
        this.uPolylines = 0;
        this.vPolylines = 0;
        this.R2 = 7;
        this.R1 = 4;
        this.phi = Math.PI / 6;
        this.a = this.R2 - this.R1;
        if ((this.phi > 0 && this.a > 0) || (this.phi < 0 && this.a < 0)) {
            this.c = (2 * Math.PI * this.a) / Math.tan(this.phi);
            this.b = this.c / 4;
        } else {
            this.c = -(2 * Math.PI * this.a) / Math.tan(this.phi);
            this.b = (3 * this.c) / 4;
        }

        this.data = {};
    }

    createSurfaceData() {
        const normals = [];
        const triangles = [];
        const renderVertices = [];

        this.uPolylines = +document.getElementById("u").value;
        this.vPolylines = +document.getElementById("v").value;

        const vertices = this.vertexData();
        this.processData(vertices, renderVertices, triangles, normals);
        this.prepareData(renderVertices, triangles, normals);
    }

    surface(u, v) {
        const r = this.a * (1 - Math.cos((2 * Math.PI * v) / this.c)) + this.R1;
        const x = r * Math.cos(u);
        const y = r * Math.sin(u);
        const z = v;
        return new Vertex([x * 0.18, y * 0.18, z * 0.18]);
    }

    vertexData() {
        const vertices = [];
        const stepU = (2 * Math.PI) / this.uPolylines;
        const stepV = this.b / this.vPolylines;

        for (let i = 0; i < this.vPolylines; i++) {
            const v = i * stepV;
            for (let j = 0; j < this.uPolylines; j++) {
                const u = j * stepU;
                vertices.push(this.surface(u, v));
            }
        }
        return vertices;
    }

    createTriangle(
        v0ind,
        v1ind,
        v2ind,
        vertices,
        renderVertices,
        triangles,
        normals
    ) {
        const v0 = vertices[v0ind];
        const v1 = vertices[v1ind];
        const v2 = vertices[v2ind];
        const normal = v1.normal[0];

        normals.push(normal, normal, normal);

        const trIndex0 = this.triangleVertex(v0, normal, renderVertices);
        const trIndex1 = this.triangleVertex(v1, normal, renderVertices);
        const trIndex2 = this.triangleVertex(v2, normal, renderVertices);

        const triangle = new Triangle(trIndex0, trIndex1, trIndex2);
        triangles.push(triangle);
        triangle.normal.push(normal);

        this.triangleToVertices(triangle, normal, [v0, v1, v2]);
    }

    triangleVertex(vertex, normal, renderVertices) {
        const newVertex = new Vertex([...vertex.p]);
        newVertex.normal = normal;
        renderVertices.push(newVertex);
        return renderVertices.length - 1;
    }

    triangleToVertices(triangle, normal, vertices) {
        vertices.forEach((vertex) => vertex.triangles.push(triangle));
        vertices.forEach((vertex) => vertex.normal.push(normal));
    }

    calculateWeightedFacetNormal(vertices) {
        const stepU = (2 * Math.PI) / this.uPolylines;
        const stepV = this.b / this.vPolylines;
        let count = 0;

        for (let i = 0; i < this.vPolylines; i++) {
            for (let j = 0; j < this.uPolylines; j++) {
                const normals = [];
                const weights = [];

                const currV = this.surface(j * stepU, i * stepV);
                const v1 = this.surface((j + 1) * stepU, i * stepV);
                const v2 = this.surface(j * stepU, (i + 1) * stepV);
                const v3 = this.surface((j - 1) * stepU, (i - 1) * stepV);

                const facets = [
                    [v2, v1, currV],
                    [v3, currV, v1],
                ];

                facets.forEach(([a, b, c]) => {
                    const normal = this.calculateNormal(a, b, c);
                    const area = this.calculateTriangleArea(a, b, c);
                    normals.push(normal.map((v) => v * area));
                    weights.push(area);
                });

                let weightedNormal = normals.reduce(
                    (acc, n) => acc.map((v, i) => v + n[i]),
                    [0, 0, 0]
                );
                const weightSum = weights.reduce((sum, w) => sum + w, 0);
                weightedNormal = weightedNormal.map((v) => v / weightSum);

                vertices[count].normal.push(m4.normalize(weightedNormal));
                count++;
            }
        }
    }

    calculateNormal(a, b, c) {
        const edge1 = m4.subtractVectors(b.p, a.p);
        const edge2 = m4.subtractVectors(c.p, a.p);
        return m4.cross(edge1, edge2);
    }

    calculateTriangleArea(v0, v1, v2) {
        const edge1 = m4.subtractVectors(v1.p, v0.p);
        const edge2 = m4.subtractVectors(v2.p, v0.p);
        const crossProduct = m4.cross(edge1, edge2);
        return (
            0.5 * Math.sqrt(crossProduct.reduce((sum, v) => sum + v ** 2, 0))
        );
    }

    prepareData(renderVertices, allTriangles, normals) {
        this.data.verticesF32 = new Float32Array(renderVertices.length * 3);
        renderVertices.forEach((vertex, i) => {
            this.data.verticesF32.set(vertex.p, i * 3);
        });

        this.data.indicesU16 = new Uint16Array(allTriangles.length * 3);
        allTriangles.forEach((triangle, i) => {
            this.data.indicesU16.set(
                [triangle.v0, triangle.v1, triangle.v2],
                i * 3
            );
        });

        this.data.normalsF32 = new Float32Array(normals.length * 3);
        normals.forEach((normal, i) => {
            this.data.normalsF32.set(normal, i * 3);
        });
    }

    processData(vertices, renderVertices, allTriangles, normals) {
        this.calculateWeightedFacetNormal(vertices);

        for (let lineIndex = 1; lineIndex < this.vPolylines; lineIndex++) {
            const currentLineOffset = lineIndex * this.uPolylines;
            const previousLineOffset = (lineIndex - 1) * this.uPolylines;

            for (let i = 0; i < this.uPolylines; i++) {
                const v0ind = currentLineOffset + i;
                const v3ind = previousLineOffset + i;
                const v1ind = previousLineOffset + ((i + 1) % this.uPolylines);
                const v2ind = currentLineOffset + ((i + 1) % this.uPolylines);

                this.createTriangle(
                    v0ind,
                    v1ind,
                    v3ind,
                    vertices,
                    renderVertices,
                    allTriangles,
                    normals
                );
                this.createTriangle(
                    v2ind,
                    v1ind,
                    v0ind,
                    vertices,
                    renderVertices,
                    allTriangles,
                    normals
                );
            }
        }
    }
}
