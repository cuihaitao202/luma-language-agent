const CACHE='luma-v2';
const CORE=['/','/manifest.webmanifest','/luma-icon.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('/'))));
});

self.addEventListener('push',event=>{
  let data={};try{data=event.data?.json()||{}}catch{}
  event.waitUntil(self.registration.showNotification(data.title||'Luma is calling',{
    body:data.body||'Your daily language call is due. Tap to answer and respond.',
    icon:'/luma-icon.svg',badge:'/luma-icon.svg',tag:'luma-daily-call',renotify:true,requireInteraction:true,
    data:{url:'/?coachCall=1'},actions:[{action:'answer',title:'Answer now'},{action:'later',title:'10 minutes'}]
  }));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  if(event.action==='later')return;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    const existing=list.find(client=>'focus' in client);
    if(existing){existing.navigate('/?coachCall=1');return existing.focus()}
    return clients.openWindow('/?coachCall=1');
  }));
});
