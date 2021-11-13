var default_path =  window.location.href.split('default_path=')[1].split('&')[0]
var share_id = window.location.href.split('id=')[1].split('&')[0]
var icons = window.FileIcons


function download_file(){    //TO DO downloading folder  
    let childs = document.getElementById('files_list').children
    let downloaded = false
    for (let i = 0; i <childs.length;i++){
        if ( childs[i].className.includes('active')){
            downloaded=true
            let filename = childs[i].children[1].children[0].innerHTML
            let url =  '/files'+btoa(unescape(encodeURIComponent(default_path+filename))+'?id='+share_id)
            console.log(url)
            let element = document.createElement('a')
            element.setAttribute('href',url)
            element.setAttribute('download', filename);
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
    }
    if (!downloaded){
        let url =  '/files'+btoa(unescape(encodeURIComponent(default_path))+'?id='+share_id)
        let element = document.createElement('a')
        element.setAttribute('href',url)
        element.setAttribute('download', default_path.split('/')[default_path.split('/').length-2]);
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}


function path_open(el,t=''){
    window.location.href = window.location.href.split('?')[0]+'?default_path='+ (t? escape(t): escape(el.innerHTML))+'&id='+share_id
}

var file_icons = []
document.addEventListener("DOMContentLoaded", function(event) {
    let path_splited = unescape(default_path).split('/')
    for (let i=0 ; i < path_splited.length;i++){
        let path_rn = path_splited.slice(0,i+1).join('/')
        if (path_splited[i]){
            let text = document.createElement('h2')
            text.innerHTML=path_splited[i]+'/'
            text.setAttribute('style','display: inline; color: white;')
            text.setAttribute('onclick','path_open(this,"'+path_rn+'/")')
            document.getElementById('file_path').appendChild(text)
        }
    }

        //load files list
        let xmlHttp = new XMLHttpRequest();
        xmlHttp.onload = function(){
            let files_list = document.getElementById('files_list')
            let answer = JSON.parse(this.response)
            answer.sort()
    
            for (let file_name of answer){
                let icon = icons.getClass(file_name)? icons.getClassWithColor(file_name): 'package-icon'
    
                //generate list
                let main_div = document.createElement('div')
                main_div.setAttribute('class'," list-group-item list-group-item-action unselectable")
                main_div.onclick = make_preview
                if (file_name.split('.').length == 1){
                    main_div.ondblclick = function(){
                        window.location.href  = window.location.href.split('?')[0]+'?default_path='+ default_path+file_name+'/&id='+share_id
                    }
                }
                files_list.appendChild(main_div)
                
                let file_icon = document.createElement('p')
                file_icon.setAttribute('class',icon)
                let sc = 2.5/Math.max(window.screen.width,window.screen.height) * Math.min(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,window.innerHeight|| document.documentElement.clientHeight|| document.body.clientHeight)
    
                file_icon.setAttribute('style',"transform: scale("+sc+");  float: left;")
                file_icons.push(file_icon)
                main_div.appendChild(file_icon)
    
                let secondary_div = document.createElement('div')
                secondary_div.setAttribute('class',"d-flex w-100 justify-content-between")
                main_div.appendChild(secondary_div)
    
                let file_name_el = document.createElement('h5')
                file_name_el.setAttribute('class','mb-1')
                file_name_el.setAttribute('style','text-align: right; font-size: 1.1vw;')
                file_name_el.innerHTML = file_name
                secondary_div.appendChild(file_name_el)
    
                let last_mod = document.createElement('small')
                last_mod.setAttribute('style','text-align: right;')
                last_mod.innerHTML = 'last modified: '
                secondary_div.appendChild(last_mod)
    
                let last_mod_time = document.createElement('small')
                last_mod_time.setAttribute('id','age_'+file_name)
                last_mod.appendChild(last_mod_time)
    
                let file_info_div = document.createElement('div')
                file_info_div.setAttribute('class',"d-flex w-100 justify-content-between")
                main_div.appendChild(file_info_div)
    
                let size_text = document.createElement('small')
                size_text.innerHTML = 'size: '
                file_info_div.appendChild(size_text)
    
                let size_text_id = document.createElement('small')
                size_text_id.setAttribute('id','size_'+file_name)
                size_text.appendChild(size_text_id)
    
                let date_text_id = document.createElement('small')
                date_text_id.setAttribute('id','date_'+file_name)
                file_info_div.appendChild(date_text_id)
    
                
                //get secondary data
                let file_data_request = new XMLHttpRequest();
                file_data_request.onload = function(e){
                    let size = formatBytes(this.getResponseHeader('content-length'))
                    let m_t = Date.parse(this.getResponseHeader('last-modified'))
                    let n_t = Date.parse(this.getResponseHeader('date'))
                    let f_name = decodeURIComponent(escape(atob(this.responseURL.split('/').slice(3).join('/')))).split('&')[0].split('/')
                    f_name = f_name[f_name.length-1]
                    console.log(f_name)
                    f_name=f_name.split('/')[f_name.split('/').length-1]
                    document.getElementById('size_'+f_name).innerHTML = size
                    document.getElementById('date_'+f_name).innerHTML = this.getResponseHeader('last-modified')
                }
                let s = "?default_path="+default_path+file_name+'&id='+share_id
                file_data_request.open('HEAD', btoa(unescape(encodeURIComponent(s))))
                file_data_request.send('')
                
            }
        }
    
        xmlHttp.open("GET",'/files'+btoa(unescape(encodeURIComponent(default_path)))+'?files_list=true&id='+share_id); 
        xmlHttp.send('')
})