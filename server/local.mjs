// Local development adapter. Production uses the Sites D1 binding.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import worker from '../dist/server/index.js';
const root=path.resolve(import.meta.dirname,'..');fs.mkdirSync(path.join(root,'.local'),{recursive:true});
const db=new DatabaseSync(path.join(root,'.local/rooms.sqlite'));
// Development only: apply the same migration files used by production.
db.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
for(const name of fs.readdirSync(path.join(root,'drizzle')).filter(n=>n.endsWith('.sql')).sort()){
 if(!db.prepare('SELECT name FROM local_migrations WHERE name=?').get(name)){
  db.exec('BEGIN');try{db.exec(fs.readFileSync(path.join(root,'drizzle',name),'utf8'));db.prepare('INSERT INTO local_migrations VALUES (?)').run(name);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 }
}
const DB={prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)||null;},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}};}};}};
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const ASSETS={async fetch(request){const pathname=decodeURIComponent(new URL(request.url).pathname);const base=path.join(root,'dist/client');const filename=path.resolve(base,'.'+(pathname==='/'?'/index.html':pathname));if(!filename.startsWith(base+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile())return new Response('Not found',{status:404});return new Response(fs.readFileSync(filename),{headers:{'Content-Type':types[path.extname(filename)]||'application/octet-stream'}});}};
http.createServer(async(req,res)=>{try{const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>4096){res.writeHead(413);res.end();return;}chunks.push(c);}const request=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});const response=await worker.fetch(request,{DB,ASSETS});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Server error');}}).listen(Number(process.env.PORT||4174),'127.0.0.1',()=>console.log('Multiplayer test server: http://localhost:4174'));
