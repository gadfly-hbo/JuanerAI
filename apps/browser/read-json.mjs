/** No retries, caching, authority or business/receipt interpretation. */
export async function readJson(request,path,message,options={}) {
 const response=await request(path,{credentials:'same-origin',cache:'no-store',...options});
 if(!response.ok)throw Error(message);
 return response.json();
}
