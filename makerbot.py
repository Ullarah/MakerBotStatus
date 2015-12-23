#!/usr/bin/python
from socket import error as socket_error
from collections import namedtuple
import threading
import logging
import json
import makerbotapi
import sys
import time
import os
import re


httpd = None
makerbot = None
connection = []

pid = str(os.getpid())
pidfile = os.getcwd() + "//makerbot.pid"
authfile = os.getcwd() + "//makerbot.auth";


class CamThread(threading.Thread):
    def __init__(self, ip):
        threading.Thread.__init__(self)
        self.ip = ip
    def run(self):
        global connection
        while True:
            ip_octet = re.search('(?:\d{1,3}\.\d{1,3}\.)(\d{1,3}\.\d{1,3})', self.ip).group(1)
            if makerbot:
                WriteJSON(ip_octet)
                makerbot.save_camera_png(os.getcwd() + "\\makerbot-" + ip_octet + ".png")
                time.sleep(0.025)
            else:
                print "Lost connection to", self.ip, "..."
                if len(connection) > 1:
                    self.exit()
                else:
                    Shutdown()


def MakerBotConnect(ip, auth):
    global makerbot, connection
    try:
        print "Connecting to", ip, "..."
        makerbot = makerbotapi.Makerbot(ip, auth_code=auth)
        
        connected = False
        
        if auth == None:
            print "Authenticate with your MakerBot Replicator ..."
            try:
                makerbot.authenticate_fcgi()
                print "Authenticated:", makerbot.auth_code
            except makerbotapi.makerbotapi.AuthenticationError as auth_error:
                if len(connection) > 1:
                    print "Authentication not accepted for", ip ,"..."
                    return
                else:
                    print "Authentication not accepted ..."
                    Shutdown()
        else:
            connected = True
            print "Authenticated Accepted!"
            
        if connected:
            makerbot.authenticate_json_rpc()
            print "Connected Successfully!\n"
            CamThread(ip).start()

    except socket_error as serr:
        if serr.errno == 10060:
            print "Socket Error: Cannot connect to", ip, "\n"
            if len(connection) > 1:
                return
            else:
                Shutdown()


def Shutdown():
    print "Shutting Down ..."
    os.unlink(pidfile)
    sys.exit()


def WriteJSON(ip):
    with open("makerbot-" + ip + ".json", "w") as rawjson:
        try:
            rawjson.write(json.dumps(
                makerbot.rpc_request_response(
                    'get_system_information',
                    {'username': 'conveyor'}
                )
            ))
        except:
            CamThread(ip).exit()


def AuthenticationFile():
    global authfile
    authconfig = json.loads(open(authfile).read())
    for printer in authconfig['printers']:
        connection.append(printer['ip'])
    for printer in authconfig['printers']:
        MakerBotConnect(printer['ip'], printer['auth'])


if __name__ == '__main__':
    if os.path.isfile(pidfile):
        print "Instance already running! (%s)" % pidfile
        sys.exit()
    else:
        file(pidfile, 'w').write(pid)

    if os.path.isfile(authfile):
        print "MakerBot Authentication file found ...\n"
        AuthenticationFile()
    else:
        if len(sys.argv) < 2:
            print "No MakerBot Authentication file found ..."
            print "args: <ip address> [auth code]"
            sys.exit()
        else:
            makerbot_ip = sys.argv[1]
            makerbot_auth = None
            makerbot_server = False

            if len(sys.argv) == 3:
                makerbot_auth = sys.argv[2]

            MakerBotConnect(makerbot_ip, makerbot_auth)
