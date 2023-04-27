from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler
from http.server import HTTPServer
from os import error, path
import mimetypes
from urllib.parse import parse_qs, urlparse,unquote
import time
import string
import random
import os
import json
import datetime
import base64
import shutil



import data as settings
from pymysql import connections

import db

TIME_LIVE_CODE = 10*60 
acces_codes = {} #code:time created




def check_codes():
    for i in list(acces_codes.keys()):
        if time.time() - acces_codes[i] > TIME_LIVE_CODE:
            del acces_codes[i]




class HttpHandler(BaseHTTPRequestHandler):
    def __log_conect(self):
        if len(self.path.split('?'))>1 and len(self.path.split('?')[1].split('id=')) > 1:
            db.execute('CALL edit_statistic("'+self.path.split('?')[1].split('id=')[1].split('&')[0]+'","'+self.client_address[0]+'")')

    def log_message(self, format, *args):
        return

    def do_HEAD(self):
        self.__log_conect()
        check_codes()
        cookie = SimpleCookie(self.headers.get('Cookie'))
        self.path = (base64.b64decode(bytes(self.path[1::],encoding='utf8'))).decode('utf-8')
        if 'code' in cookie.keys() and cookie['code'].value in acces_codes:
            status = os.stat('./files'+self.path.split('default_path=')[1].split('&')[0])
            self.send_response(200)
            self.send_header("Content-type", 'tex/text')
            self.send_header('content-length',status.st_size)
            self.send_header('last-modified',datetime.datetime.utcfromtimestamp(int(status.st_atime)))
            self.end_headers()
            acces_codes[cookie['code'].value] = time.time()
        else:
            args = [i.split('=')[0] for i in self.path.split('?')[1].split('&')]
            if 'default_path' in args and 'id' in args:
                share_id = self.path.split('id=')[1].split('&')[0]
                default_path = self.path.split('default_path=')[1].split('&')[0] 
                d = db.execute('SELECT active FROM links WHERE id="'+share_id+'"')
                if len(d):
                    if d[0][0]:
                        files = json.loads(db.execute('SELECT files FROM links where id = "'+ self.path.split('id=')[1].split('&')[0]+'"')[0][0])
                        file_names = [i.split('/')[-1] for i in files]
                        if default_path[1::].split('/')[0] in file_names:
                            path = files[file_names.index(default_path[1::].split('/',1)[0])]+'/'+(default_path.split('/',2)[2] if len(default_path.split('/')) > 2 else '' )        
                            path = (path[:-1:] if path[-1]=='/'else path)             
                            status = os.stat(path)
                            print(status)
                            self.send_response(200)
                            self.send_header("Content-type", 'tex/text')
                            self.send_header('content-length',status.st_size)
                            self.send_header('last-modified',datetime.datetime.utcfromtimestamp(int(status.st_atime)))
                            self.end_headers()
                    else:
                        self.send_response(404)
                        self.send_header("Content-type", 'text/html')
                        self.end_headers()
                        self.wfile.write('<h1>Outdated link </h1>'.encode())
                else:
                    self.send_response(404)
                    self.send_header('Location','/')
                    self.end_headers()
        return

            
    def do_GET(self):
        self.__log_conect()
        print(self.path)
        check_codes()
        cookie = SimpleCookie(self.headers.get('Cookie'))
        def send_file(path):
                path = path.replace("..","")
                try:
                    if '.' in path.split('/')[-1]:
                        f = open(path,'rb')
                    else:
                        shutil.make_archive('./time/'+path.replace('/','_'), 'zip', path)
                        path = path.replace('/','_')+'.zip'
                        f = open('./time/'+path,'rb')
                    mimetype, _ = mimetypes.guess_type(path)
                    self.send_response(200)
                    self.send_header("Content-type", mimetype)
                    self.end_headers()
                    self.wfile.write(f.read())
                except FileNotFoundError:
                    self.send_response(404)
                    self.send_header("Content-type", 'text/html')
                    self.end_headers()
                    self.wfile.write('<h1>Error 404</h1>'.encode())
                return

        if self.path.startswith('/admin'):
            if cookie['code'].value in acces_codes:
                acces_codes[cookie['code'].value] = time.time()
                print(self.path)
                if self.path.startswith('/admin/files'):
                    args = [i.split('=')[0] for i in self.path.split('?')[1].split('&')]
                    if 'files_list' in args:
                        path = './'+self.path.split('?')[0].split('/admin/',1)[1]
                        self.send_response(200)
                        self.send_header("Content-type", 'text/json')
                        self.end_headers()
                        self.wfile.write(json.dumps(os.listdir(path)).encode())
                    
                    else:
                        print(self.path)

                else:
                    acces_codes['code'] = time.time()
                    path = '.'+self.path.split('?')[0]+('' if '.' in self.path else '/index.html')
                    send_file(path)

            else:
                self.send_response(404)
                self.send_header('Location','/')
                self.end_headers()

        elif self.path.startswith('/share'):
            path = '.'+self.path.split('?')[0]+('' if '.' in self.path else '/index.html')
            if path.endswith('/index.html'):
                args = self.path.split('?')[1]
                share_id = args.split('id=')[1].split('&')[0]
                default_path = args.split('default_path=')[1].split('&')[0] #base64.b64decode(bytes(args.split('default_path=')[1].split('&')[0],'utf-8')).decode()
                d = db.execute('SELECT active FROM links WHERE id="'+share_id+'"')
                if len(d):
                    if d[0][0]:
                        send_file(path)
                    else:
                        self.send_response(404)
                        self.send_header("Content-type", 'text/html')
                        self.end_headers()
                        self.wfile.write('<h1>Outdated link </h1>'.encode())
                else:
                    self.send_response(404)
                    self.send_header('Location','/')
                    self.end_headers()
            else:
                send_file(path)
        
        elif self.path.startswith('/files'):
            if len(self.path.split('?'))>1 and 'files_list=' in self.path.split('?')[1]:
                default_path = base64.b64decode(bytes(self.path.split('/files',1)[1].split('?')[0],encoding='utf8')).decode('utf-8').replace("..","")
                files = json.loads(db.execute('SELECT files FROM links where id = "'+ self.path.split('id=')[1].split('&')[0]+'"')[0][0])
                file_names = [i.split('/')[-1] for i in files]
                if default_path == '/' or default_path[1::].split('/')[0] in file_names:           
                        self.send_response(200)
                        self.send_header("Content-type", 'text/json')
                        self.end_headers()
                        if default_path != '/':
                            data = json.dumps(os.listdir(files[file_names.index(default_path[1::].split('/',1)[0])]+'/'+default_path.split('/',2)[2]))
                        else:
                            data = json.dumps(file_names)
                        self.wfile.write(data.encode())

            else:
                path = './files'+base64.b64decode(bytes(self.path.split('/files',1)[1].split('?')[0],encoding='utf8')).decode('utf-8')
                
                if 'code' in cookie.keys() and cookie['code'].value in acces_codes:
                    acces_codes[cookie['code'].value] = time.time()
                
                else:
                    print(base64.b64decode(bytes(self.path.split('/files',1)[1],encoding='utf8')).decode('utf-8'))
                    default_path = base64.b64decode(bytes(self.path.split('/files',1)[1],encoding='utf8')).decode('utf-8').split('?')[0]
                    args = base64.b64decode(bytes(self.path.split('/files',1)[1],encoding='utf8')).decode('utf-8').split('?')[1]
                    
                    share_id = args.split('id=')[1].split('&')[0]
                    files = json.loads(db.execute('SELECT files FROM links where id = "'+ share_id+'"')[0][0])
                    file_names = [i.split('/')[-1] for i in files]
                    try:
                        path = files[file_names.index(default_path[1::].split('/',1)[0])]+'/'+default_path.split('/',2)[2]
                    except:
                        path = files[0]
                    
                    send_file(path)
                    print(path)
                    return

                #admin 
                if 'code' in cookie.keys() and cookie['code'].value in acces_codes:
                    send_file(path.split('?')[0])

        else:
            path = './client'+(self.path if self.path !='/' else "/index.html")
            send_file(path)
        
        return
            

    def do_POST(self):
        self.__log_conect()
        check_codes()
        cookie = SimpleCookie(self.headers.get('Cookie'))
        if self.path.split('?')[0] == '/db_execute':
            if 'code' in cookie.keys() and cookie['code'].value in acces_codes:
                sql = (base64.b64decode(self.rfile.read(int(self.headers['Content-Length'])))).decode('utf-8')
                print(sql)
                answer = json.dumps(db.execute(sql))
                print(answer)
                self.send_response(200)
                self.send_header("Content-type", 'text/json')
                self.end_headers()
                self.wfile.write(answer.encode())
                return # freeze server without it, idk what`s wrong (No errors, just freezing) 

        if self.path.split('?')[0] == '/upload':
            if 'code' in cookie.keys() and cookie['code'].value in acces_codes:
                print(self.path)  
                path = (base64.b64decode(bytes(self.path.split('path=',1)[1].split('&',1)[0],encoding='utf8'))).decode('utf-8')
                if '.' in path.split('/')[-1]:
                    data = '\n'.encode().join(self.rfile.read(int(self.headers['Content-Length'])).split('Content-Type:'.encode(),1)[1].split('\n'.encode(),2)[2].split('\n'.encode())[:-2:])
                    with open('./files'+path, 'wb') as fh: 
                        fh.write(data)
                else:
                   os.makedirs('./files'+path) 

                self.send_response(200)
                self.send_header("Content-type", 'text/text')
                self.end_headers()
                self.wfile.write(''.encode())

        else:
            post_data = parse_qs(self.rfile.read(int(self.headers['Content-Length'])).decode())
            print(post_data)
            if post_data['type'][0] == 'login':
                if post_data['password'][0] == settings.password:
                    self.send_response(200)
                    self.send_header("Content-type", 'text/html')
                    self.end_headers()

                    if len(list(acces_codes.keys())) !=0:
                        code = list(acces_codes.keys())[0]
                        while code in acces_codes:
                            code = ''.join(random.choices(string.ascii_letters + string.digits, k=256))
                    else:
                        code = ''.join(random.choices(string.ascii_letters + string.digits, k=256))
                    
                    acces_codes[code] = time.time()
                    self.wfile.write(('admin?code='+code).encode())
                else:
                    self.send_response(200)
                    self.send_header("Content-type", 'text/html')
                    self.end_headers()
                    self.wfile.write('error'.encode())
            
            else:
                if 'code' in cookie.keys() and cookie['code'].value in acces_codes:
                    if post_data['type'][0] == 'delete_file':
                            s = post_data['path'][0].split('/files',1)[1]
                            path = './files'+base64.b64decode(bytes(s,encoding='utf8')).decode('utf-8')    
                            if '.' not in path[1::]:
                                shutil.rmtree(path)
                            else:
                                os.remove(path)

                    self.send_response(200)    
                    self.end_headers()  
            return

def run(server_class=HTTPServer, handler_class=HttpHandler):
  server_address = ('', 1210)
  httpd = server_class(server_address, handler_class)
  try:
      httpd.serve_forever()
  except KeyboardInterrupt:
      httpd.server_close()

if __name__ == '__main__':
    run()