import { createEventDispatcher } from 'svelte';
import { tokenPromise } from '../../components/security.js'
import { isPromise} from './utils.js'

async function options(query) {
  return {
    method: 'POST',
    headers: {
      'Access-Control-Allow-Headers':['Authorization'],
      'Authorization': "Bearer "+ await tokenPromise(),
      'Content-Type': 'application/json',
      'Accept':'text/csv'
    },
    body: JSON.stringify(query)
  }
}

export async function download(url, query, filename, listeners) {
  console.log(url,query)
  let { onUpdate, onEnd, onCancelled, onDownloaded } = listeners || {};
  fetch(url, await options(query)).then(res => {
    const reader = res.body.getReader()
    function readme(accumulated,count){
      reader.read().then(async (x) => {
        let {done, cancelled, value} = x
        if (!done && !cancelled){
          var newaccumulated = [...accumulated,x.value]
          count += value.length
          onUpdate && onUpdate(count)
          readme(newaccumulated,count)
        } else {
          if (cancelled){
            onCancel && onCancel()
            return "cancelled"
          }
          var blob = new Blob(accumulated, {type: "octet/stream"})
          onDownloaded && onDownloaded()
          const fname = isPromise(filename)? await filename : filename
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fname);
          document.body.appendChild(link);
          link.click();
          onEnd && onEnd()
        }
      })
    }
    readme([],0)
  })
}
