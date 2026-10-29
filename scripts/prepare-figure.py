"""Remove the source figure's bow accessories without changing its body or rig.

Usage: python scripts/prepare-figure.py downloaded-Michelle.glb assets/figure.glb
"""
import hashlib
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
js=json.dumps(d,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
out=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary
open(sys.argv[2],'wb').write(out)
print('Removed accessory triangles:',(len(inds)-len(kept))//3,'retained',len(kept)//3)
