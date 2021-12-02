var first_selected = undefined
function make_preview(e){
    // make new active element and remove old active
    let children = document.getElementById('files_list').getElementsByClassName('list-group-item');

    if (!pressed_keys['Control']){
        for (let i = 0; i<children.length; i++){
            children[i].className = children[i].className.replace('active','')
        }
        
    }
    if (this.className.includes('active')){
        console.log(this)
        this.className = this.className.replace('active','')
    }
    else{
        this.className += ' active'
    }

    if (!(pressed_keys['Shift'] || pressed_keys['Control'])){
        first_selected = this    
    }
    
    
    //if shift, we make changes from first element

    if (pressed_keys['Shift']){
        if (!first_selected){
            first_selected = this
        }
        else{
            let index_clicked = new Array(...children).indexOf(this)
            let index_first = new Array(...children).indexOf(first_selected)
            let start = Math.min(index_clicked,index_first)
            let end = Math.max(index_clicked,index_first)
            console.log(start,end)
            for (let i = start; i<=end; i++){
                console.log(i)
                if (! children[i].className.includes('active')){
                    children[i].className = children[i].className += ' active'
                }
            }
        }
    }

    //make preview
    //clear previous preview
    let preview_div = document.getElementById('file_preview')
    preview_div.innerHTML = '<h5>Downloading file</h5>' 


    let im = document.createElement('img')
    im.setAttribute('src',load_gif.src)
    im.setAttribute('id','preview_content_image')
    im.style = 'width:100%;height:100%;'
    preview_div.appendChild(im)

    let type = this.children[0].className.split('-')[0]
    let filename = this.children[1].children[0].innerHTML
    let size = document.getElementById('size_'+filename).innerHTML.toLowerCase()
    if (type == 'image'){
        let image = new Image()
        image.src = '/files'+btoa(unescape(encodeURIComponent(default_path+filename))+'?id='+share_id)
        image.onload = function(){
            document.getElementById('file_preview').removeChild(document.getElementById('file_preview').firstChild)
            document.getElementById('preview_content_image').src=this.src
        }
    }
    else if (type == 'video'){
        let video = document.createElement('video')
        video.setAttribute('controls','controls')
        video.setAttribute('preload','autho')
        video.src = '/files'+btoa(unescape(encodeURIComponent(default_path+filename))+'?id='+share_id)
        video.style = 'width:100%;height:100%;'
        preview_div.innerHTML = '' 
        preview_div.appendChild(video)
    }
    else if (type== 'audio'){
        let audio = document.createElement('audio')
        audio.setAttribute('controls','controls')
        audio.src = '/files'+btoa(unescape(encodeURIComponent(default_path+filename))+'?id='+share_id)
        audio.style = 'width:100%;height:100%;'
        preview_div.innerHTML = '' 
        preview_div.appendChild(audio)

    }
    else if (type=='zip' || type == 'package'){
        preview_div.innerHTML = '<h1>Cant load file preview</h1>' 
    }

    else if (type =='pdf'){
        let preview_div = document.getElementById('file_preview')
        preview_div.innerHTML = ''

        let emb = document.createElement('embed')
        emb.setAttribute('style','width:100%;height:100%; resize: none;')
        emb.setAttribute('type','application/'+type)
        emb.setAttribute('src','/files'+btoa(unescape(encodeURIComponent(default_path+filename))+'?id='+share_id))
        preview_div.appendChild(emb)
    }

    

    //cast as text
    
    else if (size.includes(' b') || size.includes(' kb')){
        http = new XMLHttpRequest()
        http.open('GET','/files'+btoa(unescape(encodeURIComponent(default_path+filename))+'?id='+share_id))
        http.onload = function(){
            let preview_div = document.getElementById('file_preview')
            preview_div.innerHTML = ''
            let text = document.createElement('textarea')
            text.setAttribute('style','width:100%;height:100%; resize: none; ')
            text.setAttribute('readonly','readonly')
            text.innerHTML = this.responseText
            preview_div.appendChild(text)

        }

        http.send('')
    }
    else{
        preview_div.innerHTML = '<h1>File size is to big</h1>' 
    }
}
