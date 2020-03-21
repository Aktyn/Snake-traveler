precision lowp float;

varying vec2 vUV;

//uniform sampler2D scene_pass;
uniform sampler2D foreground_pass;
//uniform sampler2D background_texture;

uniform float aspect;
uniform vec3 camera;

uniform vec2 offset;//normalized flipped resolution

#define SHADOW_TRANSPARENCY 0.15//0.15
#define SAMPLES 20
#define SAMPLESf 20.0
#define PARALAX_VALUE 1.5

vec4 combined(in vec2 uv) {
    //vec4 foreground = texture2D(scene_pass, uv);
    //return mix(texture2D(foreground_pass, uv), foreground, foreground.a);
    return texture2D(foreground_pass, uv);
}

void main() {
    //vec4 c = texture2D(foreground_pass, vec2(vUV.x, vUV.y));
    //gl_FragColor = vec4(c.rgb, 1.0);

    vec4 scene = combined(vUV);//texture2D(scene_pass, vUV);

    if(scene.a == 1.0) {//optimization
        gl_FragColor = scene;
        return;
    }

    vec2 paralax = 0.01 * camera.z * offset * //0.01 - as 0.1*0.1
        vec2(-(vUV.x * 2.0 - 1.0), vUV.y * 2.0 - 1.0) * PARALAX_VALUE;

    float shadow = 0.;//LONG SHADOWS

    float STEP = 1.0 / SAMPLESf;
    float ll = STEP;
    float darkness_factor = 1.0;
    float sh = scene.a;
    for(int i=1; i<=SAMPLES; i++) {
        vec4 curve = texture2D(foreground_pass, vUV+paralax*ll);
        if( curve.a  > 0.0 ) {
            if(curve.a > sh) {
                sh = curve.a;
                scene.rgb = curve.rgb;

                if(i == 1)
                    darkness_factor = 0.9;
                else if(i == 2)
                    darkness_factor = 0.9;
                else if(i == 3)
                    darkness_factor = 0.9;
                else if(i == 4)
                    darkness_factor = 0.866666;
                else if(i == 5)
                    darkness_factor = 0.833333;
                else
                    darkness_factor = 0.8;
            }
        }

        shadow = max(shadow, combined(vUV + offset*ll*camera.z*0.1).a * pow(1.0-ll, 2.0));

        ll += STEP;
    }
    scene.rgb *= darkness_factor;
    scene.a = sh;
    
    shadow = sqrt(min(shadow, 1.0)) * SHADOW_TRANSPARENCY - scene.a;

    // vec2 tile_coord = vec2(
    //     ((vUV.x-0.5)*aspect / camera.z + (camera.x+map_scale)/2.0)/map_scale, 
    //     ((vUV.y-0.5) / camera.z + (camera.y+map_scale)/2.0)/map_scale
    // );

    //vec3 background_tex = texture2D(background_texture, tile_coord).rgb;
    vec3 background_tex = vec3(0.5, 0.5, 0.5);
    gl_FragColor = vec4(mix(background_tex * (1.-shadow), scene.rgb, scene.a), 1.);
    //old: gl_FragColor = vec4(mix(background_color * (1.-shadow), scene.rgb, scene.a), 1.);
}