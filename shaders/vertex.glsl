attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;
uniform vec3 uLightDirection;

uniform vec3 uViewPosition;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;

varying vec3 vColor;

void main() {
attribute vec3 aPosition; // Позиція вершини
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vPosition; // Передаємо у світовому просторі

void main() {
    // Позиція вершини у світовому просторі
    vec4 worldPosition = uModelViewMatrix * vec4(aPosition, 1.0);

    // Передаємо позицію у Fragment Shader
    vPosition = worldPosition.xyz;

    // Позиція вершини у відсічному просторі
    gl_Position = uProjectionMatrix * worldPosition;
}

}