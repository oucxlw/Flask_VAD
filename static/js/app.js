URL = window.URL || window.webkitURL;

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
recordButton.addEventListener("click", startlive);
stopButton.addEventListener("click", stoplive);
var gumStream;                     
var rec;                          
var input;              
var state = 0;  
var flag = 0;
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext;
var constraints = { audio: true, video:false };

var Recorder = function(stream) {

    var context = new AudioContext();
    var audioInput = context.createMediaStreamSource(stream);
    var recorder = context.createScriptProcessor(256, 1, 1);
    var audioData = {
        size: 0         
        , buffer: []    
        , inputSampleRate: 44100
        , inputSampleBits: 16     
        , outputSampleRate: 16000
        , oututSampleBits: 16
        , clear: function() {
            this.buffer = [];
            this.size = 0;
        }
        , input: function (data) {
            this.buffer.push(new Float32Array(data));
            this.size += data.length;
        }
        , compress: function () { 
            
            var data = new Float32Array(this.size);
            var offset = 0;
            for (var i = 0; i < this.buffer.length; i++) {
                data.set(this.buffer[i], offset);
                offset += this.buffer[i].length;
            }
        
            var compression = parseInt(this.inputSampleRate / this.outputSampleRate);
            var length = data.length / compression;
            var result = new Float32Array(length);
            var index = 0, j = 0;
            while (index < length) {
                result[index] = data[j];
                j += compression;
                index++;
            }
            return result;
        }
    };
    this.start = function () {
        audioInput.connect(recorder);
        recorder.connect(context.destination);
    }

    this.stop = function () {
        recorder.disconnect();
    }

    this.getCompress = function () {
        return audioData.compress();
    }

    this.clear = function() {
        audioData.clear();
    }

    recorder.onaudioprocess = function (e) {
        audioData.input(e.inputBuffer.getChannelData(0));
    }
};

function init(rec){
    record = rec;
}


navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

function startlive() {
    var start = new Date();
    recordButton.disabled = true;
    stopButton.disabled = false;
    state = 1;

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
        console.log("开始录音");

        init(new Recorder(stream));           
        record.start();
        timeInte=setInterval(function(){
            if(state==1){
                // console.log(record.getCompress());
                var xhr=new XMLHttpRequest();
                xhr.open("POST","/",true);
                xhr.send(record.getCompress());
                record.clear();
                }
            },185); 
    })
}


function stoplive() {
    state = 0;
    console.log("暂停");
    stopButton.disabled = true;
    recordButton.disabled = false;
    record.stop();
    // gumStream.getAudioTracks()[0].stop();

    var xhr=new XMLHttpRequest();
    xhr.onload=function(e) {
        if(this.readyState === 4) {
            console.log("Server returned: ",e.target.responseText);
        }
    };
    xhr.open("POST","/endlive",true);
    xhr.send("fight off!");
}

function streamer(buffers) {
    var xhr=new XMLHttpRequest();
    xhr.open("POST","/",true);
    xhr.send(buffers);
}