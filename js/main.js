'use strict'

class Roulette {
    constructor() {
        this.ver = 1.05;
        this.selectPat = 0;

        this.table = document.getElementById('NameTable');
        this.nameFile = document.getElementById("inputNameListFile");
        this.selectedDiv = document.getElementById('selected');
        this.chkBox = document.getElementById('pattern');
        this.verDiv = document.getElementById("ver");
        this.verDiv.innerText="ver."+this.ver;

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
        this.rndTable;
        this.nmlTable;
        this.seqTable;
        this.initTable();
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
        addEventListener( 'change' , this.fileLoad);
    }

    _mainLoop = () => {
        this.onenterframe();
        const regex =  /<BR>/g;
        const name = this.selectedName.replaceAll(regex, '');
        this.selectedDiv.innerText = name+"さん";
        requestAnimationFrame( this._mainLoop );
    }

    initTable = () => {
        this.strNomalTable()
        if(this.selectPat==0) {
            this.table.innerHTML = this.nmlTable;
        }
        else {
            this.strRndTable()
            this.table.innerHTML = this.rndTable;
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

    runRoulette = () => {
        if(this.selectPat==0) {
            this.strSeqTable();
            this.table.innerHTML = this.seqTable;
        }
        else {
            this.strRndTable();
            this.table.innerHTML = this.rndTable;
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
                else {
                    if(this.isRndTable) { this.table.innerHTML = this.nmlTable; this.isRndTable=false;}
                    else                { this.table.innerHTML = this.rndTable; this.isRndTable=true; }
                }
                if(n>0) this.runFlush(n-1);
            },
            100
        );
    }

    onenterframe = () => {
        if(this.input.space) {
            if(this.isStarted==false) {
                console.log(this.chkBox.checked)

                if(this.chkBox.checked){
                    this.selectPat=1;
                    this.isRndTable=true;
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
                if(this.selectPat==0) {
                    this.count=0;
                    this.runStep(10);
                    this.isStarted = false;
                }
                else {
                    this.count++;
                    if(this.count < 8) {
                        this.sleep(200*this.count); this.runRoulette();
                    }
                    else {
                        this.runFlush(15);
                        this.isStarted = false;
                    }
                }
             }
        }
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