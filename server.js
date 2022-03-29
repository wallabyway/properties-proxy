/*
Alternative Forge Properties API endpoints for BIM360 content, and replaces svf2 dbids with svf1 dbids.

INSTALL
> git clone <this repo>
> npm install

RUN
> node server-props-proxy.js
> curl localhost:8000/properties?urn=:urn&guid=:guid
> include bim360 bearer token
*/

const fetch = require('node-fetch');
const fastify = require('fastify')({ logger: true });
const fs = require('fs');
const path = require('path');

const FORGE_SVF2_URL = `https://otg.autodesk.com/modeldata/manifest`;
const opts = token => ({ compress: true, headers: { 'Authorization': 'Bearer ' + token }});

function setCORS(reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "POST");    
}

const cache =[];

async function getLookupTable(urn, token, reply) {
  let dbidIdx;
  if (!cache[urn]) {
    const otg_manifest = await getPathFromManifest(urn, token, reply);
    dbidIdx = await downloadLookupTable(otg_manifest, token);
    cache[urn]=dbidIdx;    	
  } else
    dbidIdx = cache[urn];
  
  return dbidIdx;
}

async function getPathFromManifest(urn, token, reply) {
	const resp = await fetch(`${FORGE_SVF2_URL}/${urn}`, opts(token));
	if (resp.status != 200) {
      reply.code(resp.status).send(resp.statusText);
      throw(resp.statusText);
  }
  const jsn = await resp.json();
	return jsn.children[0].otg_manifest;
}

async function downloadLookupTable(otgm, token) {
	const file = `dbid.idx`;
	const url = `https://us.otgs.autodesk.com/modeldata/file/` + encodeURIComponent(`${otgm.paths.version_root}${otgm.pdb_manifest.pdb_version_rel_path}`);
	const buff = await ( await fetch(`${url}${file}?acmsession=${otgm.urn}`, opts(token) )).buffer();
	const rev = new Uint32Array(buff.buffer, buff.byteOffset, buff.byteLength / Uint32Array.BYTES_PER_ELEMENT);
  const dbidIdx=[]; rev.map( (i,dbid) => {dbidIdx[i] = dbid;});
	return dbidIdx;
}

/* 
    Forge Properties API endpoints
*/

// ENDPOINT -------------------------------------------
// GET {urn}/metadata/:guid/properties
fastify.get('/:urn/metadata/:guid/properties', async (request, reply) => {
    if (!request.headers.authorization) return reply.code(400).send(`{ "developerMessage":"Token is not provided in the request.", "moreInfo": "https://forge.autodesk.com/en/docs/oauth/v2/developers_guide/error_handling/", "errorCode": "AUTH-010"}`);
    if (!request.params.urn) return reply.code(400).send(`{ "developerMessage":"URN is not provided in the request."}`);
    if (!request.params.guid) return reply.code(400).send(`{ "developerMessage":"GUID is not provided in the request."}`);

    const urn = request.params.urn;
    const guid = request.params.guid;
    const token = request.headers.authorization.slice(7);

    const dbidIdx = await getLookupTable(urn, token, reply);
    const res_svf2 = await proxy_fetch_properties(dbidIdx, urn, guid, token, reply);

    setCORS(reply);
    return res_svf2;
});

async function proxy_fetch_properties(dbidIdx, urn, guid, token, reply) {
	const resp = await fetch(`https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/metadata/${guid}/properties?forceget=true`, opts(token) );
  console.log(`resp.status:${resp.status}`);
  if (resp.status != 200) return reply.code(resp.status).send(resp.statusText); 
  const json = await resp.json();
  json.data.collection.map( i => {i.svf2 = i.objectid; i.objectid = i.svf2; dbidIdx[i.svf2] })
	return json;
}

// ENDPOINT -------------------------------------------
// GET {urn}/metadata/:guid
fastify.get('/:urn/metadata/:guid', async (request, reply) => {
    if (!request.headers.authorization) return reply.code(400).send(`{ "developerMessage":"Token is not provided in the request.", "moreInfo": "https://forge.autodesk.com/en/docs/oauth/v2/developers_guide/error_handling/", "errorCode": "AUTH-010"}`);
    if (!request.params.urn) return reply.code(400).send(`{ "developerMessage":"URN is not provided in the request."}`);
    if (!request.params.guid) return reply.code(400).send(`{ "developerMessage":"GUID is not provided in the request."}`);

    const urn = request.params.urn;
    const guid = request.params.guid;
    const token = request.headers.authorization.slice(7);

    const dbidIdx = await getLookupTable(urn, token);
    const res_svf2 = await proxy_fetch_guid(dbidIdx, urn, guid, token, reply);

    setCORS(reply);
    return res_svf2;
});

async function proxy_fetch_guid(dbidIdx, urn, guid, token, reply) {
  const resp = await fetch(`https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/metadata/${guid}?forceget=true`, opts(token) );
  if (resp.status != 200) return reply.code(resp.status).send(resp.statusText); 
	const json = await resp.json();

  // recursively travese json tree and swizzle objectid with svf2
  function swizzleNode(currentNode) {
    for(var index in currentNode.objects) {
      var node = currentNode.objects[index];
      if(node.objectid) {
          node.svf2 = node.objectid;
          node.objectid = dbidIdx[node.svf2];
      }
      swizzleNode(node);
    }
  }
  swizzleNode(json.data.objects[0]);
	return json;
}

// ENDPOINT -------------------------------------------
// GET {urn}/metadata
// this is a direct passthrough, no swizzling required here.
fastify.get('/:urn/metadata', async (request, reply) => {
    if (!request.headers.authorization) return reply.code(400).send(`{ "developerMessage":"Token is not provided in the request.", "moreInfo": "https://forge.autodesk.com/en/docs/oauth/v2/developers_guide/error_handling/", "errorCode": "AUTH-010"}`);
    if (!request.params.urn) return reply.code(400).send(`{ "developerMessage":"URN is not provided in the request."}`);

    const urn = request.params.urn;
    const token = request.headers.authorization.slice(7);

    const resp = await fetch(`https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/metadata`, opts(token) );
    reply.code(resp.status);
    const json = await resp.json();

    setCORS(reply);
    return json;
});

// start service
fastify.listen(process.env.PORT || 3000, "0.0.0.0", (err, address) => {
  if (err) throw err
  console.log(`server listening on ${address}`)
  fastify.log.info(`server listening on ${address}`)
})
