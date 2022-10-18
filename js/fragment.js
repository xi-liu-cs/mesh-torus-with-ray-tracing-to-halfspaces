function fragment()
{
    return define() +
    ray() +
    sphere() + 
    `const int n_sphere = ` + S.n_sphere + `,
    n_light = ` + S.n_light + `,
    n_side = ` + S.n_side + `,
    n_polyhedron = ` + S.n_polyhedron + `;
    uniform float u_time;
    uniform vec3 u_back_color;
    uniform sphere u_sphere[n_sphere];
    uniform mat4 u_sphere_material[n_sphere];
    uniform mat4 u_cube_inverse_matrix;
    uniform vec4 u_cube[6];
    uniform vec4 u_octahedron[8];
    uniform vec4 u_polyhedron[n_polyhedron], u_polyhedron2[n_polyhedron], u_polyhedron3[n_polyhedron], u_polyhedron4[n_polyhedron];
    uniform vec3 u_light_direct[n_light];
    uniform vec3 u_light_color[n_light];
    varying vec3 vPos;
    float focal_length = 3.,
    big_radius = .3; ` +
    noise() +
    ray_sphere() +
    shade_sphere() +
    shade_polyhedron() +
    ray_halfspace() +
    ray_cube() +
    ray_octahedron() +
    ray_polyhedron() + 
    ray_polyhedron2() +
    ray_polyhedron3() +
    ray_polyhedron4() + `
    void main()
    {
        vec3 color = u_back_color;
        ray r = ray(vec3(0., 0., focal_length), normalize(vec3(vPos.xy, -focal_length)));
        float t_min = 10000.;
        for(int i = 0; i < n_sphere; ++i)
        {
            float t = ray_sphere(r, u_sphere[i]);
            if(t > 0. && t < t_min)
            {
                vec3 p = at(r, t);
                color = shade_sphere(p, u_sphere[i], u_sphere_material[i]);
                t_min = t;
                vec3 n = normalize(p - u_sphere[i].center),
                reflect = 2. * dot(n, -r.direct) * n + r.direct;
                float reflect_t_min = 10000.;
                vec3 reflect_color;
                for(int j = 0; j < n_sphere; ++j)
                {
                    ray reflect_r = ray(p, reflect);
                    float reflect_t = ray_sphere(reflect_r, u_sphere[j]);
                    if(reflect_t > 0. && reflect_t < reflect_t_min)
                    {
                    reflect_t_min = reflect_t;
                    reflect_color = shade_sphere(p + reflect_t * reflect, u_sphere[j], u_sphere_material[j]);
                    }
                }
                if(reflect_t_min < 10000.)
                    color += .5 * reflect_color;
            }
        }
        vec4 n_t = ray_cube(r, u_cube_inverse_matrix);
        if(0. < n_t.w && n_t.w < t_min)
        {
            vec3 ambient = mix(vec3(.1), u_back_color, .3);
            color += ambient + 0.7 * vec3(max(0., dot(n_t.xyz, vec3(.5))));
        }
        vec4 n_t2 = ray_octahedron(r, u_cube_inverse_matrix);
        if(0. < n_t2.w && n_t2.w < t_min)
        {
            vec3 ambient = mix(vec3(.1), u_back_color, .3);
            color += ambient + vec3(max(0., dot(n_t2.xyz, vec3(.5))));
        }
        else
        {
            vec3 p = vPos + vec3(.1 * u_time, 0, .1 * u_time);
            /* color += object(p.y + pattern(p)) * stripes(p.y + pattern(p)); */
        }
        gl_FragColor = vec4(sqrt(color), 1.);
    }`;
}