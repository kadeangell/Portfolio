import{_ as e,b as t,g as n,v as r,x as i,y as a}from"./index-BjERl95S.js";var o=i(t(),1),s=n();function c(e){let t=new Map,n=null;for(let r of e.split(`
`)){let e=r.trim();if(e.startsWith(`newmtl `))n=e.slice(7).trim();else if(n&&e.startsWith(`Kd `)){let[r,i,a]=e.slice(3).trim().split(/\s+/).map(Number);t.set(n,[r*255,i*255,a*255])}}return t}function l(e,t){let n=c(t),r=[],i=[],a=[200,200,200],o=0;for(let t of e.split(`
`)){let e=t.trim();if(e.startsWith(`v `)){let[t,n,i]=e.slice(2).trim().split(/\s+/).map(Number);r.push([t,n,i])}else if(e.startsWith(`usemtl `))a=n.get(e.slice(7).trim())??a;else if(e.startsWith(`f `)){let t=e.slice(2).trim().split(/\s+/).map(e=>{let t=parseInt(e.split(`/`)[0],10);return t<0?r.length+t:t-1});o++;for(let e=1;e<t.length-1;e++)i.push({a:r[t[0]],b:r[t[e]],c:r[t[e+1]],color:a})}}return{triangles:i,vertexCount:r.length,faceCount:o}}var u=[{id:`triangle`,name:`Triangle`,tagline:`The simplest solid`,description:`Three corners were never enough, so this one has four. A regular tetrahedron, every face an equilateral triangle, every face a different color.`,model:l(`# triangle
mtllib triangle.mtl
o triangle
v 1.00000 1.00000 1.00000
v 1.00000 -1.00000 -1.00000
v -1.00000 1.00000 -1.00000
v -1.00000 -1.00000 1.00000
usemtl coral
f 1 2 3
usemtl amber
f 1 4 2
usemtl teal
f 1 3 4
usemtl violet
f 2 4 3
`,`newmtl coral
Kd 1.000 0.420 0.420

newmtl amber
Kd 1.000 0.820 0.400

newmtl teal
Kd 0.180 0.769 0.714

newmtl violet
Kd 0.655 0.545 0.980

`)},{id:`circle`,name:`Circle`,tagline:`Round, mostly`,description:`A circle that gave up on being flat. Approximated by 440 triangles and a firm belief that squinting helps. Painted in latitude bands.`,model:l(`# circle
mtllib circle.mtl
o circle
v 0.00000 1.00000 0.00000
v 0.25882 0.96593 0.00000
v 0.24615 0.96593 0.07998
v 0.20939 0.96593 0.15213
v 0.15213 0.96593 0.20939
v 0.07998 0.96593 0.24615
v 0.00000 0.96593 0.25882
v -0.07998 0.96593 0.24615
v -0.15213 0.96593 0.20939
v -0.20939 0.96593 0.15213
v -0.24615 0.96593 0.07998
v -0.25882 0.96593 0.00000
v -0.24615 0.96593 -0.07998
v -0.20939 0.96593 -0.15213
v -0.15213 0.96593 -0.20939
v -0.07998 0.96593 -0.24615
v -0.00000 0.96593 -0.25882
v 0.07998 0.96593 -0.24615
v 0.15213 0.96593 -0.20939
v 0.20939 0.96593 -0.15213
v 0.24615 0.96593 -0.07998
v 0.50000 0.86603 0.00000
v 0.47553 0.86603 0.15451
v 0.40451 0.86603 0.29389
v 0.29389 0.86603 0.40451
v 0.15451 0.86603 0.47553
v 0.00000 0.86603 0.50000
v -0.15451 0.86603 0.47553
v -0.29389 0.86603 0.40451
v -0.40451 0.86603 0.29389
v -0.47553 0.86603 0.15451
v -0.50000 0.86603 0.00000
v -0.47553 0.86603 -0.15451
v -0.40451 0.86603 -0.29389
v -0.29389 0.86603 -0.40451
v -0.15451 0.86603 -0.47553
v -0.00000 0.86603 -0.50000
v 0.15451 0.86603 -0.47553
v 0.29389 0.86603 -0.40451
v 0.40451 0.86603 -0.29389
v 0.47553 0.86603 -0.15451
v 0.70711 0.70711 0.00000
v 0.67250 0.70711 0.21851
v 0.57206 0.70711 0.41563
v 0.41563 0.70711 0.57206
v 0.21851 0.70711 0.67250
v 0.00000 0.70711 0.70711
v -0.21851 0.70711 0.67250
v -0.41563 0.70711 0.57206
v -0.57206 0.70711 0.41563
v -0.67250 0.70711 0.21851
v -0.70711 0.70711 0.00000
v -0.67250 0.70711 -0.21851
v -0.57206 0.70711 -0.41563
v -0.41563 0.70711 -0.57206
v -0.21851 0.70711 -0.67250
v -0.00000 0.70711 -0.70711
v 0.21851 0.70711 -0.67250
v 0.41563 0.70711 -0.57206
v 0.57206 0.70711 -0.41563
v 0.67250 0.70711 -0.21851
v 0.86603 0.50000 0.00000
v 0.82364 0.50000 0.26762
v 0.70063 0.50000 0.50904
v 0.50904 0.50000 0.70063
v 0.26762 0.50000 0.82364
v 0.00000 0.50000 0.86603
v -0.26762 0.50000 0.82364
v -0.50904 0.50000 0.70063
v -0.70063 0.50000 0.50904
v -0.82364 0.50000 0.26762
v -0.86603 0.50000 0.00000
v -0.82364 0.50000 -0.26762
v -0.70063 0.50000 -0.50904
v -0.50904 0.50000 -0.70063
v -0.26762 0.50000 -0.82364
v -0.00000 0.50000 -0.86603
v 0.26762 0.50000 -0.82364
v 0.50904 0.50000 -0.70063
v 0.70063 0.50000 -0.50904
v 0.82364 0.50000 -0.26762
v 0.96593 0.25882 0.00000
v 0.91865 0.25882 0.29849
v 0.78145 0.25882 0.56776
v 0.56776 0.25882 0.78145
v 0.29849 0.25882 0.91865
v 0.00000 0.25882 0.96593
v -0.29849 0.25882 0.91865
v -0.56776 0.25882 0.78145
v -0.78145 0.25882 0.56776
v -0.91865 0.25882 0.29849
v -0.96593 0.25882 0.00000
v -0.91865 0.25882 -0.29849
v -0.78145 0.25882 -0.56776
v -0.56776 0.25882 -0.78145
v -0.29849 0.25882 -0.91865
v -0.00000 0.25882 -0.96593
v 0.29849 0.25882 -0.91865
v 0.56776 0.25882 -0.78145
v 0.78145 0.25882 -0.56776
v 0.91865 0.25882 -0.29849
v 1.00000 0.00000 0.00000
v 0.95106 0.00000 0.30902
v 0.80902 0.00000 0.58779
v 0.58779 0.00000 0.80902
v 0.30902 0.00000 0.95106
v 0.00000 0.00000 1.00000
v -0.30902 0.00000 0.95106
v -0.58779 0.00000 0.80902
v -0.80902 0.00000 0.58779
v -0.95106 0.00000 0.30902
v -1.00000 0.00000 0.00000
v -0.95106 0.00000 -0.30902
v -0.80902 0.00000 -0.58779
v -0.58779 0.00000 -0.80902
v -0.30902 0.00000 -0.95106
v -0.00000 0.00000 -1.00000
v 0.30902 0.00000 -0.95106
v 0.58779 0.00000 -0.80902
v 0.80902 0.00000 -0.58779
v 0.95106 0.00000 -0.30902
v 0.96593 -0.25882 0.00000
v 0.91865 -0.25882 0.29849
v 0.78145 -0.25882 0.56776
v 0.56776 -0.25882 0.78145
v 0.29849 -0.25882 0.91865
v 0.00000 -0.25882 0.96593
v -0.29849 -0.25882 0.91865
v -0.56776 -0.25882 0.78145
v -0.78145 -0.25882 0.56776
v -0.91865 -0.25882 0.29849
v -0.96593 -0.25882 0.00000
v -0.91865 -0.25882 -0.29849
v -0.78145 -0.25882 -0.56776
v -0.56776 -0.25882 -0.78145
v -0.29849 -0.25882 -0.91865
v -0.00000 -0.25882 -0.96593
v 0.29849 -0.25882 -0.91865
v 0.56776 -0.25882 -0.78145
v 0.78145 -0.25882 -0.56776
v 0.91865 -0.25882 -0.29849
v 0.86603 -0.50000 0.00000
v 0.82364 -0.50000 0.26762
v 0.70063 -0.50000 0.50904
v 0.50904 -0.50000 0.70063
v 0.26762 -0.50000 0.82364
v 0.00000 -0.50000 0.86603
v -0.26762 -0.50000 0.82364
v -0.50904 -0.50000 0.70063
v -0.70063 -0.50000 0.50904
v -0.82364 -0.50000 0.26762
v -0.86603 -0.50000 0.00000
v -0.82364 -0.50000 -0.26762
v -0.70063 -0.50000 -0.50904
v -0.50904 -0.50000 -0.70063
v -0.26762 -0.50000 -0.82364
v -0.00000 -0.50000 -0.86603
v 0.26762 -0.50000 -0.82364
v 0.50904 -0.50000 -0.70063
v 0.70063 -0.50000 -0.50904
v 0.82364 -0.50000 -0.26762
v 0.70711 -0.70711 0.00000
v 0.67250 -0.70711 0.21851
v 0.57206 -0.70711 0.41563
v 0.41563 -0.70711 0.57206
v 0.21851 -0.70711 0.67250
v 0.00000 -0.70711 0.70711
v -0.21851 -0.70711 0.67250
v -0.41563 -0.70711 0.57206
v -0.57206 -0.70711 0.41563
v -0.67250 -0.70711 0.21851
v -0.70711 -0.70711 0.00000
v -0.67250 -0.70711 -0.21851
v -0.57206 -0.70711 -0.41563
v -0.41563 -0.70711 -0.57206
v -0.21851 -0.70711 -0.67250
v -0.00000 -0.70711 -0.70711
v 0.21851 -0.70711 -0.67250
v 0.41563 -0.70711 -0.57206
v 0.57206 -0.70711 -0.41563
v 0.67250 -0.70711 -0.21851
v 0.50000 -0.86603 0.00000
v 0.47553 -0.86603 0.15451
v 0.40451 -0.86603 0.29389
v 0.29389 -0.86603 0.40451
v 0.15451 -0.86603 0.47553
v 0.00000 -0.86603 0.50000
v -0.15451 -0.86603 0.47553
v -0.29389 -0.86603 0.40451
v -0.40451 -0.86603 0.29389
v -0.47553 -0.86603 0.15451
v -0.50000 -0.86603 0.00000
v -0.47553 -0.86603 -0.15451
v -0.40451 -0.86603 -0.29389
v -0.29389 -0.86603 -0.40451
v -0.15451 -0.86603 -0.47553
v -0.00000 -0.86603 -0.50000
v 0.15451 -0.86603 -0.47553
v 0.29389 -0.86603 -0.40451
v 0.40451 -0.86603 -0.29389
v 0.47553 -0.86603 -0.15451
v 0.25882 -0.96593 0.00000
v 0.24615 -0.96593 0.07998
v 0.20939 -0.96593 0.15213
v 0.15213 -0.96593 0.20939
v 0.07998 -0.96593 0.24615
v 0.00000 -0.96593 0.25882
v -0.07998 -0.96593 0.24615
v -0.15213 -0.96593 0.20939
v -0.20939 -0.96593 0.15213
v -0.24615 -0.96593 0.07998
v -0.25882 -0.96593 0.00000
v -0.24615 -0.96593 -0.07998
v -0.20939 -0.96593 -0.15213
v -0.15213 -0.96593 -0.20939
v -0.07998 -0.96593 -0.24615
v -0.00000 -0.96593 -0.25882
v 0.07998 -0.96593 -0.24615
v 0.15213 -0.96593 -0.20939
v 0.20939 -0.96593 -0.15213
v 0.24615 -0.96593 -0.07998
v 0.00000 -1.00000 0.00000
usemtl m0
f 1 3 2
f 2 3 22
f 3 23 22
usemtl m1
f 22 23 42
f 23 43 42
f 42 43 62
f 43 63 62
usemtl m2
f 62 63 82
f 63 83 82
f 82 83 102
f 83 103 102
usemtl m3
f 102 103 122
f 103 123 122
f 122 123 142
f 123 143 142
usemtl m4
f 142 143 162
f 143 163 162
f 162 163 182
f 163 183 182
usemtl m5
f 182 183 202
f 183 203 202
f 222 202 203
usemtl m1
f 1 4 3
f 3 4 23
f 4 24 23
usemtl m2
f 23 24 43
f 24 44 43
f 43 44 63
f 44 64 63
usemtl m3
f 63 64 83
f 64 84 83
f 83 84 103
f 84 104 103
usemtl m4
f 103 104 123
f 104 124 123
f 123 124 143
f 124 144 143
usemtl m5
f 143 144 163
f 144 164 163
f 163 164 183
f 164 184 183
usemtl m0
f 183 184 203
f 184 204 203
f 222 203 204
f 1 5 4
f 4 5 24
f 5 25 24
usemtl m1
f 24 25 44
f 25 45 44
f 44 45 64
f 45 65 64
usemtl m2
f 64 65 84
f 65 85 84
f 84 85 104
f 85 105 104
usemtl m3
f 104 105 124
f 105 125 124
f 124 125 144
f 125 145 144
usemtl m4
f 144 145 164
f 145 165 164
f 164 165 184
f 165 185 184
usemtl m5
f 184 185 204
f 185 205 204
f 222 204 205
usemtl m1
f 1 6 5
f 5 6 25
f 6 26 25
usemtl m2
f 25 26 45
f 26 46 45
f 45 46 65
f 46 66 65
usemtl m3
f 65 66 85
f 66 86 85
f 85 86 105
f 86 106 105
usemtl m4
f 105 106 125
f 106 126 125
f 125 126 145
f 126 146 145
usemtl m5
f 145 146 165
f 146 166 165
f 165 166 185
f 166 186 185
usemtl m0
f 185 186 205
f 186 206 205
f 222 205 206
f 1 7 6
f 6 7 26
f 7 27 26
usemtl m1
f 26 27 46
f 27 47 46
f 46 47 66
f 47 67 66
usemtl m2
f 66 67 86
f 67 87 86
f 86 87 106
f 87 107 106
usemtl m3
f 106 107 126
f 107 127 126
f 126 127 146
f 127 147 146
usemtl m4
f 146 147 166
f 147 167 166
f 166 167 186
f 167 187 186
usemtl m5
f 186 187 206
f 187 207 206
f 222 206 207
usemtl m1
f 1 8 7
f 7 8 27
f 8 28 27
usemtl m2
f 27 28 47
f 28 48 47
f 47 48 67
f 48 68 67
usemtl m3
f 67 68 87
f 68 88 87
f 87 88 107
f 88 108 107
usemtl m4
f 107 108 127
f 108 128 127
f 127 128 147
f 128 148 147
usemtl m5
f 147 148 167
f 148 168 167
f 167 168 187
f 168 188 187
usemtl m0
f 187 188 207
f 188 208 207
f 222 207 208
f 1 9 8
f 8 9 28
f 9 29 28
usemtl m1
f 28 29 48
f 29 49 48
f 48 49 68
f 49 69 68
usemtl m2
f 68 69 88
f 69 89 88
f 88 89 108
f 89 109 108
usemtl m3
f 108 109 128
f 109 129 128
f 128 129 148
f 129 149 148
usemtl m4
f 148 149 168
f 149 169 168
f 168 169 188
f 169 189 188
usemtl m5
f 188 189 208
f 189 209 208
f 222 208 209
usemtl m1
f 1 10 9
f 9 10 29
f 10 30 29
usemtl m2
f 29 30 49
f 30 50 49
f 49 50 69
f 50 70 69
usemtl m3
f 69 70 89
f 70 90 89
f 89 90 109
f 90 110 109
usemtl m4
f 109 110 129
f 110 130 129
f 129 130 149
f 130 150 149
usemtl m5
f 149 150 169
f 150 170 169
f 169 170 189
f 170 190 189
usemtl m0
f 189 190 209
f 190 210 209
f 222 209 210
f 1 11 10
f 10 11 30
f 11 31 30
usemtl m1
f 30 31 50
f 31 51 50
f 50 51 70
f 51 71 70
usemtl m2
f 70 71 90
f 71 91 90
f 90 91 110
f 91 111 110
usemtl m3
f 110 111 130
f 111 131 130
f 130 131 150
f 131 151 150
usemtl m4
f 150 151 170
f 151 171 170
f 170 171 190
f 171 191 190
usemtl m5
f 190 191 210
f 191 211 210
f 222 210 211
usemtl m1
f 1 12 11
f 11 12 31
f 12 32 31
usemtl m2
f 31 32 51
f 32 52 51
f 51 52 71
f 52 72 71
usemtl m3
f 71 72 91
f 72 92 91
f 91 92 111
f 92 112 111
usemtl m4
f 111 112 131
f 112 132 131
f 131 132 151
f 132 152 151
usemtl m5
f 151 152 171
f 152 172 171
f 171 172 191
f 172 192 191
usemtl m0
f 191 192 211
f 192 212 211
f 222 211 212
f 1 13 12
f 12 13 32
f 13 33 32
usemtl m1
f 32 33 52
f 33 53 52
f 52 53 72
f 53 73 72
usemtl m2
f 72 73 92
f 73 93 92
f 92 93 112
f 93 113 112
usemtl m3
f 112 113 132
f 113 133 132
f 132 133 152
f 133 153 152
usemtl m4
f 152 153 172
f 153 173 172
f 172 173 192
f 173 193 192
usemtl m5
f 192 193 212
f 193 213 212
f 222 212 213
usemtl m1
f 1 14 13
f 13 14 33
f 14 34 33
usemtl m2
f 33 34 53
f 34 54 53
f 53 54 73
f 54 74 73
usemtl m3
f 73 74 93
f 74 94 93
f 93 94 113
f 94 114 113
usemtl m4
f 113 114 133
f 114 134 133
f 133 134 153
f 134 154 153
usemtl m5
f 153 154 173
f 154 174 173
f 173 174 193
f 174 194 193
usemtl m0
f 193 194 213
f 194 214 213
f 222 213 214
f 1 15 14
f 14 15 34
f 15 35 34
usemtl m1
f 34 35 54
f 35 55 54
f 54 55 74
f 55 75 74
usemtl m2
f 74 75 94
f 75 95 94
f 94 95 114
f 95 115 114
usemtl m3
f 114 115 134
f 115 135 134
f 134 135 154
f 135 155 154
usemtl m4
f 154 155 174
f 155 175 174
f 174 175 194
f 175 195 194
usemtl m5
f 194 195 214
f 195 215 214
f 222 214 215
usemtl m1
f 1 16 15
f 15 16 35
f 16 36 35
usemtl m2
f 35 36 55
f 36 56 55
f 55 56 75
f 56 76 75
usemtl m3
f 75 76 95
f 76 96 95
f 95 96 115
f 96 116 115
usemtl m4
f 115 116 135
f 116 136 135
f 135 136 155
f 136 156 155
usemtl m5
f 155 156 175
f 156 176 175
f 175 176 195
f 176 196 195
usemtl m0
f 195 196 215
f 196 216 215
f 222 215 216
f 1 17 16
f 16 17 36
f 17 37 36
usemtl m1
f 36 37 56
f 37 57 56
f 56 57 76
f 57 77 76
usemtl m2
f 76 77 96
f 77 97 96
f 96 97 116
f 97 117 116
usemtl m3
f 116 117 136
f 117 137 136
f 136 137 156
f 137 157 156
usemtl m4
f 156 157 176
f 157 177 176
f 176 177 196
f 177 197 196
usemtl m5
f 196 197 216
f 197 217 216
f 222 216 217
usemtl m1
f 1 18 17
f 17 18 37
f 18 38 37
usemtl m2
f 37 38 57
f 38 58 57
f 57 58 77
f 58 78 77
usemtl m3
f 77 78 97
f 78 98 97
f 97 98 117
f 98 118 117
usemtl m4
f 117 118 137
f 118 138 137
f 137 138 157
f 138 158 157
usemtl m5
f 157 158 177
f 158 178 177
f 177 178 197
f 178 198 197
usemtl m0
f 197 198 217
f 198 218 217
f 222 217 218
f 1 19 18
f 18 19 38
f 19 39 38
usemtl m1
f 38 39 58
f 39 59 58
f 58 59 78
f 59 79 78
usemtl m2
f 78 79 98
f 79 99 98
f 98 99 118
f 99 119 118
usemtl m3
f 118 119 138
f 119 139 138
f 138 139 158
f 139 159 158
usemtl m4
f 158 159 178
f 159 179 178
f 178 179 198
f 179 199 198
usemtl m5
f 198 199 218
f 199 219 218
f 222 218 219
usemtl m1
f 1 20 19
f 19 20 39
f 20 40 39
usemtl m2
f 39 40 59
f 40 60 59
f 59 60 79
f 60 80 79
usemtl m3
f 79 80 99
f 80 100 99
f 99 100 119
f 100 120 119
usemtl m4
f 119 120 139
f 120 140 139
f 139 140 159
f 140 160 159
usemtl m5
f 159 160 179
f 160 180 179
f 179 180 199
f 180 200 199
usemtl m0
f 199 200 219
f 200 220 219
f 222 219 220
f 1 21 20
f 20 21 40
f 21 41 40
usemtl m1
f 40 41 60
f 41 61 60
f 60 61 80
f 61 81 80
usemtl m2
f 80 81 100
f 81 101 100
f 100 101 120
f 101 121 120
usemtl m3
f 120 121 140
f 121 141 140
f 140 141 160
f 141 161 160
usemtl m4
f 160 161 180
f 161 181 180
f 180 181 200
f 181 201 200
usemtl m5
f 200 201 220
f 201 221 220
f 222 220 221
usemtl m1
f 1 2 21
f 21 2 41
f 2 22 41
usemtl m2
f 41 22 61
f 22 42 61
f 61 42 81
f 42 62 81
usemtl m3
f 81 62 101
f 62 82 101
f 101 82 121
f 82 102 121
usemtl m4
f 121 102 141
f 102 122 141
f 141 122 161
f 122 142 161
usemtl m5
f 161 142 181
f 142 162 181
f 181 162 201
f 162 182 201
usemtl m0
f 201 182 221
f 182 202 221
f 222 221 202
`,`newmtl m0
Kd 1.000 0.349 0.369

newmtl m1
Kd 1.000 0.573 0.298

newmtl m2
Kd 1.000 0.792 0.227

newmtl m3
Kd 0.541 0.788 0.149

newmtl m4
Kd 0.098 0.510 0.769

newmtl m5
Kd 0.416 0.298 0.576

`)},{id:`pentagon`,name:`Pentagon`,tagline:`Five sides, one point`,description:`A pentagonal pyramid with alternating side colors and a grey base to sit on. Sturdy, symmetrical, and slightly smug about it.`,model:l(`# pentagon
mtllib pentagon.mtl
o pentagon
v 0.00000 1.00000 0.00000
v 0.00000 -0.70000 0.00000
v 1.05000 -0.70000 0.00000
v 0.32447 -0.70000 0.99861
v -0.84947 -0.70000 0.61717
v -0.84947 -0.70000 -0.61717
v 0.32447 -0.70000 -0.99861
usemtl sky
f 1 4 3
usemtl base
f 2 3 4
usemtl lime
f 1 5 4
usemtl base
f 2 4 5
usemtl sky
f 1 6 5
usemtl base
f 2 5 6
usemtl lime
f 1 7 6
usemtl base
f 2 6 7
usemtl rose
f 1 3 7
usemtl base
f 2 7 3
`,`newmtl sky
Kd 0.298 0.788 0.941

newmtl lime
Kd 0.710 0.894 0.549

newmtl rose
Kd 0.969 0.145 0.522

newmtl base
Kd 0.420 0.447 0.502

`)}],d=` .:-=+*#%@`,f=2,p=m([-.45,.6,.75]);function m(e){let t=Math.hypot(e[0],e[1],e[2])||1;return[e[0]/t,e[1]/t,e[2]/t]}function h(e,t,n){let r=Math.cos(t),i=Math.sin(t),a=Math.cos(n),o=Math.sin(n),s=e[0]*r+e[2]*i,c=-e[0]*i+e[2]*r;return[s,e[1]*a-c*o,e[1]*o+c*a]}function g(e){let t=0;for(let n of e.triangles)for(let e of[n.a,n.b,n.c])t=Math.max(t,Math.hypot(e[0],e[1],e[2]));return t||1}function _(e,t,n,r,i,a=g(e)){let o=t*n,s=Array(o).fill(` `),c=new Uint32Array(o),l=new Float32Array(o).fill(-1/0),u=Math.min(n/2,t/2/f)*.92/a,_=t/2,v=n/2;for(let a of e.triangles){let e=h(a.a,r,i),o=h(a.b,r,i),g=h(a.c,r,i),y=o[0]-e[0],b=o[1]-e[1],x=o[2]-e[2],S=g[0]-e[0],C=g[1]-e[1],w=g[2]-e[2],T=m([b*w-x*C,x*S-y*w,y*C-b*S]);if(T[2]<=0)continue;let E=.12+.88*Math.max(0,T[0]*p[0]+T[1]*p[1]+T[2]*p[2]),D=d[Math.min(9,Math.floor(E*10))],O=.3+.7*E,k=Math.min(255,Math.round(a.color[0]*O))<<16|Math.min(255,Math.round(a.color[1]*O))<<8|Math.min(255,Math.round(a.color[2]*O)),[A,j,M]=[e,o,g].map(e=>[_+e[0]*u*f,v-e[1]*u,e[2]]),N=Math.max(0,Math.floor(Math.min(A[0],j[0],M[0]))),P=Math.min(t-1,Math.ceil(Math.max(A[0],j[0],M[0]))),F=Math.max(0,Math.floor(Math.min(A[1],j[1],M[1]))),I=Math.min(n-1,Math.ceil(Math.max(A[1],j[1],M[1]))),L=(j[0]-A[0])*(M[1]-A[1])-(M[0]-A[0])*(j[1]-A[1]);if(L!==0)for(let e=F;e<=I;e++)for(let n=N;n<=P;n++){let r=n+.5,i=e+.5,a=((j[0]-r)*(M[1]-i)-(M[0]-r)*(j[1]-i))/L,o=((M[0]-r)*(A[1]-i)-(A[0]-r)*(M[1]-i))/L,u=1-a-o;if(a<0||o<0||u<0)continue;let d=a*A[2]+o*j[2]+u*M[2],f=e*t+n;d>l[f]&&(l[f]=d,s[f]=D,c[f]=k)}}return{cols:t,rows:n,chars:s,colors:c}}function v(e){let{cols:t,rows:n,chars:r,colors:i}=e,a=``;for(let e=0;e<n;e++){let n=``,o=-1;for(let s=0;s<t;s++){let c=e*t+s,l=r[c],u=l===` `?0:i[c];u!==o&&n&&(a+=o===0?n:`<span style="color:#${o.toString(16).padStart(6,`0`)}">${n}</span>`,n=``),o=u,n+=l}a+=o===0?n:`<span style="color:#${o.toString(16).padStart(6,`0`)}">${n}</span>`,a+=`
`}return a}var y=a(),b=.6,x=.012,S=1.3;function C(e){let t=(0,s.c)(8),{model:n}=e,r=(0,o.useRef)(null),i=(0,o.useRef)(null),a=(0,o.useRef)(null),c=(0,o.useRef)(null),l;t[0]===Symbol.for(`react.memo_cache_sentinel`)?(l={yaw:.6,pitch:.35},t[0]=l):l=t[0];let u=(0,o.useRef)(l),d,f;t[1]===n?(d=t[2],f=t[3]):(d=()=>{let e=r.current,t=i.current,o=a.current;if(!e||!t||!o)return;let s=g(n),l=0,d=0,f=0,p=performance.now(),m=()=>{let t=o.getBoundingClientRect();t.width&&t.height&&(l=Math.max(8,Math.floor(e.clientWidth/t.width)),d=Math.max(4,Math.floor(e.clientHeight/t.height)))};m();let h=new ResizeObserver(m);h.observe(e);let y=window.matchMedia(`(prefers-reduced-motion: reduce)`).matches,x=e=>{let r=Math.min(.1,(e-p)/1e3);if(p=e,!c.current&&!y&&(u.current.yaw=u.current.yaw+b*r),l&&d){let{yaw:e,pitch:r}=u.current;t.innerHTML=v(_(n,l,d,e,r,s))}f=requestAnimationFrame(x)};return f=requestAnimationFrame(x),()=>{cancelAnimationFrame(f),h.disconnect()}},f=[n],t[1]=n,t[2]=d,t[3]=f),(0,o.useEffect)(d,f);let p;t[4]===Symbol.for(`react.memo_cache_sentinel`)?(p=e=>{c.current={x:e.clientX,y:e.clientY},e.currentTarget.setPointerCapture(e.pointerId)},t[4]=p):p=t[4];let m=p,h;t[5]===Symbol.for(`react.memo_cache_sentinel`)?(h=e=>{let t=c.current;t&&(u.current.yaw=u.current.yaw+(e.clientX-t.x)*x,u.current.pitch=Math.max(-1.3,Math.min(S,u.current.pitch+(e.clientY-t.y)*x)),c.current={x:e.clientX,y:e.clientY})},t[5]=h):h=t[5];let C=h,w;t[6]===Symbol.for(`react.memo_cache_sentinel`)?(w=()=>{c.current=null},t[6]=w):w=t[6];let T=w,E;return t[7]===Symbol.for(`react.memo_cache_sentinel`)?(E=(0,y.jsxs)(`div`,{ref:r,className:`relative h-full w-full cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing`,onPointerDown:m,onPointerMove:C,onPointerUp:T,onPointerCancel:T,role:`img`,"aria-label":`Rotating 3D model. Drag to rotate.`,children:[(0,y.jsx)(`pre`,{ref:i,className:`m-0 text-sm font-mono leading-[1.2] text-neutral-300`}),(0,y.jsx)(`span`,{ref:a,className:`invisible absolute left-0 top-0 whitespace-pre font-mono text-sm leading-[1.2]`,children:`M`})]}),t[7]=E):E=t[7],E}var w=`#4ade80`,T=22,E=`Use ← → to browse, enter to buy, ctrl+c to exit. Drag the model to spin it.`;function D(e){let t=(0,s.c)(5),{children:n,onClick:r,label:i,className:a,active:o}=e,c=`cursor-pointer px-2 py-0.5 font-mono text-sm outline-none transition-colors hover:bg-[#4ade80] hover:text-black focus-visible:bg-[#4ade80] focus-visible:text-black ${o?`bg-[#4ade80] text-black`:`text-[#4ade80]`} ${a===void 0?``:a}`,l;return t[0]!==n||t[1]!==i||t[2]!==r||t[3]!==c?(l=(0,y.jsx)(`button`,{type:`button`,onClick:r,"aria-label":i,title:i,className:c,children:n}),t[0]=n,t[1]=i,t[2]=r,t[3]=c,t[4]=l):l=t[4],l}function O(e){let t=(0,s.c)(18),{text:n}=e,[r,i]=(0,o.useState)(0),a;t[0]===n.length?a=t[1]:(a=()=>{if(window.matchMedia(`(prefers-reduced-motion: reduce)`).matches){i(n.length);return}let e=performance.now(),t=0,r=a=>{let o=Math.min(n.length,Math.floor((a-e)/T));i(o),o<n.length&&(t=requestAnimationFrame(r))};return t=requestAnimationFrame(r),()=>cancelAnimationFrame(t)},t[0]=n.length,t[1]=a);let c;t[2]===n?c=t[3]:(c=[n],t[2]=n,t[3]=c),(0,o.useEffect)(a,c);let l;t[4]!==r||t[5]!==n?(l=n.slice(0,r),t[4]=r,t[5]=n,t[6]=l):l=t[6];let u;t[7]!==r||t[8]!==n?(u=n.slice(r),t[7]=r,t[8]=n,t[9]=u):u=t[9];let d;t[10]===u?d=t[11]:(d=(0,y.jsx)(`span`,{className:`opacity-0`,children:u}),t[10]=u,t[11]=d);let f;t[12]!==l||t[13]!==d?(f=(0,y.jsxs)(`span`,{"aria-hidden":`true`,children:[l,d]}),t[12]=l,t[13]=d,t[14]=f):f=t[14];let p;return t[15]!==f||t[16]!==n?(p=(0,y.jsx)(`p`,{className:`m-0 text-neutral-300`,"aria-label":n,children:f}),t[15]=f,t[16]=n,t[17]=p):p=t[17],p}function k(e){let t=(0,s.c)(38),{productName:n,choice:r,onChoose:i,onRun:a}=e,c=(0,o.useRef)(null),l,u;t[0]===Symbol.for(`react.memo_cache_sentinel`)?(l=()=>{let e=document.activeElement;return c.current?.focus(),()=>e?.focus?.()},u=[],t[0]=l,t[1]=u):(l=t[0],u=t[1]),(0,o.useEffect)(l,u);let d;t[2]===a?d=t[3]:(d=()=>a(`cancel`),t[2]=a,t[3]=d);let f;t[4]===Symbol.for(`react.memo_cache_sentinel`)?(f={color:w},t[4]=f):f=t[4];let p;t[5]===n?p=t[6]:(p=(0,y.jsxs)(`h2`,{id:`confirm-title`,className:`m-0 text-base font-bold`,style:f,children:[`Purchase the `,n,`?`]}),t[5]=n,t[6]=p);let m;t[7]===Symbol.for(`react.memo_cache_sentinel`)?(m=(0,y.jsx)(`p`,{id:`confirm-body`,className:`mb-4 mt-2 text-neutral-400`,children:`Checkout isn't open yet, so nothing will be charged.`}),t[7]=m):m=t[7];let h;t[8]===i?h=t[9]:(h=()=>i(`confirm`),t[8]=i,t[9]=h);let g;t[10]===a?g=t[11]:(g=()=>a(`confirm`),t[10]=a,t[11]=g);let _=r===`confirm`,v;t[12]!==g||t[13]!==_?(v=(0,y.jsx)(D,{onClick:g,active:_,children:`[ confirm ]`}),t[12]=g,t[13]=_,t[14]=v):v=t[14];let b;t[15]!==v||t[16]!==h?(b=(0,y.jsx)(`span`,{onMouseEnter:h,children:v}),t[15]=v,t[16]=h,t[17]=b):b=t[17];let x;t[18]===i?x=t[19]:(x=()=>i(`cancel`),t[18]=i,t[19]=x);let S;t[20]===a?S=t[21]:(S=()=>a(`cancel`),t[20]=a,t[21]=S);let C=r===`cancel`,T;t[22]!==S||t[23]!==C?(T=(0,y.jsx)(D,{onClick:S,active:C,children:`[ cancel ]`}),t[22]=S,t[23]=C,t[24]=T):T=t[24];let E;t[25]!==x||t[26]!==T?(E=(0,y.jsx)(`span`,{onMouseEnter:x,children:T}),t[25]=x,t[26]=T,t[27]=E):E=t[27];let O;t[28]!==b||t[29]!==E?(O=(0,y.jsxs)(`div`,{className:`flex justify-center gap-4`,children:[b,E]}),t[28]=b,t[29]=E,t[30]=O):O=t[30];let k;t[31]===Symbol.for(`react.memo_cache_sentinel`)?(k=(0,y.jsx)(`p`,{className:`mb-0 mt-3 text-xs text-neutral-600`,children:`← → choose · enter select · esc cancel`}),t[31]=k):k=t[31];let j;t[32]!==O||t[33]!==p?(j=(0,y.jsxs)(`div`,{ref:c,role:`dialog`,"aria-modal":`true`,"aria-labelledby":`confirm-title`,"aria-describedby":`confirm-body`,tabIndex:-1,className:`max-w-sm bg-neutral-900 px-6 py-5 text-center outline-none`,onClick:A,children:[p,m,O,k]}),t[32]=O,t[33]=p,t[34]=j):j=t[34];let M;return t[35]!==j||t[36]!==d?(M=(0,y.jsx)(`div`,{className:`fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-[14vw]`,onClick:d,children:j}),t[35]=j,t[36]=d,t[37]=M):M=t[37],M}function A(e){return e.stopPropagation()}function j(){let t=(0,s.c)(62),n=r(),[i,a]=(0,o.useState)(0),[c,l]=(0,o.useState)(E),[d,f]=(0,o.useState)(!1),[p,m]=(0,o.useState)(`confirm`),h=u[i],g;t[0]===Symbol.for(`react.memo_cache_sentinel`)?(g=e=>{let t=(e+u.length)%u.length;a(t),l(E)},t[0]=g):g=t[0];let _=g,v;t[1]===Symbol.for(`react.memo_cache_sentinel`)?(v=()=>{m(`confirm`),f(!0)},t[1]=v):v=t[1];let b=v,x;t[2]===h.name?x=t[3]:(x=e=>{f(!1),l(e===`confirm`?`No order placed for the ${h.name}: checkout isn't open yet. Nothing was charged.`:`Cancelled. Back to browsing the ${h.name}.`)},t[2]=h.name,t[3]=x);let S=x,T,A;t[4]!==p||t[5]!==d||t[6]!==n||t[7]!==S||t[8]!==i?(T=()=>{let e=e=>{if(e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key.toLowerCase()===`c`){if(window.getSelection()?.toString())return;e.preventDefault(),n({to:`/`})}else e.metaKey||e.ctrlKey||e.altKey||(d?e.key===`Escape`?(e.preventDefault(),S(`cancel`)):e.key===`Enter`?(e.preventDefault(),e.repeat||S(p)):(e.key===`ArrowLeft`||e.key===`ArrowRight`||e.key===`Tab`)&&(e.preventDefault(),m(M)):e.key===`Enter`?(e.preventDefault(),e.repeat||b()):e.key===`ArrowRight`||e.key===`l`?(e.preventDefault(),_(i+1)):(e.key===`ArrowLeft`||e.key===`h`)&&(e.preventDefault(),_(i-1)))};return window.addEventListener(`keydown`,e),()=>window.removeEventListener(`keydown`,e)},A=[i,_,d,p,b,S,n],t[4]=p,t[5]=d,t[6]=n,t[7]=S,t[8]=i,t[9]=T,t[10]=A):(T=t[9],A=t[10]),(0,o.useEffect)(T,A);let j;t[11]===Symbol.for(`react.memo_cache_sentinel`)?(j=(0,y.jsx)(`h1`,{className:`m-0 text-sm font-bold tracking-widest`,style:{color:w},children:`◆ SHAPE SHOP`}),t[11]=j):j=t[11];let N;t[12]===i?N=t[13]:(N=(0,y.jsx)(`div`,{className:`flex items-center`,children:(0,y.jsx)(D,{onClick:()=>_(i-1),label:`Previous item (←)`,className:`py-6 text-lg`,children:`◀`})}),t[12]=i,t[13]=N);let P;t[14]!==h.id||t[15]!==h.model?(P=(0,y.jsx)(`div`,{className:`min-h-0 min-w-0 flex-1`,children:(0,y.jsx)(C,{model:h.model},h.id)}),t[14]=h.id,t[15]=h.model,t[16]=P):P=t[16];let F;t[17]===i?F=t[18]:(F=(0,y.jsx)(`div`,{className:`flex items-center`,children:(0,y.jsx)(D,{onClick:()=>_(i+1),label:`Next item (→)`,className:`py-6 text-lg`,children:`▶`})}),t[17]=i,t[18]=F);let I;t[19]!==N||t[20]!==P||t[21]!==F?(I=(0,y.jsxs)(`div`,{className:`mt-2 flex min-h-0 flex-1 items-stretch gap-2`,children:[N,P,F]}),t[19]=N,t[20]=P,t[21]=F,t[22]=I):I=t[22];let L;t[23]===i?L=t[24]:(L=u.map((e,t)=>(0,y.jsx)(`button`,{type:`button`,onClick:()=>_(t),"aria-label":`Show ${e.name}`,"aria-current":t===i,title:e.name,className:`cursor-pointer px-1.5 py-1 text-base leading-none outline-none transition-colors focus-visible:bg-[#4ade80] focus-visible:text-black ${t===i?`text-[#4ade80]`:`text-neutral-600 hover:text-[#4ade80]`}`,children:t===i?`●`:`○`},e.id)),t[23]=i,t[24]=L);let R;t[25]===L?R=t[26]:(R=(0,y.jsx)(`nav`,{"aria-label":`Items`,className:`mt-2 flex justify-center gap-1`,children:L}),t[25]=L,t[26]=R);let z;t[27]===Symbol.for(`react.memo_cache_sentinel`)?(z={color:w},t[27]=z):z=t[27];let B;t[28]===h.name?B=t[29]:(B=(0,y.jsx)(`h2`,{className:`m-0 text-base font-bold`,style:z,children:h.name}),t[28]=h.name,t[29]=B);let V;t[30]===h.tagline?V=t[31]:(V=(0,y.jsx)(`span`,{className:`text-neutral-500`,children:h.tagline}),t[30]=h.tagline,t[31]=V);let H;t[32]!==B||t[33]!==V?(H=(0,y.jsxs)(`div`,{className:`flex flex-wrap items-baseline justify-center gap-x-3`,children:[B,V]}),t[32]=B,t[33]=V,t[34]=H):H=t[34];let U;t[35]!==h.description||t[36]!==h.id?(U=(0,y.jsx)(`div`,{className:`mx-auto my-1 min-h-[3.6em] max-w-prose`,children:(0,y.jsx)(O,{text:h.description},h.id)}),t[35]=h.description,t[36]=h.id,t[37]=U):U=t[37];let W;t[38]!==h.model.faceCount||t[39]!==h.model.vertexCount?(W=(0,y.jsxs)(`p`,{className:`m-0 text-xs text-neutral-500`,children:[h.model.vertexCount,` vertices · `,h.model.faceCount,` faces · .obj`]}),t[38]=h.model.faceCount,t[39]=h.model.vertexCount,t[40]=W):W=t[40];let G;t[41]===Symbol.for(`react.memo_cache_sentinel`)?(G=(0,y.jsx)(D,{onClick:b,label:`Buy (enter)`,children:`[ buy ]`}),t[41]=G):G=t[41];let K;t[42]===Symbol.for(`react.memo_cache_sentinel`)?(K=(0,y.jsxs)(`div`,{className:`mt-3 flex justify-center gap-4`,children:[G,(0,y.jsx)(e,{to:`/`,className:`no-underline`,"aria-label":`Exit the shop`,children:(0,y.jsx)(`span`,{className:`inline-block cursor-pointer px-2 py-0.5 text-[#4ade80] transition-colors hover:bg-[#4ade80] hover:text-black`,children:`[ exit ]`})})]}),t[42]=K):K=t[42];let q;t[43]!==H||t[44]!==U||t[45]!==W?(q=(0,y.jsxs)(`section`,{className:`mt-3`,children:[H,U,W,K]}),t[43]=H,t[44]=U,t[45]=W,t[46]=q):q=t[46];let J;t[47]===c?J=t[48]:(J=(0,y.jsx)(`footer`,{className:`mt-3 min-h-[1.2em] text-xs text-neutral-500`,"aria-live":`polite`,children:c}),t[47]=c,t[48]=J);let Y;t[49]!==R||t[50]!==q||t[51]!==J||t[52]!==I?(Y=(0,y.jsxs)(`div`,{className:`mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col text-center`,children:[j,I,R,q,J]}),t[49]=R,t[50]=q,t[51]=J,t[52]=I,t[53]=Y):Y=t[53];let X;t[54]!==p||t[55]!==d||t[56]!==h.name||t[57]!==S?(X=d&&(0,y.jsx)(k,{productName:h.name,choice:p,onChoose:m,onRun:S}),t[54]=p,t[55]=d,t[56]=h.name,t[57]=S,t[58]=X):X=t[58];let Z;return t[59]!==Y||t[60]!==X?(Z=(0,y.jsxs)(`div`,{className:`flex h-screen w-screen flex-col bg-black px-[11vw] py-[9vh] font-mono text-sm text-neutral-300`,children:[Y,X]}),t[59]=Y,t[60]=X,t[61]=Z):Z=t[61],Z}function M(e){return e===`confirm`?`cancel`:`confirm`}var N=j;export{N as component};