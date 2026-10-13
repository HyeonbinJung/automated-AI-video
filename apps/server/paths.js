import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),'data');
export const uploads=path.join(ROOT,'uploads');
fs.mkdirSync(uploads,{recursive:true});
export function assetFile(projectId,file){const id=projectId.replace(/[^\w-]/g,'');const dir=path.join(uploads,id);fs.mkdirSync(dir,{recursive:true});return path.join(dir,file);}
export function mediaUrl(projectId,file){return `/media/${projectId}/${file}`;}
