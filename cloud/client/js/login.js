document.getElementById('password').onkeypress = function(e){
    if (!e) e = window.event;
    let keyCode = e.code || e.key;
    if (keyCode == 'Enter'){
        login()
    }
    else{
        document.getElementById('password').style.backgroundColor= "white"
        document.getElementById('error').innerHTML = ''
    }
  }


function login(){
    window.password = document.getElementById('password').value
    let xmlHttp = new XMLHttpRequest();

    xmlHttp.onload = function(){
        let answer = this.response
        console.log(answer)
        if (answer == 'error'){
            document.getElementById('error').innerHTML = '*Access code is invalid'
            document.getElementById('password').value = ''
            document.getElementById('password').style.backgroundColor = '#FFC4C4'
        }
        else{
            document.cookie = answer.split('?')[1]
            window.open(window.location.href+answer.split('?')[0]+'?default_path=/','_self')
        }
    }

    xmlHttp.open( "POST",'', true ); 
    xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xmlHttp.send('type=login&password='+password);
    
    }
