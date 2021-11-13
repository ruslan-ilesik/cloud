import pymysql
import typing

import data as bd


def conect() -> None:
    global conn,cur
    try:
        conn = pymysql.connect(bd.db_local_ip, bd.db_user_name, bd.db_password, bd.db_base)
    except:
       conn = pymysql.connect(bd.db_global_ip, bd.db_user_name, bd.db_password, bd.db_base,port = bd.db_global_port)    
        

    conn.autocommit(True)
    cur = conn.cursor()
    return conn,cur


def disconect(cur,conn) -> None:
    cur.close()
    conn.close()


def execute(sql:str)-> tuple:
    conn.ping(reconnect=True)
    cur.execute(sql)
    conn.commit()
    return cur.fetchall()

conect()