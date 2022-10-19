function ray_halfspace()
{
    return `
    float ray_halfspace(ray r, vec4 plane)
    {/* plane * r <= 0, plane * (origin + t * direct) <= 0,  plane * origin + t * plane * direct <= 0, t <= -(plane * origin) / (plane * direct) */
        vec4 origin = vec4(r.origin, 1.),
        direct = vec4(r.direct, 0.);
        return -dot(plane, origin) / dot(plane, direct);
    }`;
}

function ray_cube()
{
    return `
    vec4 ray_cube(ray r, mat4 inverse_matrix)
    {
        vec3 n = vec3(0.);
        float t_in = -1000., t_out = 1000.;
        for(int i = 0; i < n_side; ++i)
        {
                vec4 plane = inverse_matrix * u_cube[i]; /* if column major, vec4 plane = u_cube[i] * inverse_matrix; */
                plane /= sqrt(dot(plane.xyz, plane.xyz));
                float t = ray_halfspace(r, plane);
                if(dot(r.direct, plane.xyz) < 0.)
                {
                    if(t > t_in)
                    n = plane.xyz;
                    t_in = max(t_in, t);
                }
                else
                    t_out = min(t_out, t);
        }
        /* vec3 p = r.origin + t_in + r.direct; n += pattern(p); *//* vec3 p = r.origin + t_in + r.direct; n += 1. * noise(10. * p); */
        return vec4(n, t_in < t_out ? t_in : -.1);
    }`;
}

function ray_octahedron()
{
    return `
    vec4 ray_octahedron(ray r, mat4 inverse_matrix)
    {
        vec3 n = vec3(0.);
        float t_in = -1000., t_out = 1000.;
        for(int i = 0; i < 8; ++i)
        {
            vec4 plane = inverse_matrix * u_octahedron[i]; /* if column major, vec4 plane = u_octahedron[i] * inverse_matrix; */
            plane /= sqrt(dot(plane.xyz, plane.xyz));
            float t = ray_halfspace(r, plane);
            if(dot(r.direct, plane.xyz) < 0.)
            {
                if(t > t_in)
                n = plane.xyz;
                t_in = max(t_in, t);
            }
            else
                t_out = min(t_out, t);
        }
        /* vec3 p = r.origin + t_in + r.direct; n += pattern(p); *//* vec3 p = r.origin + t_in + r.direct; n += 1. * noise(10. * p); */
        return vec4(n, t_in < t_out ? t_in : -.1);
    }`;
}

function ray_10()
{
    return `
    vec4 ray_10(ray r, mat4 inverse_matrix)
    {
        vec3 n = vec3(0.);
        float t_in = -1000., t_out = 1000.;
        for(int i = 0; i < 10; ++i)
        {
            vec4 plane = inverse_matrix * u_10[i]; /* if column major, vec4 plane = u_octahedron[i] * inverse_matrix; */
            plane /= sqrt(dot(plane.xyz, plane.xyz));
            float t = ray_halfspace(r, plane);
            if(dot(r.direct, plane.xyz) < 0.)
            {
                if(t > t_in)
                n = plane.xyz;
                t_in = max(t_in, t);
            }
            else
                t_out = min(t_out, t);
        }
        /* vec3 p = r.origin + t_in + r.direct; n += pattern(p); *//* vec3 p = r.origin + t_in + r.direct; n += 1. * noise(10. * p); */
        return vec4(n, t_in < t_out ? t_in : -.1);
    }`;
}

function ray_polyhedron()
{
    return `
    vec4 ray_polyhedron(ray r, mat4 inverse_matrix)
    {
        vec3 n = vec3(0.);
        float t_in = -1000., t_out = 1000.;
        for(int i = 0; i < n_polyhedron; ++i)
        {
            vec4 plane = inverse_matrix * u_polyhedron[i]; /* if column major, vec4 plane = u_octahedron[i] * inverse_matrix; */
            plane /= sqrt(dot(plane.xyz, plane.xyz));
            float t = ray_halfspace(r, plane);
            if(dot(r.direct, plane.xyz) < 0.)
            {
                if(t > t_in)
                n = plane.xyz;
                t_in = max(t_in, t);
            }
            else
                t_out = min(t_out, t);
        }
        vec3 p = r.origin + t_in + r.direct; n += .5 * pattern(p); /* vec3 p = r.origin + t_in + r.direct; n += 1. * noise(10. * p); */
        return vec4(n, t_in < t_out ? t_in : -.1);
    }`;
}

