#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import Flask, render_template, request, redirect,Response
from flask_socketio import SocketIO, emit,send
import flask_socketio
import os
import sys
import numpy as np
import torch
import VAD
import logging
import time
from flask_session import Session
from threading import current_thread


app = Flask(__name__)

app.config['SECRET_KEY'] = 'secret!'

app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
async_mode = "threading"
socketio = SocketIO(app, async_mode=async_mode, cors_allowed_origins="*")
RESULT = ""
# Disable Flask Log
# app.logger.disabled = True
# log = logging.getLogger('werkzeug')
# log.disabled = True

@app.route("/",methods = ['POST','GET'])
def index():
    if request.method == 'POST':
        global RESULT
        raw_data = request.data
        raw_data = raw_data[0:len(raw_data) - len(raw_data)%256]
        # print(len(raw_data))
        if (raw_data):
            frame = np.frombuffer(raw_data, dtype='float32') 

        print(frame.size)
        length = frame.size
        frame_size = length/5
        print(frame_size)
        
        for i in range(0,5):
            result = VAD.denoiser_VAD(frame[int(i*frame_size):int((i+1)*frame_size)])
            if result == 1:
                RESULT = "在说话"
            elif result == 0:
                RESULT = "不在说话"
            socketio.emit('my_response',{'data': RESULT})
        return render_template("index.html")
    else:
        return render_template("index.html")

@app.route("/endlive", methods=['POST'])
def denoiser_live():
    # Place holder, currently no use
    return ('', 204)

if __name__ == '__main__':
    socketio.run(app,host = '0.0.0.0', port = 8000)

