
rooms.raytrace5 = function() {

    lib3D();
    
    description = `Raytrace to quadrics<br>in a fragment shader
    <small>
        <p>  <input type=range id=red   value= 5> bg red
        <br> <input type=range id=green value=10> bg green
        <br> <input type=range id=blue  value=50> bg blue
        <br> <input type=range id=refract value=50> refract
             <div id=iorInfo>&nbsp;</div>
    </small>
    `;
    
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
       // DEFINE phongS TO BE RENDERED VIA PHONG REFLECTANCE MODEL
    
       S.redPlastic    = [.2,.1,.1,0,  .5,.2,.2,0,  2,2,2,20,  0,0,0,0];
       S.greenPlastic  = [.1,.2,.1,0,  .2,.5,.2,0,  2,2,2,20,  0,0,0,0];
       S.bluePlastic   = [.1,.1,.2,0,  .2,.2,.5,0,  2,2,2,20,  0,0,0,0];
       S.whitePlastic  = [.2,.2,.2,0,  .5,.5,.5,0,  2,2,2,20,  0,0,0,0];
    `,
    
    fragment: `
    S.setFragmentShader(
    ray() +
    sphere() + \`
       // DECLARE CONSTANTS, UNIFORMS, VARYING VARIABLES
    
       const int n_q = \` + S.n_q + \`;
       const int n_light = \` + S.n_light + \`;
       uniform vec3 u_back_color;
       uniform vec3 u_light_direct[n_light];
       uniform vec3 u_light_color[n_light];
       uniform mat4 u_quadric[n_q];
       uniform mat4 u_phong[n_q];
       uniform int u_shape[n_q];
       uniform float u_index_refract;
       varying vec3 vPos;
       float focal_length = 3.;
    
    /********* PSEUDO-CODE IMPLEMENTATION OF FRAGMENT SHADER **********
    
    Compute surface normal: P, Q => N
    
       vec3 normalQ(vec3 P, mat4 Q)
    
          Just like in the course notes.
    
    Trace a ray to a quadric: V, W, Q => [ tIn, tOut ]
    
       vec2 rayQ(vec3 V, vec3 W, mat4 Q)
    
          Just like in the course notes:
    
             First add homogeneous coordinates:
    
                V1 = vec4(V,1)
                W0 = vec4(W,0)
    
             Then compute quadratic equation:
    
                a: W0 . Q*W0
                b: V1 . Q*W0 + W0 . Q*V1
                c: V1 . Q*V1
    
             Then solve quadratic equation.
    
             Return both roots as a vec2
    
    Trace a ray to an intersection of quadric surfaces:
    
       Q1: T=[n,tIn,tOut], n, t.xy => T
       
          tIn  = t.x
          tOut = t.y
          if tIn > 0 and tIn < tOut and tIn < T.y
             T = [n,t]
          return T
       
       Q2: T=[n,tIn,tOut], n, t0.xy, t1.xy => T
       
          tIn  = max(t0.x,t1.x)
          tOut = min(t0.y,t1.y)
          if tIn > 0 and tIn < tOut and tIn < T.y
             i = t0.x==tIn ? 0 : 1
             T = [n+i,t]
          return T
       
       Q3: T=[n,tIn,tOut], n, t0.xy, t1.xy, t2.xy => T
       
          tIn  = max(t0.x,t1.x,t2.x)
          tOut = min(t0.y,t1.y,t2.y)
          if tIn > 0 and tIn < tOut and tIn < T.y
             i = t0.x==tIn ? 0 : t1.x==tIn ? 1 : 2
             T = [n+i,t]
          return T
       
       Q4: T=[n,tIn,tOut], n, t0.xy, t1.xy, t2.xy, t3.xy => T
       
          tIn  = max(t0.x,t1.x,t2.x,t3.x)
          tOut = min(t0.y,t1.y,t2.y,t3.y)
          if tIn > 0 and tIn < tOut and tIn < T.y
             i = t0.x==tIn ? 0 : t1.x==tIn ? 1 : t2.x==tIn ? 2 : 3
             T = [n+i,t]
          return T
       
    Trace a ray to the scene:
    
       vec3 rayScene(vec3 V, vec3 W):
    
          T = [-1,1000,0]
          loop though all quadrics n
             if shape_type == 1: T = Q1(T, n, ray to Q[n])
             if shape_type == 2: T = Q2(T, n, ray to Q[n], Q[n+1])
             if shape_type == 3: T = Q3(T, n, ray to Q[n], Q[n+1], Q[n+2])
             if shape_type == 4: T = Q4(T, n, ray to Q[n], Q[n+1], Q[n+2], Q[n+3])
          return T
    
    A note on using array subscripts that you computed within a function:
    
       Array subscripts need to be constant. So if you compute an array subscript
       within a function, then you need to make use of the resulting int value
       in the proper way, as follows:
    
       WRONG:
    
          vec3 T = rayScene(V, W);
          int n = int(T.x);
          mat4 Q = u_quadric[n];                 // This line produces a compiler error.
          ...
    
       CORRECT:
    
          vec3 T = rayScene(V, W);
          for (int n = 0 ; n < n_q ; n++)
             if (n == int(T.x)) {
                mat4 Q = u_quadric[n];          // This line works, because n is constant.
                ...
             }
    
    Shade surface: P, N, phong => color
    
       vec3 shadeSurface(vec3 P, vec3 N, mat4 phong)
    
          The same algorithm you use when shading a sphere.
    
    Refract ray: W, N, index_of_refraction => W
    
       vec3 refractRay(vec3 W, vec3 N, float n)
    
          Just like in the course notes.
    
    Main loop
    
       T=[n,tIn,tOut] = rayScene(T, V, W)
       
       n = int(T.x) // REMEMBER, YOU NEED TO MAKE A LOOP HERE, AS SHOWN ABOVE.
    
       if n >= 0:
    
          Compute surface point P = V + T.y * W
    
          Shade with Phong, using:
    
             N = normalQ(P, Q[n])
    
          Do reflection:
    
             compute R
    
             T=[n,tIn,tOut] = rayScene ( P , R )
    
             n = int(T.x)
    
             if n >= 0:
    
                M = P + T.y * W        // POINT ON SURFACE OF OTHER OBJECT
    
                   because T.y is tIn
    
                color += shadeSurface(M, normalQ(M,Q[n]), phong[n]) / 2.
    
          Do refraction:
    
             (1) SHOOT RAY TO FIND REAR OF THIS OBJECT (USE 2nd ROOT):
    
             W = refractRay(W, N, index_of_refraction)
    
             T=[n,tIn,tOut] = rayScene ( P-.01*W , W )
    
             n = int(T.x)
    
             P = P + T.z * W            // FIND POINT AT REAR OF OBJECT
    
                because T.z is tOut
    
             N = normalQ(P, Q[n])
    
             (2) SHOOT RAY FROM REAR OF THIS OBJECT TO FIND ANOTHER OBJECT:
    
             W = refract ray (W, N, 1 / index_of_refraction)
    
             T=[n,tIn,tOut] = rayScene( P , W )
    
             n = int(T.x)
    
             if n >= 0:
    
                M = P + T.y * W        // POINT ON SURFACE OF OTHER OBJECT
    
                   because T.y is tIn
    
                color += diffuse_color_of_this_object *
                         shadeSurface(M, normalQ(M,Q[n]), phong[n])
    
    ******************************************************************/
    
    vec3 normal_quadric(vec3 p, mat4 q)
    {
       float fx = 2. * q[0][0] * p.x + (q[0][1] + q[1][0]) * p.y + (q[0][2] + q[2][0]) * p.z + q[0][3] + q[3][0],
       fy = (q[0][1] + q[1][0]) * p.x + 2. * q[1][1] * p.y + (q[1][2] + q[2][1]) * p.z + q[1][3] + q[3][1],
       fz = (q[0][2] + q[2][0]) * p.x + (q[1][2] + q[2][1]) * p.y + p.z + 2. * q[2][2] + q[2][3] * q[3][2];
       return normalize(vec3(fx, fy, fz)); 
    }
    
    vec2 ray_quadric(vec3 v, vec3 w, mat4 q)
    {
       vec4 v1 = vec4(v, 1.),
       w0 = vec4(w, 0.);
       float a = dot(w0, q * w0),
       b = dot(v1, q * w0) + dot(w0, q * v1),
       c = dot(v1, q * v1),
       sqrt_disc = sqrt(b * b - 4. * a * c);
       return vec2((-b - sqrt_disc) / (2. * a),  (-b + sqrt_disc) / (2. * a));
    }
    
    vec3 quadric1(vec3 T, float n, vec2 t)
    {
       float t_in = t.x,
       t_out = t.y;
       if(t_in > 0. && t_in < t_out && t_in < T.y)
          T = vec3(n, t_in, t_out);
       return T;
    }
    
    vec3 quadric2(vec3 T, float n, vec2 t0, vec2 t1)
    {
       float t_in  = max(t0.x, t1.x),
       t_out = min(t0.y, t1.y);
       if(t_in > 0. && t_in < t_out && t_in < T.y)
       {
          float i = t0.x == t_in ? 0. : 1.;
          T = vec3(n + i, t_in, t_out);
       }
       return T;
    }
    
    vec3 quadric3(vec3 T, float n, vec2 t0, vec2 t1, vec2 t2)
    {
       float t_in = max(max(t0.x, t1.x), t2.x),
       t_out = min(min(t0.y, t1.y), t2.y);
       if(t_in > 0. && t_in < t_out && t_in < T.y)
       {
          float i = t0.x == t_in ? 0. : t1.x == t_in ? 1. : 2.;
          T = vec3(n + i, t_in, t_out);
       }
       return T;
    }
    
    vec3 quadric4(vec3 T, float n, vec2 t0, vec2 t1, vec2 t2, vec2 t3)
    {
       float t_in = max(max(max(t0.x, t1.x), t2.x), t3.x),
       t_out = min(min(min(t0.y, t1.y), t2.y), t3.y);
       if(t_in > 0. && t_in < t_out && t_in < T.y)
       {
          float i = t0.x == t_in ? 0. : t1.x == t_in ? 1. : t2.x == t_in ? 2. : 3.;
          T = vec3(n + i, t_in, t_out);
       }
       return T;
    }
    
    vec3 ray_scene(vec3 v, vec3 w)
    {
       vec3 T = vec3(-1., 1000., 0.);
       for(int i = 0; i < n_q; ++i)
       {
          int shape = u_shape[i];
          if(shape == 1)
             T = quadric1(T, float(i), ray_quadric(v, w, u_quadric[i]));
          else if(shape == 2)
             T = quadric2(T, float(i), ray_quadric(v, w, u_quadric[i]), ray_quadric(v, w, u_quadric[i + 1]));
          else if(shape == 3)
             T = quadric3(T, float(i), ray_quadric(v, w, u_quadric[i]), ray_quadric(v, w, u_quadric[i + 1]), ray_quadric(v, w, u_quadric[i + 2]));
          else if(shape == 4)
             T = quadric4(T, float(i), ray_quadric(v, w, u_quadric[i]), ray_quadric(v, w, u_quadric[i + 1]), ray_quadric(v, w, u_quadric[i + 2]), ray_quadric(v, w, u_quadric[i + 3]));
       }
       return T;
    }
    
    vec3 shade_surface(vec3 point, vec3 normal, mat4 q, mat4 material)
    {
       vec3 ambient = material[0].rgb,
       diffuse = material[1].rgb,
       specular = material[2].rgb;
       float power = material[2].a;
       vec3 c = mix(ambient, u_back_color, .1),
       eye = vec3(0., 0., 1.);
       for(int i = 0; i < n_light; ++i)
       {
          float t = -1.;
          for(int j = 0; j < n_q; ++j)
              t = max(t, ray_quadric(point, u_light_direct[i], q).x);
          if(t < 0.)
          {
             vec3 reflect = 2. * dot(normal, u_light_direct[i]) * normal - u_light_direct[i];
             c += u_light_color[i] * (diffuse * max(0., dot(normal, u_light_direct[i]))
             + specular * pow(max(0., dot(reflect, eye)), power));
          }
       }
       /* c += pattern(n); *//* c *= 1. + .5 * noise(3. * n); */
       return c;
    }
    
    void main()
    {
       vec3 c = u_back_color,
       v = vec3(0., 0., focal_length * 1.),
       w = normalize(vec3(vPos.xy, -focal_length * 1.));
       vec3 T = ray_scene(v, w);
       mat4 q, phong;
       for(int i = 0; i < n_q; ++i)
       {
          if(i == int(T.x))
          {
             q = u_quadric[i];
             vec3 p = v + T.y * w,
             n = normal_quadric(p, q);
             c += shade_surface(p, n, q, u_phong[i]);
          }
       }
       gl_FragColor = vec4(sqrt(c), 1.);
    }
    \`);
    `,
    vertex: `
    S.setVertexShader(\`
    
       attribute vec3 aPos;
       varying   vec3 vPos;
    
       void main() {
          vPos = aPos;
          gl_Position = vec4(aPos, 1.);
       }
    
    \`)
    
    `,
    render: `
    
       // USEFUL VECTOR FUNCTIONS
    
       let add = (a,b) => [ a[0]+b[0], a[1]+b[1], a[2]+b[2] ];
       let dot = (a,b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
       let norm = v => Math.sqrt(dot(v,v));
       let normalize = v => { let s = norm(v); return [ v[0]/s, v[1]/s, v[2]/s ]; }
       let scale = (v,s) => [ s * v[0], s * v[1], s * v[2] ];
       let subtract = (a,b) => [ a[0]-b[0], a[1]-b[1], a[2]-b[2] ];
    
       // SEND LIGHT SOURCE DATA TO GPU
    
       let ldData = [ normalize([1,1,1]),
                      normalize([-1,-1,-1]) ];
       S.setUniform('3fv', 'u_light_direct', ldData.flat());
       S.setUniform('3fv', 'u_light_color', [ 1,1,1, .5,.3,.1 ]);
    
       // DEFINE NUMBER OF LIGHTS FOR GPU
    
       S.n_light = ldData.length;
    
       // SEND BACKGROUND COLOR TO GPU
    
       S.setUniform('3fv', 'u_back_color', [ red.value   / 100,
                                         green.value / 100,
                                         blue.value  / 100 ]);
    
       // SEND INDEX OF REFRACTION TO GPU
    
       let ior = refract.value / 100 + 1;
       S.setUniform('1f', 'u_index_refract', ior);
    
       // DIFFERENT QUADRIC SURFACES
    
    //                xx        yy         zz           c
    
       let qSlabX  = [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,-1]; // x*x - 1 <= 0
       let qSlabY  = [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,-1]; // y*y - 1 <= 0
       let qSlabZ  = [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,-1]; // z*z - 1 <= 0
       let qSphere = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,-1]; // x*x + y*y + z*z - 1 <= 0
       let qTubeX  = [0,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,-1]; // y*y + z*z - 1 <= 0
       let qTubeY  = [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,-1]; // x*x + z*z - 1 <= 0
       let qTubeZ  = [1,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,-1]; // x*x + y*y - 1 <= 0
    
       // SHAPES ARE INTERSECTIONS OF QUADRIC SURFACES
    
       let shape = [], coefs = [], xform = [], phong = [], M;
    
       let sphere = (m, M) => {
          shape.push(1);
          phong.push(m);
          xform.push(M);
          coefs.push(qSphere);
       }
    
       let tubeX = (m, M) => {
          shape.push(2, 0);
          phong.push(m, m);
          xform.push(M, M);
          coefs.push(qTubeX, qSlabX);
       }
    
       let tubeY = (m, M) => {
          shape.push(2, 0);
          phong.push(m, m);
          xform.push(M, M);
          coefs.push(qTubeY, qSlabY);
       }
    
       let tubeZ = (m, M) => {
          shape.push(2, 0);
          phong.push(m, m);
          xform.push(M, M);
          coefs.push(qTubeZ, qSlabZ);
       }
    
       let cube = (m, M) => {
          shape.push(3, 0, 0);
          phong.push(m, m, m);
          xform.push(M, M, M);
          coefs.push(qSlabX, qSlabY, qSlabZ);
       }
    
       let octahedron = (m, M) => {
          shape.push(4, 0, 0, 0);
          phong.push(m, m, m, m);
          xform.push(M, M, M, M);
          coefs.push([1, 2, 2, 0,  0, 1, 2, 0,  0,0,1,0,  0,0,0,-1]);
          coefs.push([1,-2,-2, 0,  0, 1, 2, 0,  0,0,1,0,  0,0,0,-1]);
          coefs.push([1,-2, 2, 0,  0, 1,-2, 0,  0,0,1,0,  0,0,0,-1]);
          coefs.push([1, 2,-2, 0,  0, 1,-2, 0,  0,0,1,0,  0,0,0,-1]);
       }
    
       // CREATE THE SCENE
    
       tubeY(S.redPlastic,
             mScale(.2,.03,.2,
             mRoty(time * 1.1,
             mRotz(time * 1.2,
             mRotx(time * 1.3,
             matrixTranslate(-Math.sin(time)*.5,0,Math.cos(time)*.5+.5))))));
    
      octahedron(S.greenPlastic,
           mScale(.18,.18,.18,
           mRoty(time * 1.2,
           mRotz(time * 1.3,
           mRotx(time * 1.1,
           matrixTranslate(0,-Math.cos(time)*.4,Math.sin(time)*.4+.5))))));
    
       cube(S.whitePlastic,
           mScale(.18,.03,.12,
           mRoty(time * 1.2,
           mRotz(time * 1.1,
           mRotx(time * 1.3,
           matrixTranslate(0,Math.cos(time)*.2,.5))))));
    
       sphere(S.bluePlastic,
              mScale(.2,.15,.18,
              mRoty(time * 1.3,
              mRotz(time * 1.1,
              mRotx(time * 1.2,
              matrixTranslate(Math.sin(time)*.5,0,-Math.cos(time)*.5+.5))))));
    
       // SEND SCENE DATA TO GPU
    
       for (let n = 0 ; n < coefs.length ; n++) {
          let IM = matrixInverse(xform[n]);
          coefs[n] = matrixMultiply(matrixTranspose(IM), matrixMultiply(coefs[n], IM));
       }
       S.setUniform('1iv', 'u_shape', shape);
       S.setUniform('Matrix4fv', 'u_quadric', false, coefs.flat());
       S.setUniform('Matrix4fv', 'u_phong', false, phong.flat());
    
       // DEFINE NUMBER OF QUADRIC SURFACES FOR GPU
    
       S.n_q = coefs.length;
    
       // RENDER THIS ANIMATION FRAME
    
       S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);
    
       // SET ANY HTML INFO
    
       iorInfo.innerHTML = 'index of refraction = ' + (ior * 100 >> 0) / 100;
    `,
    events: `
       ;
    `
    };
    
    }    