const FILES_TO_CACHE =[
    `/`,
    `/index.html`,
    `db.js`,
];

const CACHE_NAME = `static-cache-v2`;
const DATA_CACHE_NAME = `data-cache-v1`;

//INSTALL
self.addEventListener(`install`, event => {
    console.log(`begin install`);
event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
        console.log(`Woohoo! Your files have been pre-cached succesfully!`);
        return cache.addAll(FILES_TO_CACHE);
    })
);
self.skipWaiting();
});
//ACTIVATE
self.addEventListener(`activate`, event => {
    console.log(`begin activate`);
    event.waitUntil(
        caches.keys().then(keyList => Promise.all(
            keyList.map(key => {
                if (key !== CACHE_NAME && DATA_CACHE_NAME){
                    console.log(`Removing old cache data`, key);
                    return caches.delete(key);
                }
                return undefined
            })
        ))
    );
    self.clients.claim();
});

//FETCH
self.addEventListener(`fetch`, event => {
    console.log(`initiate the fetch`);
    //this part is caching successful requests to the API
    if (event.request.url.includes('/')) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => fetch(event.request)
            .then(response => {
                //if the response was good clone it and store it in the cache!
                if (response.status === 200) {
                    cache.put(event.request.url, response.clone());
                }
                return response;
            })
            .catch(err => {
                //If network request failed, get it from the cache
                cache.match(event.request);
                console.error(err);
            }))
            .catch(err => console.error(err))
        );
    } else {
        //If the request is not for an API, serve static assets using "off-line first" approach.
        event.respondWith(
            caches.match(event.request).then(response => response || fetch(event.request))
            .catch(err => console.error(err))
        );
    }
});


