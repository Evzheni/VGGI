function Model(name) {
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

    this.BufferData = function(vertices, indices, normals, textCoord, tangents) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, textCoord, gl.STATIC_DRAW);

        this.count = indices.length;
    }
    
    this.draw = function() {
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

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTextureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTextureCoord);
        
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    this.DisplayPoint = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }

    this.PointBufferData = function (vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length / 3;
    }
}

function Vertex(p, t)
{
    this.p = p;
    this.t = t;
    this.normal = [];
    this.triangles = [];
}

function Triangle(v0, v1, v2)
{
    this.v0 = v0;
    this.v1 = v1;
    this.v2 = v2;
    this.normal = [];
    this.tangent = [];
}

let R2 = 7, R1 = 4, phi = Math.PI / 6, a = R2 - R1;
if ((phi > 0 && a > 0) || (phi < 0 && a < 0)) {
    c = (2 * Math.PI * a) / Math.tan(phi);
    b = c / 4;
} else {
    c = -(2 * Math.PI * a) / Math.tan(phi);
    b = (3 * c) / 4;
}
let uPolylines = +document.getElementById("u").value;
let vPolylines = +document.getElementById("v").value;
let stepU = 2 * Math.PI / uPolylines;
let stepV = b / vPolylines;

function createSurfaceData(data) {
    let normals = [];
    let triangles = [];
    let renderVertices = [];
    let tangents = [];
    
    let vertices = vertexData(uPolylines, vPolylines);
    processData(vPolylines, uPolylines, triangles, vertices, renderVertices, normals, tangents);
    prepareData(data, renderVertices, triangles, normals, tangents);
}

function surfacePE(u, v){
    let uNorm = u / (2 * Math.PI);
    let vNorm = v /b;
    const r = a * (1 - Math.cos((2 * Math.PI * v) / c)) + R1;
    const x = r * Math.cos(u);
    const y = r * Math.sin(u);
    const z = v;
    return new Vertex([x * 0.16, y * 0.16, z * 0.16], [uNorm, vNorm]);
}

function vertexData(uPolylines, vPolylines) {
    let vertices = [];
    for (let i=0; i<vPolylines; i++) {
        let v = i * stepV;  
        for (let j = 0; j < uPolylines; j++) {
            let u = j * stepU;  
            let vertex = surfacePE(u,v);
            vertices.push(vertex);
        }
    }
    return vertices;
}

function createTriangle(v0ind, v1ind, v2ind, vertices, renderVertices, triangles, normals){
    let v0 = vertices[v0ind];
    let v1 = vertices[v1ind];
    let v2 = vertices[v2ind];

    let normal = v1.normal[0];
    normals.push(normal, normal, normal);

    let trIndex0 = triangleVertex(v0, normal, renderVertices);
    let trIndex1 = triangleVertex(v1, normal, renderVertices);
    let trIndex2 = triangleVertex(v2, normal, renderVertices);

    let triangle = new Triangle(trIndex0, trIndex1, trIndex2);
    triangles.push(triangle);
    triangle.normal.push(normal);
    
    triangleToVertices(triangle, normal, [v0, v1, v2]);
}

function triangleVertex(vertex, normal, renderVertices) {
    let newVertex = new Vertex([...vertex.p], [...vertex.t]);
    newVertex.normal = normal;
    renderVertices.push(newVertex);
    return renderVertices.length - 1;
}

function triangleToVertices(triangle, normal, vertices) {
    vertices.forEach(vertex => vertex.triangles.push(triangle));
    vertices.forEach(vertex => vertex.normal.push(normal));
}

function calculateTangent(triangles, tangents, renderVertices){
    for (let i=0; i<triangles.length; i++) {
        let currTriangle = triangles[i];
        let v0ind = currTriangle.v0;
        let v1ind = currTriangle.v1;
        let v2ind = currTriangle.v2;

        let v0 = renderVertices[v0ind];
        let v1 = renderVertices[v1ind];
        let v2 = renderVertices[v2ind];

        let tangent = getTangent(v0, v1, v2); 
        v0.tangent = tangent;
        v1.tangent = tangent;
        v2.tangent = tangent;
        triangles[i].tangent = tangent;

        tangents.push(tangent, tangent, tangent);
    }
}

