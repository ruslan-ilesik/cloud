function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}


var files_list = []
function share(){
    http = new XMLHttpRequest()
    http.open('POST','/db_execute')
    //check if such share_link already exist
    http.onload = function(){
        let data = JSON.parse(this.response)
        if (data.length){//give already exsist link
            http.open('POST','/db_execute')
            http.onload = function(){
                id = JSON.parse(this.response)[0][0]
                url = 'http://'+window.location.host+'/share?default_path=/&id='+id
                file = 'http://'+window.location.host+ '/files'+btoa(unescape(encodeURIComponent('/'))+'?id='+id)
                document.getElementById('share_site').innerHTML = url
                document.getElementById('share_file').innerHTML = file
            }
            http.send(btoa(unescape(encodeURIComponent("SELECT id FROM links WHERE  JSON_CONTAINS(files,'"+JSON.stringify(files_list)+"') and active=1"))))
        }
        else{
            function generate(){       
                if (JSON.parse(this.response).length){
                    window.id = makeid(32)
                    http.open('POST','/db_execute')
                    http.onload = generate
                    http.send(btoa(unescape(encodeURIComponent('SELECT id FROM links WHERE  id="'+id+'"'))))
                }
                //input in db
                http.open('POST','/db_execute')
                http.onload = function(){
                    //visualize
                    url = 'http://'+window.location.host+'/share?default_path=/&id='+id
                    file = 'http://'+window.location.host+ '/files'+btoa(unescape(encodeURIComponent('/'))+'?id='+id)
                    document.getElementById('share_site').innerHTML = url
                    document.getElementById('share_file').innerHTML = file
                }
                
                http.send(btoa(unescape(encodeURIComponent('INSERT INTO links (id,files) VALUES ("'+id+'",'+"'"+JSON.stringify(files_list)+"')"))))


            }
            window.id = makeid(32)
            http.open('POST','/db_execute')
            http.onload = generate
            http.send(btoa(unescape(encodeURIComponent('SELECT id FROM links WHERE  id="'+id+'"'))))
        }
    }
    let childs = document.getElementById('files_list').children
    files_list = []
    for (let i = 0; i <childs.length;i++){
        if ( childs[i].className.includes('active')){
            let filename = './files' + default_path + childs[i].children[1].children[0].innerHTML
            files_list.push(filename)
        }
    }
    if (!files_list.length){
        files_list.push('./files' + default_path)
    }
    http.send(btoa(unescape(encodeURIComponent("SELECT active FROM links WHERE  JSON_CONTAINS(files,'"+JSON.stringify(files_list)+"') and active=1"))))
    
}


function download_file(){    
    let childs = document.getElementById('files_list').children
    let downloaded = false
    for (let i = 0; i <childs.length;i++){
        if ( childs[i].className.includes('active')){
            downloaded=true
            let filename = childs[i].children[1].children[0].innerHTML
            let url =  '/files'+btoa(unescape(encodeURIComponent(default_path+filename)))
            let element = document.createElement('a')
            element.setAttribute('href',url)
            element.setAttribute('download', filename);
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
    }
    if (!downloaded){
        let url =  '/files'+btoa(unescape(encodeURIComponent(default_path)))
        let element = document.createElement('a')
        element.setAttribute('href',url)
        element.setAttribute('download', default_path.split('/')[default_path.split('/').length-2]);
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}



function new_folder(){
    let name = prompt('Input new folder name');
    if (name){
        fetch('/upload?path='+btoa(unescape(encodeURIComponent(default_path+name))),{method:'POST',body:''}).then(response => document.location.reload())   
    }

}


async function upload_file(){
    let files =document.getElementById('upload_file').files
    let form_data = new FormData()
    let image = document.createElement('img')
    document.getElementById('upload_text').innerHTML='Wait, file is uploading'
    image.setAttribute('style','position:absolute;width:100%;height:75%;left:0;bottom:0;z-index:100 !important;')
    image.setAttribute('src',load_gif.src)
    document.body.appendChild(image)
    for (let i=0 ; i<files.length;i++){  
        form_data.append(files[i].type, files[i])
        console.log(files[i])
        if (i+1 != files.length){
            fetch('/upload?path='+btoa(unescape(encodeURIComponent(default_path+files[i].name))),{method:'POST',body:form_data})
        }
        else{
            let r = fetch('/upload?path='+btoa(unescape(encodeURIComponent(default_path+files[i].name))),{method:'POST',body:form_data}).then(response => document.location.reload())   
        }     
    }
}





function delete_file(){
    let answer = window.confirm("Are you sure that you want delete this file?");
    if (answer) {
        let childs = document.getElementById('files_list').children
        for (let i = 0; i <childs.length;i++){
            if ( childs[i].className.includes('active')){
                let filename = childs[i].children[1].children[0].innerHTML
                let url =  '/files'+btoa(unescape(encodeURIComponent(default_path+filename)))
                console.log(decodeURIComponent(escape(atob(btoa(unescape(encodeURIComponent(default_path+filename)))))),btoa(unescape(encodeURIComponent(default_path+filename))))
                let http = new XMLHttpRequest()
                http.open('POST','')

                http.onload = function(){
                    document.location.reload();
                }

                http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
                http.send('type=delete_file&path='+url);
            }
        }
    }
}