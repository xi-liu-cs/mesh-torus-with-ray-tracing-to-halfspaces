rooms.scene = function()
{
lib3d();
description =
`scene<br>
<small>
   <p>
   <b>background color</b>
   <br><input type = range id = red   value = 5>red
   <br><input type = range id = green value = 10>green
   <br><input type = range id = blue  value = 50>blue
</small>`;
code = {
'init': `
S.VERTEX_SIZE = 8;
S.n_sphere = 15;
S.radius = .05;
S.n_light = 2;
S.n_side = 6;
S.n_polyhedron = 20;
let materials =
[
   [.15,.05,.025,0, .3,.1,.05,0, .6,.2,.1,3, 0,0,0,0], /* copper */
   [.25,.15,.025,0, .5,.3,.05,0, 1,.6,.1,6,  0,0,0,0], /* gold */
   [.25,0,0,0,      .5,0,0,0,    2,2,2,20,   0,0,0,0], /* plastic */
   [.05,.05,.05,0,  .1,.1,.1,0,  1,1,1,5,    0,0,0,0], /* lead */
   [.1,.1,.1,0,     .1,.1,.1,0,  1,1,1,5,    0,0,0,0], /* silver */
];
S.material = [];
for(let i = 0; i < S.n_sphere; ++i)
   S.material.push(materials[i % materials.length]);
S.s_pos = [];
S.s_velocity = [];
for(let i = 0; i < S.n_sphere; ++i)
{
   S.s_pos.push([Math.random() - .5, Math.random() - .5, Math.random() - .5]);
   S.s_velocity.push([0, 0, 0]);
}

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

function uvr_mesh(f, nu, nv, r)
{
    let mesh = [];
    for(let iv = 0; iv < nv; ++iv)
    {
        let v = iv / nv,
        strip = [];
        for(let iu = 0; iu <= nu; ++iu)
        {
            let u = iu / nu;
            strip = strip.concat(f(u, v, r));
            strip = strip.concat(f(u, v + 1 / nv, r));
        }
        mesh = glue_mesh(mesh, strip);
    }
    return mesh;
}

function torus_mesh_function(u, v, r)
{
    let theta = 2 * Math.PI * u,
    phi = 2 * Math.PI * v,
    cu = Math.cos(theta),
    su = Math.sin(theta),
    cv = Math.cos(phi),
    sv = Math.sin(phi),
    x = cu * (1 + r * cv),
    y = su * (1 + r * cv),
    z = r * sv,
    nx = cu * cv,
    ny = su * cv,
    nz = sv;
    return [x, y, z,
            nx, ny, nz,
            u, v];
}
S.torus_mesh = uvr_mesh(torus_mesh_function, 20, 10, .4);

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
face5 = transform_mesh(face0, matrixRoty(Math.PI / 2)),
face6 = transform_mesh(face0, matrixRotz(Math.PI / 4)),
face7 = transform_mesh(face0, matrixRotx(-Math.PI / 4)),
face8 = transform_mesh(face0, matrixRoty(Math.PI / 3)),
face9 = transform_mesh(face0, matrixRotz(-Math.PI / 3)),
face10 = transform_mesh(face0, matrixRotx(Math.PI / 5)),
face11 = transform_mesh(face0, matrixRotz(-Math.PI / 5));
S.cube_mesh = 
glue_mesh(face0,
glue_mesh(face1,
glue_mesh(face2,
glue_mesh(face3,
glue_mesh(face4, 
glue_mesh(face5,
glue_mesh(face6,
glue_mesh(face7,
glue_mesh(face8,
glue_mesh(face9,
glue_mesh(face10, face11)))))))))));

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
fragment: `S.setFragmentShader(
define() +
ray() +
sphere() + \`
const int n_sphere = \` + S.n_sphere + \`,
n_light = \` + S.n_light + \`,
n_side = \` + S.n_side + \`,
n_polyhedron = \` + S.n_polyhedron + \`;
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
float focal_length = 3.,
big_radius = .3; \` +
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
ray_polyhedron4() + \`
varying vec3 vPos, vNor;
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
    vec4 n_t_polyhedron = ray_polyhedron(r, u_cube_inverse_matrix);
    if(0. < n_t_polyhedron.w && n_t_polyhedron.w < t_min)
    {
       vec3 ambient = mix(vec3(.1), u_back_color, .3);
       vec3 p = at(r, n_t_polyhedron.w);
       color += ambient + shade_polyhedron(p, n_t_polyhedron.xyz, u_sphere_material[0]);
    }
    vec4 n_t_polyhedron2 = ray_polyhedron2(r, u_cube_inverse_matrix);
    if(0. < n_t_polyhedron2.w && n_t_polyhedron2.w < t_min)
    {
       vec3 ambient = mix(vec3(.1), u_back_color, .3);
       vec3 p = at(r, n_t_polyhedron2.w);
       color += ambient + shade_polyhedron(p, n_t_polyhedron2.xyz, u_sphere_material[1]);
    }
    vec4 n_t_polyhedron3 = ray_polyhedron3(r, u_cube_inverse_matrix);
    if(0. < n_t_polyhedron3.w && n_t_polyhedron3.w < t_min)
    {
       vec3 ambient = mix(vec3(.1), u_back_color, .3);
       vec3 p = at(r, n_t_polyhedron3.w);
       color += ambient + shade_polyhedron(p, n_t_polyhedron3.xyz, u_sphere_material[2]);
    }
    vec4 n_t_polyhedron4 = ray_polyhedron4(r, u_cube_inverse_matrix);
    if(0. < n_t_polyhedron4.w && n_t_polyhedron4.w < t_min)
    {
       vec3 ambient = mix(vec3(.1), u_back_color, .3);
       vec3 p = at(r, n_t_polyhedron4.w);
       color += ambient + shade_polyhedron(p, n_t_polyhedron4.xyz, u_sphere_material[3]);
    }
    else
    {
       vec3 p = vPos + vec3(.1 * u_time, 0, .1 * u_time);
       /* color += object(p.y + pattern(p)) * stripes(p.y + pattern(p)); */
    }
    float c = .2 + .8 * max(0., dot(vNor, vec3(.57)));
    color = sqrt(color) + c;
    gl_FragColor = vec4(color, 1.);
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
m.scale([.2, .2, .2]);
S.draw_mesh(S.torus_mesh, m.get());

m.translate([.9, -3, .3]);
S.draw_mesh(S.sphere_mesh, m.get());

m.identity();
m.translate([-.9, 0, -.3]);
m.rotx(time, 1, 0, 0);
m.roty(time, 0, 1, 0);
m.scale([.1, .2, .3]);
S.draw_mesh(S.cube_mesh, m.get());

let m2 = new Matrix();
m2.identity();
m2.scale([.3, .3, .3]);
S.draw_mesh(S.torus_mesh, m2.get());

let radius = 0, big_radius = .3,
ld0 = normalize([Math.cos(time), Math.sin(time), 1]),
ld1 = normalize([-1, -1, 1]),
ld_data = [];
for(let i = 0; i < 3; ++i)
   ld_data.push(ld0[i]);
for(let i = 0; i < 3; ++i)
   ld_data.push(ld1[i]);
S.setUniform('3fv', 'u_light_direct', ld_data);
S.setUniform('3fv', 'u_light_color', [1, 1, 1, .5, .3, .1]);
S.setUniform('3fv', 'u_diffuse_color', [red.value / 100, green.value / 100, blue.value / 100]);
S.setUniform('1f', 'u_time', time);
for(let i = 0; i < S.n_sphere; ++i)
{
   S.s_velocity[i][0] += .01 * Math.sin(time + i);
   S.s_velocity[i][1] += .01 * Math.cos(time + 2 * i);
   S.s_velocity[i][2] += .01 * Math.cos(time + 3 * i);
   for(let j = 0; j < 3; ++j)
   {
      S.s_velocity[i][j] += .01 * (Math.random() - .5);
      S.s_pos[i][j] += .01 * S.s_velocity[i][j];
      S.s_pos[i][j] *= .8;
   }
   S.s_pos[i] = scale(normalize(S.s_pos[i]), .7);
}
for(let i = 0; i < S.n_sphere; ++i)
   for(let j = 0; j < S.n_sphere; ++j) /* avoid sphere interpenetration */
      if(i != j)
      {
         let d = subtract(S.s_pos[i], S.s_pos[j]),
         r = norm(d);
         if(r < 2 * radius)
         {
            let t = 2 * radius - r;
            for(let k = 0; k < 3; ++k)
            {
               S.s_pos[i][k] += t * d[k] / r;
               S.s_pos[j][k] -= t * d[k] / r;
            }
         }
      }
for(let i = 0; i < S.n_sphere; ++i)
{	
	if(i != S.n_sphere - 1)
	{
		S.setUniform('3f', 'u_sphere[' + i + '].center', .7 * Math.sin(time + .1 * i) + .03 * i, -.8 * Math.cos(time + .1 * i) + .03 * i, .7 * Math.sin(time + i)); /* S.setUniform('3f', 'u_sphere[' + i + '].center', S.s_pos[i][0], S.s_pos[i][1], S.s_pos[i][2]); */
		/* S.setUniform('1f', 'u_sphere[' + i + '].radius', radius + .01 * i); */
	}
	else
	{
		S.setUniform('3f', 'u_sphere[' + i + '].center', 0, 0, 0);
		/* S.setUniform('1f', 'u_sphere[' + i + '].radius', big_radius); */ 
	}
}
S.setUniform('Matrix4fv', 'u_sphere_material', false, S.material.flat());
S.setUniform('3fv', 'u_back_color', [red.value / 1000, green.value / 1000, blue.value / 1000]);
let cube_matrix4 = new matrix4();
/* cube_matrix4.translate(Math.cos(time) / 2, Math.sin(time) / 2, .5); */
cube_matrix4.rotate(10 * time, 1, 0, 0);
cube_matrix4.rotate(10 * time, 0, 1, 0);
cube_matrix4.rotate(10 * time, 0, 0, 1);
cube_matrix4.scale(.3, .3, .1);
cube_matrix4.invert();
S.setUniform('Matrix4fv', 'u_cube_inverse_matrix', false, cube_matrix4.a);
S.setUniform('4fv', 'u_cube', 
[-1,0,0,-1, 1,0,0,-1,
0,-1,0,-1, 0,1,0,-1,
0,0,-1,-1, 0,0,1,-1,]);
/* S.setUniform('4fv', 'u_octahedron',
[-1,-1,-1,-1, 1,1,1,-1,
1,-1,-1,-1, -1,1,1,-1,
-1,1,-1,-1, 1,-1,1,-1,
-1,-1,1,-1, 1,1,-1,-1,]); */

S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);
`,
events: `
   ;
`
};
}