#!/usr/bin/python
from SimpleHTTPServer import SimpleHTTPRequestHandler
from BaseHTTPServer import HTTPServer as ServerClass
from socket import error as socket_error
import threading
import logging
import json
import makerbotapi
import sys
import time
import os


ip = '192.168.64.66'
port = 80

httpd = None
makerbot = None

pid = str(os.getpid())
pidfile = os.getcwd() + "//makerbot.pid"


class HandlerClass(SimpleHTTPRequestHandler):
    def log_request(self, format, *args):
        pass


class WebThread(threading.Thread):
    def run(self):
        global httpd
        httpd = ServerClass((ip, port), HandlerClass)
        sa = httpd.socket.getsockname()
        print "Serving HTTP on", sa[0], "port", sa[1], "..."
        logging.getLogger("requests").setLevel(logging.WARNING)
        httpd.serve_forever()


def MakerBotConnect(ip, auth, server):
    global makerbot
    try:
        print "Connecting to", ip, "..."
        makerbot = makerbotapi.Makerbot(ip, auth_code=auth)
        
        if auth == None:
            print "Authenticate with your MakerBot Replicator ..."
            try:
                makerbot.authenticate_fcgi()
                print "Authenticated:", makerbot.auth_code
            except makerbotapi.makerbotapi.AuthenticationError as auth_error:
                print "Authentication not accepted ..."
                ShutdownWebcam()
        else:
            print "Authenticated Accepted!"
            
        makerbot.authenticate_json_rpc()
        print "Connected Successfully!"
        if server:
            WebThread().start()
    except socket_error as serr:
        if serr.errno == 10060:
            print "Socket Error: Check the IP Address and open ports."
            ShutdownWebcam()


def ShutdownWebcam():
    print "Shutting Down ..."
    if httpd:
        httpd.shutdown()
        print "HTTP Server stopped ..."
    os.unlink(pidfile)
    sys.exit()


def WriteJSON():
    with open("makerbot.json", "w") as rawjson:
        rawjson.write(json.dumps(
            makerbot.rpc_request_response(
                'get_system_information',
                {'username': 'conveyor'}
            )
        ))


if __name__ == '__main__':
    if os.path.isfile(pidfile):
        print "Instance already running! (%s)" % pidfile
        sys.exit()
    else:
        file(pidfile, 'w').write(pid)
        
    if len(sys.argv) < 2:
        print "args: <ip address> [auth code] [web server]"
        ShutdownWebcam()

    makerbot_ip = sys.argv[1]
    makerbot_auth = None
    makerbot_server = False

    if len(sys.argv) == 3:
        if sys.argv[2].lower() == 'true':
            makerbot_server = True
        else:
            makerbot_auth = sys.argv[2]

    if len(sys.argv) == 4:
        makerbot_auth = sys.argv[2]
        if sys.argv[3].lower() == 'true':
            makerbot_server = True

    try:
        MakerBotConnect(makerbot_ip, makerbot_auth, makerbot_server)
        while True:
            if makerbot:
                WriteJSON()
                makerbot.save_camera_png(os.getcwd() + "\\makerbot.png")
                time.sleep(0.025)
            else:
                ShutdownWebcam()

    except KeyboardInterrupt:
        ShutdownWebcam()
