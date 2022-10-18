function make_polyhedron_array(comb_len, polyhedron_array, combine_array)
{
   for(let i = 0; i < combine_array.length; ++i)
   {
      let a = new Array(comb_len + 1).fill(-1 / i - 0.5);
      for(let j = 0; j < combine_array[i].length; ++j)
         if(i % 3)
            a[combine_array[i][j] - 1] = 0;
         else
            a[combine_array[i][j] - 1] = 10 / i;
      merge_array(polyhedron_array, a);
   }
}

function make_polyhedron_array2(comb_len, polyhedron_array, combine_array)
{
   for(let i = 0; i < combine_array.length; ++i)
   {
      let a = new Array(comb_len + 1).fill(-1 / i - 0.6);
      for(let j = 0; j < combine_array[i].length; ++j)
         if(i < combine_array.length / 2)
            a[combine_array[i][j] - 1] = 0;
         else
            a[combine_array[i][j] - 1] = 1 - i;
      merge_array(polyhedron_array, a);
   }
}

function make_polyhedron_array3(comb_len, polyhedron_array, combine_array)
{
   for(let i = 0; i < combine_array.length; ++i)
   {
      let a = new Array(comb_len + 1).fill(-1 / i - 0.7);
      for(let j = 0; j < combine_array[i].length; ++j)
         if(i % 5)
            a[combine_array[i][j] - 1] = 1 / i + 1;
         else if(i % 4)
            a[combine_array[i][j] - 1] = 2 / i + 1;
         else if(i % 3)
            a[combine_array[i][j] - 1] = 3 / i + 1;
         else
            a[combine_array[i][j] - 1] = 0;
      merge_array(polyhedron_array, a);
   }
}

function make_polyhedron_array4(comb_len, polyhedron_array, combine_array)
{
   for(let i = 0; i < combine_array.length; ++i)
   {
      let a = new Array(comb_len + 1).fill(-1 / i - 0.8);
      for(let j = 0; j < combine_array[i].length; ++j)
         if(i % 3)
            a[combine_array[i][j] - 1] = 1 / i + i;
         else if(i < combine_array.length / 2)
            a[combine_array[i][j] - 1] = 2 / i + i;
         else if(i % 2)
            a[combine_array[i][j] - 1] = 3 / i + i;
         else
            a[combine_array[i][j] - 1] = 0;
      merge_array(polyhedron_array, a);
   }
}