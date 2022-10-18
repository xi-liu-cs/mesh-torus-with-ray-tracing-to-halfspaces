let row = 4, col = 4,
rowcol = row * col;

function id()
{
    return new Float32Array
    ([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
}

function vec3(x, y, z)
{
    this.x = x;
    this.y = y;
    this.z = z;
}

function matrix4(src)
{
    if(src && typeof(src) == 'object' && src.hasOwnProperty('a'))
    {
        this.a = new Float32Array(rowcol);
        for(i = 0; i < rowcol; ++i)
            this.a[i] = src.a[i];
    }
    else
        this.a = id();
}

vec3.prototype.normalize =
function()
{
    x = this.x, y = this.y, z = this.z;
    inorm = 1 / Math.sqrt(x * x + y * y + z * z); /* inverse norm */
    this.x *= inorm, this.y *= inorm, this.z *= inorm;
}

function cross(v1, v2) /* vec3 */
{
    res = new vec3();
    res.x = v1.y * v2.z - v1.z * v2.y;
    res.y = v1.z * v2.x - v1.x * v2.z;
    res.z = v1.x * v2.y - v1.y * v2.x;
    return res;
}

matrix4.prototype.print =
function()
{
    for(let i = 0; i < row; ++i)
        for(let j = 0; j < col; ++j)
            console.log(this.a[i][j]);
}

matrix4.prototype.mul =
function(other)
{
    r1 = row, r2 = row, c1 = col, c2 = col;
    c = new Float32Array(rowcol);
    for(let i = 0; i < r1; ++i)
    {
        for(let j = 0; j < c2; ++j)
        {
            c[i * col + j] = 0;
            for(k = 0; k < r2; ++k)
                c[i * col + j] += this.a[i * col + k] * other.a[k * col + j];
        }
    }
    this.a = c;
    return this;
}

matrix4.prototype.transpose =
function()
{
    let t = new Array(rowcol);
    for(let i = 0; i < row; ++i)
        for(let j = 0; j < col; ++j)
            t[j * col + i] = this.a[i * col + j];
    for(let i = 0; i < rowcol; ++i)
        this.a[i] = t[i];
    return this;
}

function malloc2()
{
    let a = new Array(row);
    for(let i = 0; i < row; ++i)
        a[i] = new Float32Array(col);
    return a;
}

function determinant(matrix, idx) /* float **, int */
{
    let det = 0, z = 1, m = malloc2();
    if(idx == 1)
        return matrix[0][0];
    else
    {
        for(let i = 0; i < idx; ++i)
        {
            let x = 0, y = 0;
            for(let j = 0; j < idx; ++j)
            {
                for(let k = 0; k < idx; ++k)
                {
                    m[j][k] = 0;
                    if(j && i != k)
                    {
                        m[x][y] = matrix[j][k];
                        if(y < idx - 2)
                            ++y;
                        else
                            ++x, y = 0;
                    }
                }
            }
            det = det + z * (matrix[0][i] * determinant(m, idx - 1));
            z = -1 * z;
        }
    }
    return det;
}

function tran(matrix, cof, idx) /* float **, float **, int */
{
    let inv = malloc2(), tr = malloc2();
    for(let i = 0; i < idx; ++i)
        for(let j = 0; j < idx; ++j)
            tr[i][j] = cof[j][i];
    d = determinant(matrix, idx);
    for(let i = 0; i < idx; ++i)
        for(let j = 0; j < idx; ++j)
            inv[i][j] = tr[i][j] / d;
    return inv;
}

function cofactor(matrix, idx) /* float **, int */
{
    let m = malloc2(), cof = malloc2();
    for(let i1 = 0; i1 < idx; ++i1)
    {
        for(let i2 = 0; i2 < idx; ++i2)
        {
            let x = 0, y = 0;
            for(let i3 = 0; i3 < idx; ++i3)
            {
                for(let i4 = 0; i4 < idx; ++i4)
                {
                    if(i1 != i3 && i2 != i4)
                    {
                        m[x][y] = matrix[i3][i4];
                        if(y < idx - 2)
                            ++y;
                        else
                            ++x, y = 0;
                    }
                }
            }
            cof[i1][i2] = Math.pow(-1, i1 + i2) * determinant(m, idx - 1);
        }
    }
    return tran(matrix, cof, idx);
}

function memcpy_1d_to_2d(a)
{
    let res = new Array(row);
    for(let i = 0; i < row; ++i)
    {
        res[i] = new Float32Array(col);
        for(let j = 0; j < col; ++j)
            res[i][j] = a[i * col + j];
    }
    return res;
}

function memcpy_2d_to_1d(a)
{
    let res = new Float32Array(rowcol)
    for(let i = 0; i < row; ++i)
        for(let j = 0; j < col; ++j)
            res[i * col + j] = a[i][j];
    return res;
}

matrix4.prototype.inverse_set =
function(other)
{
  let m1 = this.a, m2 = other.a,
  cof = cofactor(memcpy_1d_to_2d(m2), row),
  inv = memcpy_2d_to_1d(cof),
  det = m2[0] * inv[0] + m2[1] * inv[4] + m2[2] * inv[8] + m2[3] * inv[12];
  if(!det)
    return this;
  det = 1 / det;
  for(let i = 0; i < rowcol; ++i)
    m1[i] = inv[i] * det;
  return this;
}

matrix4.prototype.invert =
function()
{
    return this.inverse_set(this);
};

matrix4.prototype.perspective_set =
function(fovy, aspect, near, far)
{
    let rd, s, ct;
    fovy = Math.PI * fovy / 180 / 2;
    s = Math.sin(fovy);
    rd = 1 / (far - near);
    ct = Math.cos(fovy) / s;
    this.a = new Float32Array
    ([
        ct / aspect, 0, 0, 0,
        0, ct, 0, 0,
        0, 0, -(far + near) * rd, -2 * near * far * rd,
        0, 0, -1, 0,
    ]);
    return this;
};

matrix4.prototype.rotate_set = 
function(angle, x, y, z)
{
    angle = Math.PI * angle / 180;
    c = Math.cos(angle), s = Math.sin(angle);
    if(x && !y && !z)
    {
        if(x < 0)
            s = -s;
        this.a = new Float32Array
        ([
            1, 0, 0, 0,
            0, c, -s, 0,
            0, s, c, 0,
            0, 0, 0, 1,
        ]);
    }
    else if(!x && y && !z)
    {
        if(y < 0)
            s = -s;
        this.a = new Float32Array
        ([
            c, 0, s, 0,
            0, 1, 0, 0,
            -s, 0, c, 0,
            0, 0, 0, 1,
        ]);
    }
    else if(!x && !y && z)
    {
        if(z < 0)
            s = -s;
        this.a = new Float32Array
        ([
            c, -s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }
    else
    {
        len = Math.sqrt(x * x + y * y + z * z);
        if(len != 1)
            x /= len, y /= len, z /= len;
        _c = 1 - c;
        xy = x * y, yz = y * z, zx = z * x;
        xs = x * s, ys = y * s, zs = z * s;
        this.a = new Float32Array
        ([
            _c * x * x + c, _c * xy - zs, _c * zx + ys, 0,
            _c * xy + zs, _c * y * y + c, _c * yz - xs, 0,
            _c * zx - ys, _c * yz + xs, _c * z * z + c, 0,
            0, 0, 0, 1,
        ]);
    }
    return this;
}

matrix4.prototype.rotate =
function(angle, x, y, z)
{
    return this.mul(new matrix4().rotate_set(angle, x, y, z));
}

matrix4.prototype.scale_set =
function(x, y, z)
{
    this.a = new Float32Array
    ([
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1,
    ]);
    return this;
};

matrix4.prototype.scale =
function(x, y, z)
{
    let a = this.a;
    b = [x, y, z];
    for(let i = 0; i < row - 1; ++i)
        for(let j = 0; j < col; ++j)
            a[i * col + j] *= b[i];
    return this;
};

matrix4.prototype.translate_set =
function(x, y, z)
{
    this.a = new Float32Array
    ([
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1, 
    ]);
    return this;
}

matrix4.prototype.translate =
function(x, y, z)
{
    a = this.a;
    b = [x, y, z];
    for(let i = 0; i < row; ++i)
        for(let j = 0; j < col - 1; ++j)
            a[(i + 1) * col - 1] += a[i * col + j] * b[j];
    return this;
}

matrix4.prototype.look_at_set =
function(eye, center, up) /* vec3 */
{
    d = new vec3(eye.x - center.x, eye.y - center.y, eye.z - center.z); /* direction */
    d.normalize();
    r = cross(new vec3(-d.x, -d.y, -d.z), up); /* right */
    r.normalize();
    u = cross(d, r); /* up */
    this.a = new Float32Array
    ([
        r.x, r.y, r.z, 0,
        u.x, u.y, u.z, 0,
        d.x, d.y, d.z, 0,
        0, 0, 0, 1,
    ]);
    return this.translate(-eye.x, -eye.y, -eye.z);
}

matrix4.prototype.look_at =
function(eye, center, up) /* vec3 */
{
    this.mul(new matrix4().look_at_set(eye, center, up));
}

function dot(a, b)
{
   let n = a.length,
   res = 0;
   for(let i = 0; i < n; ++i)
      res += a[i] * b[i]
   return res;
}

function norm(v)
{
    return Math.sqrt(dot(v, v));
}

function normalize(v)
{
   let n = v.length,
   s = norm(v),
   res = [];
   for(let i = 0; i < n; ++i)
      res.push(v[i] / s);
   return res;
}

function scale(v, num)
{
   let n = v.length,
   res = [];
   for(let i = 0; i < n; ++i)
      res.push(num * v[i]);
   return res;
}

function add(a, b)
{
   let n = a.length,
   res = [];
   for(let i = 0; i < n; ++i)
      res.push(a[i] + b[i]);
   return res;
}

function subtract(a, b)
{
   let n = a.length,
   res = [];
   for(let i = 0; i < n; ++i)
      res.push(a[i] - b[i]);
   return res;
}


matrix4.prototype.transform =
function(p) /* vec4 point */
{
    if(!p[3]) p[3] = 1;
    let a = new Float32Array(row);
    for(let i = 0; i < row; ++i)
    {
        a[i] = 0;
        for(let j = 0; j < p.length; ++j)
            a[i] += this.a[i * col + j] * p[j]; 
    }
    return a;
}