# Forge Properties API swizzle endpoint

A Proxy Server that provides an alternative `Forge Properties API` endpoints for your BIM360 content.  It does this by replacing any reference of svf2 dbids with svf1 dbids.

The code downloads the mapping file `dbid.idx` [file](https://github.com/wallabyway/properties-proxy/blob/a5417dcc1cc4b63e64eef52e08c6770dfb393735/server.js#L52) from Forge OSS( or BIM360 ), and decodes it into a lookup table, that can convert a SVF1 DBID, into a SVF2 DBID (and in reverse).  

Here's a diagram:

![Screen Shot 2021-08-02 at 2 13 18 PM](https://user-images.githubusercontent.com/440241/127924606-c2f0e09b-f118-4eee-aac0-7fc8bb0c05c2.JPG)

The proxy service expands on this, by remapping the DBIDs for the JSON produced by the 3 https://developer.api.autodesk.com/modelderivative/v2/designdata endpoints:

Here are the three proxy endpoints:
- https://forge-properties-proxy.herokuapp.com/:urn/metadata
- https://forge-properties-proxy.herokuapp.com/:urn/metadata/:guid
- https://forge-properties-proxy.herokuapp.com/:urn/metadata/:guid/properties

...which replace the forge endpoints:
- https://developer.api.autodesk.com/modelderivative/v2/designdata/:urn/metadata
- https://developer.api.autodesk.com/modelderivative/v2/designdata/:urn/metadata/:guid
- https://developer.api.autodesk.com/modelderivative/v2/designdata/:urn/metadata/:guid/properties


So... Just point your application to this proxy server, and it will `swizzle` the dbIDs for you, and provide you the matching properties meta-data.  

Here's a diagram of the proxy server:

![Screen Shot 2021-08-02 at 1 57 44 PM](https://user-images.githubusercontent.com/440241/127923795-9cebda35-4179-4b83-b2e9-f0ed8c4a2351.JPG)


#### TO INSTALL
```code
> git clone <this repo>
> npm install
```

#### TO RUN
```code
> node server.js
```

#### TO TEST
```
> curl http://localhost:3000/:urn/metadata/:guid/properties
```
> Remember: include the BIM 360 Access Token, in the header `Authorization:Bearer <token>` in the standard way.

See screenshot:

![Screen Shot 2021-07-26 at 7 59 22 PM](https://user-images.githubusercontent.com/440241/127088407-8f155761-2e9c-4254-8102-72b1743b710f.JPG)
