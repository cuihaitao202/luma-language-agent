import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {extname,join,relative,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const dist=join(root,'dist');
const serverDir=join(dist,'server');
const sourcePath=join(root,'worker','index.js');

const contentTypes={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp'
};

async function listFiles(directory){
  const entries=await readdir(directory,{withFileTypes:true});
  const files=[];
  for(const entry of entries){
    if(entry.name==='server'||entry.name==='.openai')continue;
    const absolute=join(directory,entry.name);
    if(entry.isDirectory())files.push(...await listFiles(absolute));
    else files.push(absolute);
  }
  return files;
}

const files=await listFiles(dist);
const assets={};
for(const file of files){
  const pathname='/'+relative(dist,file).split('\\').join('/');
  assets[pathname]={
    type:contentTypes[extname(file)]||'application/octet-stream',
    body:(await readFile(file)).toString('base64')
  };
}

const embedded=`const EMBEDDED_ASSETS=${JSON.stringify(assets)};
function decodeAsset(value){
  const binary=atob(value);const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}
function serveStatic(request,env){
  const url=new URL(request.url);let pathname=url.pathname;
  if(pathname==='/'||!EMBEDDED_ASSETS[pathname])pathname='/index.html';
  const asset=EMBEDDED_ASSETS[pathname];
  if(!asset)return env.ASSETS?.fetch(request)||new Response('Not found',{status:404});
  const immutable=pathname.startsWith('/assets/');
  return new Response(decodeAsset(asset.body),{headers:{'Content-Type':asset.type,'Cache-Control':immutable?'public, max-age=31536000, immutable':'public, max-age=300'}});
}
`;

const source=(await readFile(sourcePath,'utf8')).replace('return env.ASSETS.fetch(request);','return serveStatic(request,env);');
await mkdir(serverDir,{recursive:true});
await writeFile(join(serverDir,'index.js'),embedded+source);
