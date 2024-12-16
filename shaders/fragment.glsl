precision mediump float;

uniform vec3 uLightPosition; // Позиція джерела світла
uniform vec3 uNormal;        // Одна нормаль для всього трикутника

varying vec3 vPosition; // Позиція фрагмента у світовому просторі

void main() {
    // Нормалізація нормалі
    vec3 normal = normalize(uNormal);

    // Вектор до джерела світла
    vec3 lightDir = normalize(uLightPosition - vPosition);

    // Ambient
    vec3 ambient = vec3(0.1, 0.1, 0.1);

    // Diffuse (залежить від кута між нормаллю та світлом)
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = vec3(0.7, 0.7, 0.7) * diff;

    // Specular (спрощена модель)
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
    vec3 specular = vec3(1.0, 1.0, 1.0) * spec;

    // Загальна інтенсивність освітлення
    vec3 color = ambient + diffuse + specular;

    // Виведення кольору фрагмента
    gl_FragColor = vec4(color, 1.0);
}
