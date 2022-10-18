rooms.raytrace = function()
{
lib3d();
description =
`raytracing to spheres<br>in a fragment shader
<small>
   <p>
   <b>background color</b>
   <br><input type = range id = red   value = 5>red
   <br><input type = range id = green value = 10>green
   <br><input type = range id = blue  value = 50>blue
</small>`;
code = {
'init':`
S.n_sphere = 15;
S.radius = .05;
S.n_light = 2;
S.n_side = 6;
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
`,
fragment: `
S.setFragmentShader(
ray() +
sphere() + \`
const int n_sphere = \` + S.n_sphere + \`,
n_light = \` + S.n_light + \`,
n_side = \` + S.n_side + \`;
uniform float u_time;
uniform vec3 u_back_color;
uniform sphere u_sphere[n_sphere];
uniform mat4 u_sphere_material[n_sphere];
uniform mat4 u_cube_inverse_matrix;
uniform vec4 u_cube[6];
uniform vec4 u_octahedron[8];
uniform vec3 u_light_direct[n_light];
uniform vec3 u_light_color[n_light];
varying vec3 vPos;
float focal_length = 3.,
big_radius = .3; \` +
noise() +
ray_sphere() +
shade_sphere() +
ray_halfspace() +
ray_cube() +
ray_octahedron() + \`
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
      color += object(p.y + pattern(p)) * stripes(p.y + pattern(p));
   }
   gl_FragColor = vec4(sqrt(color), 1.);
}
\`);
`,
vertex: `S.setVertexShader(vertex())`,
render: `
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
		S.setUniform('1f', 'u_sphere[' + i + '].radius', radius + .01 * i);
	}
	else
	{
		S.setUniform('3f', 'u_sphere[' + i + '].center', 0, 0, 0);
		S.setUniform('1f', 'u_sphere[' + i + '].radius', big_radius);
	}
}
S.setUniform('Matrix4fv', 'u_sphere_material', false, S.material.flat());
S.setUniform('3fv', 'u_back_color', [red.value / 1000, green.value / 1000, blue.value / 1000]);
let cube_matrix4 = new matrix4();
cube_matrix4.translate(Math.cos(time) / 2, Math.sin(time) / 2, .5);
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
S.setUniform('4fv', 'u_octahedron',
[-1,-1,-1,-1, 1,1,1,-1,
1,-1,-1,-1, -1,1,1,-1,
-1,1,-1,-1, 1,-1,1,-1,
-1,-1,1,-1, 1,1,-1,-1,]);
S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);
`,
events: `
   ;
`
};
}