function shade_polyhedron()
{
    return `
    vec3 shade_polyhedron(vec3 point, vec3 normal, mat4 material)
    {
        vec3 ambient = material[0].rgb,
        diffuse = material[1].rgb,
        specular = material[2].rgb;
        float power = material[2].a;
        vec3 n = normal,
        c = mix(ambient, u_back_color, .3),
        eye = vec3(0., 0., 1.);
        for(int i = 0; i < n_light; ++i)
        {
            float t = -1.;
            ray r = ray(point, u_light_direct[i]);
            for(int j = 0; j < n_sphere; ++j)
                t = max(t, ray_sphere(r, u_sphere[j]));
            if(t < 0.)
            {
                vec3 reflect = 2. * dot(n, u_light_direct[i]) * n - u_light_direct[i];
                c += u_light_color[i] * (diffuse * max(0., dot(n, u_light_direct[i]))
                + specular * pow(max(0., dot(reflect, eye)), power));
            }
        }
        c += .1 * pattern(n); /* c *= 1. + .5 * noise(3. * n); */
        return c;
    }`;
}

function ray_polyhedron2()
{
    return `
    vec4 ray_polyhedron2(ray r, mat4 inverse_matrix)
    {
        vec3 n = vec3(0.);
        float t_in = -1000., t_out = 1000.;
        for(int i = 0; i < n_polyhedron; ++i)
        {
            vec4 plane = inverse_matrix * u_polyhedron2[i]; /* if column major, vec4 plane = u_octahedron[i] * inverse_matrix; */
            plane /= sqrt(dot(plane.xyz, plane.xyz));
            float t = ray_halfspace(r, plane);
            if(dot(r.direct, plane.xyz) < 0.)
            {
                if(t > t_in)
                n = plane.xyz;
                t_in = max(t_in, t);
            }
            else
                t_out = min(t_out, t);
        }
        /* vec3 p = r.origin + t_in + r.direct; n += pattern(p); *//* vec3 p = r.origin + t_in + r.direct; n += 1. * noise(10. * p); */
        return vec4(n, t_in < t_out ? t_in : -.1);
    }`;
}

function ray_polyhedron3()
{
    return `
    vec4 ray_polyhedron3(ray r, mat4 inverse_matrix)
    {
        vec3 n = vec3(0.);
        float t_in = -1000., t_out = 1000.;
        for(int i = 0; i < n_polyhedron; ++i)
        {
            vec4 plane = inverse_matrix * u_polyhedron3[i]; /* if column major, vec4 plane = u_octahedron[i] * inverse_matrix; */
            plane /= sqrt(dot(plane.xyz, plane.xyz));
            float t = ray_halfspace(r, plane);
            if(dot(r.direct, plane.xyz) < 0.)
            {
                if(t > t_in)
                n = plane.xyz;
                t_in = max(t_in, t);
            }
            else
                t_out = min(t_out, t);
        }
        /* vec3 p = r.origin + t_in + r.direct; n += pattern(p); *//* vec3 p = r.origin + t_in + r.direct; n += 1. * noise(10. * p); */
        return vec4(n, t_in < t_out ? t_in : -.1);
    }`;
}

function ray_polyhedron4()
{
    return `
    vec4 ray_polyhedron4(ray r, mat4 inverse_matrix)
    {
        vec3 n = vec3(0.);
        float t_in = -1000., t_out = 1000.;
        for(int i = 0; i < n_polyhedron; ++i)
        {
            vec4 plane = inverse_matrix * u_polyhedron4[i]; /* if column major, vec4 plane = u_octahedron[i] * inverse_matrix; */
            plane /= sqrt(dot(plane.xyz, plane.xyz));
            float t = ray_halfspace(r, plane);
            if(dot(r.direct, plane.xyz) < 0.)
            {
                if(t > t_in)
                n = plane.xyz;
                t_in = max(t_in, t);
            }
            else
                t_out = min(t_out, t);
        }
        /* vec3 p = r.origin + t_in + r.direct; n += pattern(p); *//* vec3 p = r.origin + t_in + r.direct; n += 1. * noise(10. * p); */
        return vec4(n, t_in < t_out ? t_in : -.1);
    }`;
}