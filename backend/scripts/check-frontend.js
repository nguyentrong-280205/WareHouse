// Parse source only. Does not execute application code, build, call APIs, or run tests.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const directory=path.resolve(__dirname,'../../frontend');
let count=0;
function scan(folder,parser){for(const item of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,item.name);if(item.isDirectory())scan(file,parser);else if(/\.[cm]?jsx?$/.test(item.name)){const result=parser.parseSync(file,fs.readFileSync(file,'utf8'));if(result.errors.length){for(const error of result.errors)console.error('FRONTEND_SYNTAX_FAILED: '+path.relative(directory,file)+' '+error.message);process.exitCode=1;}else count++;}}}
async function main(){const parser=await import(pathToFileURL(require.resolve('rolldown/experimental',{paths:[directory]})).href);scan(path.join(directory,'src'),parser);if(!process.exitCode)console.log('Frontend JavaScript/JSX syntax parsed: '+count+' files; no tests or build executed.');}
main().catch(()=>{console.error('FRONTEND_PARSER_UNAVAILABLE');process.exitCode=1;});
