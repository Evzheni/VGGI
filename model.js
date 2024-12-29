class Model {
    constructor(name) {
        this.name = name;
        this.iVertexBuffer = gl.createBuffer();
        this.iIndexBuffer = gl.createBuffer();
        this.iNormalBuffer = gl.createBuffer();
        this.iTextureBuffer = gl.createBuffer();
        this.iTangentBuffer = gl.createBuffer();
        this.count = 0;
        this.iTextureDiffuse  = -1;
        this.iTextureSpecular = -1;
        this.iTextureNormal = -1;
    }

    bufferData(vertices, indices, normals, textCoord, tangents) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, textCoord, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, tangents, gl.STATIC_DRAW);

        this.count = indices.length;
    }

    draw() {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, surface.iTextureDiffuse);
        gl.uniform1i(shProgram.iTextureDiffuse, 0); 

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, surface.iTextureSpecular);
        gl.uniform1i(shProgram.iTextureSpecular, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, surface.iTextureNormal);
        gl.uniform1i(shProgram.iTextureNormal, 2);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTangent, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTangent);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTextureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTextureCoord);

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}

class Vertex {
    constructor(p, t) {
        this.p = p;
        this.t = t;
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
        let tangents = [];

        this.uPolylines = +document.getElementById("u").value;
        this.vPolylines = +document.getElementById("v").value;

        const vertices = this.vertexData();
        this.processData(vertices, renderVertices, triangles, normals, tangents);
        this.prepareData(renderVertices, triangles, normals, tangents);
    }

   

    surface(u, v) {
        let uNorm = u / (2 * Math.PI);
        let vNorm = v / this.b;
        const r = this.a * (1 - Math.cos((2 * Math.PI * v) / this.c)) + this.R1;
        const x = r * Math.cos(u);
        const y = r * Math.sin(u);
        const z = v;
        return new Vertex([x * 0.18, y * 0.18, z * 0.18], [uNorm, vNorm]);
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
        const newVertex = new Vertex([...vertex.p], [...vertex.t]);
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

    calculateTangent(triangles, tangents, renderVertices){
        for (let i=0; i<triangles.length; i++) {
            let currTriangle = triangles[i];
            let v0ind = currTriangle.v0;
            let v1ind = currTriangle.v1;
            let v2ind = currTriangle.v2;
    
            let v0 = renderVertices[v0ind];
            let v1 = renderVertices[v1ind];
            let v2 = renderVertices[v2ind];
    
            let tangent = this.getTangent(v0, v1, v2); 
            v0.tangent = tangent;
            v1.tangent = tangent;
            v2.tangent = tangent;
            triangles[i].tangent = tangent;
    
            tangents.push(tangent, tangent, tangent);
        }
    }

    getTangent(v0, v1, v2) {
        let edge1 = [v1.p[0] - v0.p[0], v1.p[1] - v0.p[1], v1.p[2] - v0.p[2]];
        let edge2 = [v2.p[0] - v0.p[0], v2.p[1] - v0.p[1], v2.p[2] - v0.p[2]];
    
        let uv1 = [v1.t[0] - v0.t[0], v1.t[1] - v0.t[1]];
        let uv2 = [v2.t[0] - v0.t[0], v2.t[1] - v0.t[1]];
    
        let det = (uv1[0] * uv2[1] - uv1[1] * uv2[0]);
    
        let Tx = (edge1[0] * uv2[1] - edge2[0] * uv1[1]) / det;
        let Ty = (edge1[1] * uv2[1] - edge2[1] * uv1[1]) / det;
        let Tz = (edge1[2] * uv2[1] - edge2[2] * uv1[1]) /det;
    
        let tangent = [Tx, Ty, Tz];
        return tangent;
    }   
    
    prepareData(renderVertices, allTriangles, normals, tangents) {
        this.data.textCoordF32 = new Float32Array(renderVertices.length * 2);

        this.data.verticesF32 = new Float32Array(renderVertices.length * 3);
        for (let i = 0, len = renderVertices.length; i < len; i++) {
            this.data.verticesF32[i * 3 + 0] = renderVertices[i].p[0];
            this.data.verticesF32[i * 3 + 1] = renderVertices[i].p[1];
            this.data.verticesF32[i * 3 + 2] = renderVertices[i].p[2];

            this.data.textCoordF32[i * 2 + 0] = renderVertices[i].t[0];
            this.data.textCoordF32[i * 2 + 1] = renderVertices[i].t[1];
        }

        this.data.indicesU16 = new Uint16Array(allTriangles.length * 3);
        for (let i = 0, len = allTriangles.length; i < len; i++) {
            this.data.indicesU16[i * 3 + 0] = allTriangles[i].v0;
            this.data.indicesU16[i * 3 + 1] = allTriangles[i].v1;
            this.data.indicesU16[i * 3 + 2] = allTriangles[i].v2;
        }

        this.data.normalsF32 = new Float32Array(normals.length * 3);
        for (let i = 0, len = normals.length; i < len; i++) {
            this.data.normalsF32[i * 3 + 0] = normals[i][0];
            this.data.normalsF32[i * 3 + 1] = normals[i][1];
            this.data.normalsF32[i * 3 + 2] = normals[i][2];
        }

        this.data.tangentsF32 = new Float32Array(tangents.length * 3);
        for (let i = 0, len = tangents.length; i < len; i++) {
            this.data.tangentsF32[i * 3 + 0] = tangents[i][0];
            this.data.tangentsF32[i * 3 + 1] = tangents[i][1];
            this.data.tangentsF32[i * 3 + 2] = tangents[i][2];
        }
    }

    processData(vertices, renderVertices, allTriangles, normals, tangents) {
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
        this.calculateTangent(allTriangles, tangents, renderVertices);
    }
}
