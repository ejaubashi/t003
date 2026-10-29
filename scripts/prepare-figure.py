"""Refine the female silhouette and remove bow accessories while preserving the rig.

Usage: python scripts/prepare-figure.py downloaded-Michelle.glb assets/figure.glb
"""
import hashlib
import math
import json
import struct
import sys
b=open(sys.argv[1],'rb').read();
assert hashlib.sha256(b).hexdigest() == '7a87e15a99ccbc5e5877be66e1e4ecae0a581adcafa0cce1a5569f49909e968e', 'Unexpected source model revision'
n=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+n]);binary=b[28+n:]
def read(i):
 a=d['accessors'][i];v=d['bufferViews'][a['bufferView']];size={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];f={5126:'f',5123:'H',5125:'I',5121:'B'}[a['componentType']];s=struct.calcsize(f)*size;stride=v.get('byteStride',s);o=v.get('byteOffset',0)+a.get('byteOffset',0);return [struct.unpack_from('<'+f*size,binary,o+j*stride) for j in range(a['count'])]
p=d['meshes'][0]['primitives'][0];pos=read(p['attributes']['POSITION']);inds=[v[0] for v in read(p['indices'])];parents=list(range(len(pos)))
def root(i):
 while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
 return i
for a,c,e in zip(inds[::3],inds[1::3],inds[2::3]):parents[root(a)]=root(c);parents[root(e)]=root(c)
components={}
for i in range(len(pos)):components.setdefault(root(i),[]).append(i)
# Remove only disconnected bow components outside the head silhouette.
# Preserve face, hair, body, skinning and other accessories.
removed=set()
for c in components.values():
 ymin=min(pos[i][1] for i in c)
 if ymin>1.35 and max(abs(pos[i][0]) for i in c)>.14:removed.update(c)
kept=[]
for i in range(0,len(inds),3):
 tri=inds[i:i+3]
 if not any(v in removed for v in tri):kept.extend(tri)
a=d['accessors'][p['indices']];view=d['bufferViews'][a['bufferView']];o=view.get('byteOffset',0)+a.get('byteOffset',0)
f={5123:'H',5125:'I'}[a['componentType']]
binary=bytearray(binary)
struct.pack_into('<'+f*len(kept),binary,o,*kept)
a['count']=len(kept)
# Use smooth, bounded changes in the rest pose so all rendered modes share
# the same silhouette. Keep the waist balanced rather than exaggerating it.
position_accessor=d['accessors'][p['attributes']['POSITION']]
position_view=d['bufferViews'][position_accessor['bufferView']]
position_offset=position_view.get('byteOffset',0)+position_accessor.get('byteOffset',0)
position_stride=position_view.get('byteStride',12)
def bell(y,center,width):
 return math.exp(-((y-center)/width)**2)
def smoothstep(a,b,t):
 t=max(0,min(1,(t-a)/(b-a)))
 return t*t*(3-2*t)
refined=[]
for i,(x,y,z) in enumerate(pos):
 if y<1.32 and abs(x)<.28:
  # Fuller hips, a softer waist and chest, and a rounder pelvis in profile.
  torso=1+.19*bell(y,.91,.14)+.12*bell(y,1.065,.075)+.09*bell(y,1.21,.09)
  x*=torso
  z*=1+.17*bell(y,.91,.14)+.09*bell(y,1.08,.1)
  if z>.01:
   z+=.009*bell(y,1.22,.07)*math.exp(-((abs(x)-.045)/.05)**2)
 if .145<y<.82:
  # Taper the source's oversized trouser legs into a more natural leg line.
  blend=smoothstep(.16,.26,y)*(1-smoothstep(.72,.82,y))
  taper=.56+.33*smoothstep(.25,.72,y)
  leg_axis=.105 if x>=0 else -.105
  x=leg_axis+(x-leg_axis)*(1-blend*(1-taper))
  z*=1-blend*(.32-.18*smoothstep(.3,.72,y))
 if 1.20<y<1.32 and abs(x)>.25:
  # Give the forearms slightly more volume without altering hands or fingers.
  amount=smoothstep(.25,.34,abs(x))*(1-smoothstep(.56,.62,abs(x)))
  y=1.26+(y-1.26)*(1+amount*.1)
  z*=1+amount*.1
 refined.append((x,y,z))
 struct.pack_into('<fff',binary,position_offset+i*position_stride,x,y,z)
position_accessor['min']=[min(v[k] for v in refined) for k in range(3)]
position_accessor['max']=[max(v[k] for v in refined) for k in range(3)]
js=json.dumps(d,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
out=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary
open(sys.argv[2],'wb').write(out)
print('Removed accessory triangles:',(len(inds)-len(kept))//3,'retained',len(kept)//3)
