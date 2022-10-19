function shader_init(gl, vertex, fragment)
{
    let vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex_shader, vertex);
    gl.compileShader(vertex_shader);
    let fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragment_shader, fragment);
    gl.compileShader(fragment_shader);
    let program = gl.createProgram();
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);
    let link = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(!link)
    {
        let error = gl.getProgramInfoLog(program);
        console.log(error);
        gl.deleteProgram(program);
        gl.deleteShader(fragment_shader);
        gl.deleteShader(vertex_shader);
        return;
    }
    gl.useProgram(program);
    gl.program = program;
}

function shader_file_load(gl, file, type, start)
{
    if(type == 'v')
        vertex = file;
    else if(type == 'f')
        fragment = file;
    if(vertex && fragment)
        start(gl);
}

function shader_file(gl, file, type, start)
{
    let request = new XMLHttpRequest();
    request.onreadystatechange =
    function()
    {
        if(request.readyState == 4 && request.status != 404)
            shader_file_load(gl, request.responseText, type, start);
    };
    request.open('get', file, true);
    request.send();
}