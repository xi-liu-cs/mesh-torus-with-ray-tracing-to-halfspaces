function ray()
{
    return `
    #define at(r, t)(r.origin + t * r.direct)
    struct ray
    {
        vec3 origin, direct;
    };`
}