function getTangent(v0, v1, v2) {
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

function calculateWeightedFacetNormal(vertices) {
    const stepU = (2 * Math.PI) / uPolylines;
    const stepV = b / vPolylines;
    let count = 0;

    for (let i = 0; i < vPolylines; i++) {
        for (let j = 0; j < uPolylines; j++) {
            const normals = [];
            const weights = [];

            const currV = surfacePE(j * stepU, i * stepV);
            const v1 = surfacePE((j + 1) * stepU, i * stepV);
            const v2 = surfacePE(j * stepU, (i + 1) * stepV);
            const v3 = surfacePE((j - 1) * stepU, (i - 1) * stepV);

            const facets = [
                [v2, v1, currV],
                [v3, currV, v1],
            ];

            facets.forEach(([a, b, c]) => {
                const normal = calculateNormal(a, b, c);
                const area = calculateTriangleArea(a, b, c);
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

 function calculateTriangleArea(v0, v1, v2) {
    const edge1 = m4.subtractVectors(v1.p, v0.p);
    const edge2 = m4.subtractVectors(v2.p, v0.p);
    const crossProduct = m4.cross(edge1, edge2);
    return (
        0.5 * Math.sqrt(crossProduct.reduce((sum, v) => sum + v ** 2, 0))
    );
}

function prepareData(data, renderVertices, triangles, normals, tangents){
    data.textCoordF32 = new Float32Array(renderVertices.length * 2);

    data.verticesF32 = new Float32Array(renderVertices.length * 3);
    for (let i = 0, len = renderVertices.length; i < len; i++) {
        data.verticesF32[i * 3 + 0] = renderVertices[i].p[0];
        data.verticesF32[i * 3 + 1] = renderVertices[i].p[1];
        data.verticesF32[i * 3 + 2] = renderVertices[i].p[2];

        data.textCoordF32[i * 2 + 0] = renderVertices[i].t[0];
        data.textCoordF32[i * 2 + 1] = renderVertices[i].t[1];
    }

    data.indicesU16 = new Uint16Array(triangles.length * 3);
    for (let i = 0, len = triangles.length; i < len; i++) {
        data.indicesU16[i * 3 + 0] = triangles[i].v0;
        data.indicesU16[i * 3 + 1] = triangles[i].v1;
        data.indicesU16[i * 3 + 2] = triangles[i].v2;
    }

    data.normalsF32 = new Float32Array(normals.length * 3);
    for (let i = 0, len = normals.length; i < len; i++) {
        data.normalsF32[i * 3 + 0] = normals[i][0];
        data.normalsF32[i * 3 + 1] = normals[i][1];
        data.normalsF32[i * 3 + 2] = normals[i][2];
    }

    data.tangentsF32 = new Float32Array(tangents.length * 3);
    for (let i = 0, len = tangents.length; i < len; i++) {
        data.tangentsF32[i * 3 + 0] = tangents[i][0];
        data.tangentsF32[i * 3 + 1] = tangents[i][1];
        data.tangentsF32[i * 3 + 2] = tangents[i][2];
    }
}

function processData(vPolylines, uPolylines, triangles, originalVertices, renderVertices, normals, tangents) {
    calculateWeightedFacetNormal(originalVertices);

    for (let lineIndex = 1; lineIndex < vPolylines; lineIndex++) {
        let currentLineOffset = lineIndex * uPolylines;
        let previousLineOffset = (lineIndex - 1) * uPolylines;

        for (let i = 0; i < uPolylines; i++) {
            let v0ind = currentLineOffset + i;
            let v3ind = previousLineOffset + i;
            let v1ind = previousLineOffset + ((i + 1) % uPolylines);
            let v2ind = currentLineOffset + ((i + 1) % uPolylines);
            createTriangle(v0ind, v1ind, v3ind, originalVertices, renderVertices, triangles, normals);
            createTriangle(v2ind, v1ind, v0ind, originalVertices, renderVertices, triangles, normals);
        }
    }
    calculateTangent(triangles, tangents, renderVertices);
}

function calculateNormal(v0, v1, v2) {
    const edge1 = m4.subtractVectors(v1.p, v0.p);
    const edge2 = m4.subtractVectors(v2.p, v0.p);
    let normal = m4.cross(edge1, edge2);
    return m4.normalize(normal);
}

function  createSphere(center, radius, latitudeBands, longitudeBands) {
    const vertices = [];

    for (let lat = 0; lat <= latitudeBands; lat++) {
        const theta = lat * Math.PI / latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= longitudeBands; lon++) {
            const phi = lon * 2 * Math.PI / longitudeBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;

            vertices.push(radius * x + center[0], radius * y + center[1], radius * z + center[2]);
        }
    }

    return new Float32Array(vertices);
}