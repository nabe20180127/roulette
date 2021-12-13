﻿'use strict'

class Roulette {
    constructor() {
        this.ver = 1.06;
        this.selectPat = 0;

        this.table = document.getElementById('NameTable');
        this.nameFile = document.getElementById("inputNameListFile");
        this.selectedDiv = document.getElementById('selected');
        this.chkBox = document.getElementById('pattern');
        this.chkBoxShuffle = document.getElementById('chkShuffle');
        this.verDiv = document.getElementById("ver");
        this.verDiv.innerText="ver."+this.ver;
        this.gNumSel = document.getElementById("grpNum");

        this.rawTxt = "？？？";
        this.nameList = ["？？？"];
        this.skipList = [false];
        this.selectedName = this.nameList[0];

        this.input = {}; //keyの状態
	this._keys = {}; //key の割り当て辞書

        this.target = 0;
        this.curSelected = 0;
        this.count = 0;
        this.isStarted = false;
        this.isRndTable = false;
        this.isSeqTable = true;
        this.sTable = [];
        this.rndTable;
        this.nmlTable;
        this.seqTable;
        this.shuffleTable;
        this.initTable();
        this.gnum = 4;
    }

    start = () => {
        this.keybind('space', ' ');
        this._mainLoop();
        this._setEventListener();
    }

    keybind = ( name, key ) => {
        this._keys[name] = key;
        this.input[name] = false;
    }

    _keyEvent = e => {
        e.preventDefault();
        for ( let key in this._keys ) {
            switch ( e.type ) {
                case 'keydown' :
                    if ( e.key === this._keys[key] ) this.input[key] = true;
                        break;
                case 'keyup' :
                    if ( e.key === this._keys[key] ) this.input[key] = false;
                        break;
            }
        }
    }

    onChange = e => {

        if(e.target==this.nameFile) {
            this.fileLoad();
        }

        if(e.target==this.gNumSel) {
            this.gnum = this.gNumSel.value;
            this.initTable();
            console.log("numSel");
        }

        if(e.target==this.chkBoxShuffle) {
            this.gNumSel.disabled = !this.chkBoxShuffle.checked;
            console.log("chkBox");
        }

        if(this.chkBox.checked){
            this.selectPat=1;
        }
        else if(this.chkBoxShuffle.checked){
            this.selectPat=2;
        }
        else {
            this.selectPat=0;
        }
    }


    fileLoad = () => {
        const file_list = this.nameFile.files;
        if (!file_list) return;

        const file = file_list[0];
        if(!file) return;

        const file_reader = new FileReader()

        if(file.type.indexOf("text") == 0){
            file_reader.onload = e => {
                const regex =  /[\r\n]/g
                this.rawTxt = file_reader.result;
                this.rawTxt = this.rawTxt.replaceAll(regex, '')
                const list = this.rawTxt.split(',');

                this.nameList = [];
                this.skipList = [];

                for (let i=0;i<list.length;i++) {
                    const attr = list[i].split(":");
                    if(attr.length>=1) this.nameList.push(attr[0]);

                    if(attr.length>=2)
                        if(attr[1]=="skip") this.skipList.push(true);
                        else                this.skipList.push(false);
                    else                    this.skipList.push(false);
                }
                this.initTable();
            };
            file_reader.readAsText(file);
        }
    }

    _setEventListener = () => {
        addEventListener( 'keydown', this._keyEvent, {passive: false});
        addEventListener( 'keyup'  , this._keyEvent, {passive: false});
        addEventListener( 'change' , this.onChange);
    }

    _mainLoop = () => {
        this.onenterframe();
        requestAnimationFrame( this._mainLoop );
    }

    initTable = () => {
        const regex =  /<BR>/g;

        this.strNomalTable()
        if(this.selectPat==0) {
            this.table.innerHTML = this.nmlTable;
            const name = this.selectedName.replaceAll(regex, '');
            this.selectedDiv.innerText = name+"さん";

        }
        else if(this.selectPat==2) {
            this.table.innerHTML = this.nmlTable;
            var sTable = new Array();
            for(let i=0;i<this.nameList.length;i++) {
                sTable.push(i);
            }
            this.sTable = this.shuffle(sTable);
            this.strShuffleTable();
            this.table.innerHTML = this.shuffleTable;
            this.selectedDiv.innerText = "未抽選";

        }
        else {
            this.strRndTable()
            this.table.innerHTML = this.rndTable;
            const name = this.selectedName.replaceAll(regex, '');
            this.selectedDiv.innerText = name+"さん";
        }
    }

    strSeqTable = () => {
        this.curSelected++;
        if(this.curSelected >= this.nameList.length) this.curSelected=0; 

        let h = "";
        for (let i=0;i<this.nameList.length;i++) {
            if(i % 5 == 0) h += "<TR>";

            if(this.curSelected==i) h += "<TD bgcolor='#FF0000'>";
//            else if(this.target==i) h += "<TD bgcolor='#00FF00'>";
            else       h += "<TD>";

            h += this.nameList[i];
            h += "</TD>";
            if(i+1 % 5 == 0) h += "</TR>\n"; 
        }
        this.seqTable = h;
        this.selectedName = this.nameList[this.curSelected];
    }

