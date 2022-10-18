rooms.raytrace = function()
{
lib3d0();
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
`,
fragment: `S.setFragmentShader(fragment());`,
vertex: `S.setVertexShader(vertex());`,
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