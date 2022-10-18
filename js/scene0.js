rooms.scene = function()
{
lib3d();
description =
`scene<br>`;
code = {
'init': `
S.VERTEX_SIZE = 8;
S.square_mesh = 
[-1,1,0, 0,0,1, 0,1,
1,1,0, 0,0,1, 1,1,
-1,-1,0, 0,0,1, 0,0,
1,-1,0, 0,0,1, 1,0];

function glue_mesh(a, b)
{
    let mesh = a.slice();
    mesh.push(a.slice(a.length - S.VERTEX_SIZE, a.length));
    mesh.push(b.slice(0, S.VERTEX_SIZE));
    mesh.push(b);
    return mesh.flat();
}

function uv_mesh(f, nu, nv)
{
    let mesh = [];
    for(let iv = 0; iv < nv; ++iv)
    {
        let v = iv / nv,
        strip = [];
        for(let iu = 0; iu <= nu; ++iu)
        {
            let u = iu / nu;
            strip = strip.concat(f(u, v));
            strip = strip.concat(f(u, v + 1 / nv));
        }
        mesh = glue_mesh(mesh, strip);
    }
    return mesh;
}

function sphere_mesh_function(u, v)
{
    let theta = 2 * Math.PI * u,
    phi = Math.PI * v - Math.PI / 2,
    cu = Math.cos(theta),
    su = Math.sin(theta),
    cv = Math.cos(phi),
    sv = Math.sin(phi);
    return [cu * cv, su * cv, sv,
            cu * cv, su * cv, sv,
            u, v];
}
S.sphere_mesh = uv_mesh(sphere_mesh_function, 20, 10);

function transform_mesh(mesh, matrix)
{
    let result = [],
    imt = matrixTranspose(matrixInverse(matrix));
    for(let i = 0; i < mesh.length; i += S.VERTEX_SIZE)
    {
        let v = mesh.slice(i, i + S.VERTEX_SIZE);
        p = v.slice(0, 3);
        n = v.slice(3, 6),
        uv = v.slice(6, 8);
        p = matrixTransform(matrix, [p[0], p[1], p[2], 1]);
        n = matrixTransform(imt, [n[0], n[1], n[2], 0]);
        result = result.concat([p[0], p[1], p[2], n[0], n[1], n[2], uv[0], uv[1]]);
    }
    return result;
}

let face0 = transform_mesh(S.square_mesh, matrixTranslate([0, 0, 1])),
face1 = transform_mesh(face0, matrixRotx(Math.PI / 2)),
face2 = transform_mesh(face0, matrixRotx(Math.PI)),
face3 = transform_mesh(face0, matrixRotx(-Math.PI / 2)),
face4 = transform_mesh(face0, matrixRoty(-Math.PI / 2)),
face5 = transform_mesh(face0, matrixRoty(Math.PI / 2));
S.cube_mesh = 
glue_mesh(face0,
glue_mesh(face1,
glue_mesh(face2,
glue_mesh(face3,
glue_mesh(face4, face5)))));

S.draw_mesh =
function(mesh, matrix)
{
    let gl = S.gl;
    S.setUniform('Matrix4fv', 'uMatrix', false, matrix);
    S.setUniform('Matrix4fv', 'uInvMatrix', false, matrixInverse(matrix));
    S.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
    S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, mesh.length / S.VERTEX_SIZE);
}
`,
fragment: `S.setFragmentShader(\`
varying vec3 vPos, vNor;
void main()
{
    float c = .2 + .8 * max(0., dot(vNor, vec3(.57)));
    gl_FragColor = vec4(c, c, c, 1.);
}
\`);`,
vertex: `S.setVertexShader(\`
attribute vec3 aPos, aNor;
varying vec3 vPos, vNor;
uniform mat4 uMatrix, uInvMatrix, uProject;
void main()
{
    vec4 pos = uProject * uMatrix * vec4(aPos, 1.),
    nor = vec4(aNor, 0.) * uInvMatrix;
    vPos = pos.xyz;
    vNor = normalize(nor.xyz);
    gl_Position = pos * vec4(1, 1, -.01, 1.);
}
\`);`,
render: `
S.setUniform('Matrix4fv', 'uProject', false,
[1,0,0,0, 0,1,0,0, 0,0,1,-1, 0,0,0,1]);
let m = new Matrix();
m.identity();
m.translate([.4 * Math.cos(time), .4 * Math.sin(time), 0]);
m.rotz(-time);
m.scale([.4, .2, .2]);
S.draw_mesh(S.sphere_mesh, m.get());

m.identity();
m.rotx(time, 1, 0, 0);
m.roty(time, 0, 1, 0);
m.scale([.1, .2, .3]);
S.draw_mesh(S.cube_mesh, m.get());
`,
events: `
   ;
`
};
}