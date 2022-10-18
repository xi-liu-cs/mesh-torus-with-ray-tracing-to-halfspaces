function sphere()
{
    return `
    struct sphere
    {
        vec3 center;
        float radius;
    };`
}

function ray_sphere()
{
    return `
    float ray_sphere(ray r, sphere s)
    {
        vec3 oc = r.origin - s.center;
        oc += .01 * r.direct;
        float b = dot(oc, r.direct),
        c = dot(oc, oc) - s.radius * s.radius,
        disc = b * b - c;
        return disc < 0. ? -1. : -b - sqrt(disc);
    }`;
}

function shade_sphere()
{
    return `
    vec3 shade_sphere(vec3 point, sphere s, mat4 material)
    {
        vec3 ambient = material[0].rgb,
        diffuse = material[1].rgb,
        specular = material[2].rgb;
        float power = material[2].a;
        vec3 n = normalize(point - s.center),
        c = mix(ambient, u_back_color, .3),
        eye = vec3(0., 0., 1.);
        if(s.radius == big_radius)
            c += vec3(.4, .2, 0.);
        for(int i = 0; i < n_light; ++i)
        {
            float t = -1.;
            for(int j = 0; j < n_sphere; ++j)
            {
                ray r = ray(point, u_light_direct[i]);
                t = max(t, ray_sphere(r, u_sphere[j]));
            }
            if(t < 0.)
            {
                vec3 reflect = 2. * dot(n, u_light_direct[i]) * n - u_light_direct[i];
                c += u_light_color[i] * (diffuse * max(0., dot(n, u_light_direct[i]))
                + specular * pow(max(0., dot(reflect, eye)), power));
            }
        }
        c += pattern(n); /* c *= 1. + .5 * noise(3. * n); */
        return c;
    }`;
}