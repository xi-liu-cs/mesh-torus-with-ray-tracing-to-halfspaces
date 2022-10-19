function noise()
{
    return `
    vec3 stripes(float x)
    {
        float t = pow(sin(x) * .5 + .5, .1);
        return vec3(t, t * t, t * t * t);
    }
    float pattern(vec3 v)
    {
        const int n = 10;
        float res = 0., f = 1.;
        for(int i = 1; i < n; ++i)
        {
            res += noise(f * v) / float(i);
            f *= float(i);
            f += float(i);
        }
        return res;
    }
    vec3 object(float y)
    {
        vec3 back = vec3(0., 0., 0.);
        float s = mix(.5, 1., clamp(3.* y - 2., 0., 1.));
        return mix(back, vec3(s), clamp(.5 * y, 0., 1.));
    }
    `;
}