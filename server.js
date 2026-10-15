import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.dirname(new URL(import.meta.url).pathname);
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};if(!file.startsWith(root+path.sep)||!types[path.extname(file)]){res.writeHead(404).end();return;}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache'}).end(data);}catch{res.writeHead(404).end('Not found');}}).listen(Number(process.env.PORT)||3000,'0.0.0.0');