    strRndTable = () => {
        let rnd;
        do {
            rnd = Math.floor(Math.random() * this.nameList.length);
        }
        while(this.skipList[rnd]==true);

        let h = "";
        for (let i=0;i<this.nameList.length;i++) {
            if(i % 5 == 0) h += "<TR>";

            if(rnd==i) h += "<TD bgcolor='#FF0000'>";
            else       h += "<TD>";

            h += this.nameList[i];
            h += "</TD>";
            if(i+1 % 5 == 0) h += "</TR>\n"; 
        }
        this.rndTable = h;
        this.selectedName = this.nameList[rnd];
    }

    strNomalTable = () => {
        let h = "";
        for (let i=0;i<this.nameList.length;i++) {
            if(i % 5 == 0) h += "<TR>";
            h += "<TD>";
            h += this.nameList[i];
            h += "</TD>";
            if(i+1 % 5 == 0) h += "</TR>\n"; 
        }
        this.nmlTable = h;
    }

    strShuffleTable = () => {

        const regex =  /<BR>/g;
        let name;
        let h = "";
        const num = this.gnum;
        for (let i=0;i<this.nameList.length;i++) {
            // name = this.nameList[this.sTable[i]].replaceAll(regex, '');
            // name = this.sTable[i];
            name = this.nameList[this.sTable[i]];

            if(i % num == 0) {
                h += "<TR>";
                h += "<TD class='gnum' width='100px' bgcolor='#CCCCFF'>第";
                h += (~~(i/num)+1) ;
                h += "グループ</TD>";
            }
            h += "<TD width='150px'>";
            h += name;
            h += "</TD>";
            if(i+1 % num == 0) h += "</TR>\n"; 
        }
        this.shuffleTable = h;
    }

    runRoulette = () => {
        if(this.selectPat==0) {
            this.strSeqTable();
            this.table.innerHTML = this.seqTable;
            const regex =  /<BR>/g;
            const name = this.selectedName.replaceAll(regex, '');
            this.selectedDiv.innerText = name+"さん";
        }
        else if(this.selectPat==2) {
            var sTable = new Array();
            for(let i=0;i<this.nameList.length;i++) {
                sTable.push(i);
            }
            this.sTable = this.shuffle(sTable);
            this.strShuffleTable();
            this.table.innerHTML = this.shuffleTable;
            this.selectedDiv.innerText = "抽選中";
        }
        else {
            this.strRndTable();
            this.table.innerHTML = this.rndTable;
            const regex =  /<BR>/g;
            const name = this.selectedName.replaceAll(regex, '');
            this.selectedDiv.innerText = name+"さん";
        }
    }

    runStep = (n) => {
        setTimeout(
         () => {
             this.runRoulette();
             let tgt;
             if (this.target > this.curSelected ) {
                 tgt = this.target;
             }
             else {
                 tgt = this.target + this.nameList.length;
             }

             if (((tgt-this.curSelected) % this.nameList.length) > 10) {
                 this.runStep(10);
             }
             else if (((this.curSelected) % this.nameList.length) != this.target) {
                 this.runStep(50*this.count++);
             }
             else {
                 this.runFlush(15);
             }
         },
         n
        )
    }

    runFlush = n => {
        setTimeout(
            () => { 
                if(this.selectPat==0) {
                    if(this.isSeqTable) { this.table.innerHTML = this.nmlTable; this.isSeqTable=false;}
                    else                { this.table.innerHTML = this.seqTable; this.isSeqTable=true; }
                }
                else if(this.selectPat==1) {
                    if(this.isRndTable) { this.table.innerHTML = this.nmlTable; this.isRndTable=false;}
                    else                { this.table.innerHTML = this.rndTable; this.isRndTable=true; }
                }
                else {
                    if (n==0) {
                        this.selectedDiv.innerText = "確定";
                    }
                    else {
                        this.selectedDiv.innerText = n;
                        this.runRoulette();
                    }
                    this.table.innerHTML = this.shuffleTable;
                }
                if(n>0) this.runFlush(n-1);
            },
            100
        );
    }

    onenterframe = () => {
        if(this.input.space) {
            if(this.isStarted==false) {

                if(this.chkBox.checked){
                    this.selectPat=1;
                    this.isRndTable=true;
                }
                else if(this.chkBoxShuffle.checked){
                    this.selectPat=2;
                }
                else {
                    this.selectPat=0;
                }

                if(this.selectPat==0) {
                    let rnd;
                    do {
                        rnd = Math.floor(Math.random() * this.nameList.length);
                    }
                    while(this.skipList[rnd]==true);
                    this.target = rnd;
                }
            }
            this.isStarted = true;
            this.count=0;
            this.runRoulette();
        }
        else {
            if(this.isStarted) {
                this.count++;
                let n = 15;
                if(this.selectPat==2) n=0;

                if(this.count < 8) {
                    this.sleep(400*this.count); this.runRoulette();
                }
                else {
                    this.runFlush(n);
                    this.isStarted = false;
                }
             }
        }
    }

    shuffle = ([...array]) => {
        for (let i=array.length-1;i>=0;i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    sleep = waitMsec => {
        const startMsec = new Date();
        while (new Date() - startMsec < waitMsec);
    };

}

addEventListener( 'load', () => {
    const r = new Roulette();
    r.start()
} );