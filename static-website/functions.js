//Update with your values
url_api_list = "https://g2jju3yz29.execute-api.us-east-1.amazonaws.com/default/MediaConvertDemo-ListVideos"
url_api_convert = "https://0n3daufjj6.execute-api.us-east-1.amazonaws.com/default/convert";
url_api_poll = "https://0n3daufjj6.execute-api.us-east-1.amazonaws.com/default/poll";


function listVideos()
{
    fetch(url_api_list,{
        method: 'GET',
        headers:{
            "x-api-key": "cKpqw66KIo5pZJvw5HiZC7rRlHpuikFFa4K6kOUh",
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json())
        .then(function(videos){
            let html="";
            let counter=0;
            videos.forEach(element => {
                counter++;
                html+='<figure class="gallery_item gallery__item--'+counter+'">';
                html+="<img src= thumbnails/"+element.thumbnail+" /><p>"+element.name.split(".")[0]+"</p>";
                html+="<p><button type=button onclick=convertVideo('"+element.name+"')>Convertir</button></p>";
                html+="</figure>";
            }
            );
            document.getElementById("response").innerHTML = html;
        });
}

async function convertVideo(video){
    document.getElementById("message").innerHTML = "<img src=ajax-loader.gif /><p>Convirtiendo video...</p>" ;
    let data = await startJob(video);
    let parse=JSON.parse(data);
    
    let jobId=parse.Job.Id; 
    
    waitforCompletion(jobId);
}

async function startJob(video){
    url_fetch = url_api_convert+"?key="+video;

    const response = await fetch(url_fetch,{
        method: 'GET',
        headers:{
            "Content-Type": "application/json"
        }
    });
    const json = await(response.json());
    //console.log(json);
    return json;
}

async function waitforCompletion(jobId){
  let data = await pollConvertJob(jobId);
  
  
    //espera 3 segundos

    if (data.status == "PROGRESSING"){
        setTimeout(function(){ waitforCompletion(jobId);}, 3000);
    }
  
    
   if (data.status == "COMPLETE"){
        document.getElementById("message").innerHTML = "<a href="+data.message+">"+data.message+"</a>";
    }else{
        document.getElementById("message").innerHTML = data.message;
    }         



}


function pollConvertJob(id){
    url_fetch = url_api_poll+"?jobId="+id;
    
    return fetch(url_fetch,{
        method: 'GET',
        headers:{
            "Content-Type": "application/json"
        }
    })
        .then(response => response.json());

    /*const response = await fetch(url_fetch,{
        method: 'GET',
        mode: 'no-cors',
        headers:{
            "Content-Type": "application/json"
        }
    });
    
    const data = await response.json();
    return data; */
    
}
    