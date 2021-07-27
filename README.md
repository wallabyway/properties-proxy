# Forge Properties API swizzle endpoint

A Proxy Server that provides an alternative `Forge Properties API` endpoints for your BIM360 content.  It does this by replacing any reference of svf2 dbids with svf1 dbids.

Just point your application to this proxy server, and it will `swizzle` the dbIDs for you, and provide you the matching properties meta-data (prior to the July 1st changes).

![Screen Shot 2021-07-26 at 8 01 35 PM](https://user-images.githubusercontent.com/440241/127088522-4ee86403-9505-42f7-9b09-25fe7ec5cd36.JPG)

#### TO INSTALL
```code
> npm install node-fetch fastify
```

#### TO RUN
```code
> node server-props-proxy.js
```

#### TO TEST
```
> curl http://localhost:3000/:urn/metadata/:guid/properties
```
| include bim360 access token in the bearer header

See screenshot:

![Screen Shot 2021-07-26 at 7 59 22 PM](https://user-images.githubusercontent.com/440241/127088407-8f155761-2e9c-4254-8102-72b1743b710f.JPG)