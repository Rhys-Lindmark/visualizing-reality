import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const sourceRoot='public';
const buildRoot='dist/client';

async function files(root,directory=root){
  const entries=await readdir(directory,{withFileTypes:true});
  const nested=await Promise.all(entries.map(entry=>entry.isDirectory()?files(root,join(directory,entry.name)):[relative(root,join(directory,entry.name))]));
  return nested.flat();
}

const publicFiles=await files(sourceRoot);
const failures=[];
for(const path of publicFiles){
  try{
    const[source,built]=await Promise.all([readFile(join(sourceRoot,path)),readFile(join(buildRoot,path))]);
    if(!source.equals(built))failures.push(`${path}: built copy differs from public source`);
  }catch(error){failures.push(`${path}: ${error instanceof Error?error.message:String(error)}`);}
}

if(failures.length){
  console.error('Build asset verification failed:');
  for(const failure of failures)console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Build asset verification passed: ${publicFiles.length} public files copied byte-for-byte into ${buildRoot}`);
