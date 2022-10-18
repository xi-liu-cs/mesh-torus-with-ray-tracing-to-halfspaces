function print_array(a)
{
    for(let i = 0; i < a.length; ++i)
        console.log(a[i]);
}

function merge_array(a, b)
{
    for(let i = 0; i < b.length; ++i)
        a.push(b[i]);
}

function dfs(n, r, count, start_num, a, cur)
{
    if(count == r)
    {
        a.push([...cur]);
        return;
    }
    for(let i = start_num; i <= n; ++i)
    {
        cur[count++] = i;
        dfs(n, r, count, i + 1, a, cur);
        --count;
    }
}

function combine(n, r)
{
    let a = [],
    cur = new Array(r);
    dfs(n, r, 0, 1, a, cur);
    return a;
}